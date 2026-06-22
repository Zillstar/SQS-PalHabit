package io.github.luinara.sqs.user;

import io.github.luinara.sqs.pokemon.PokemonRepository;
import io.github.luinara.sqs.pokemon.PokemonEntity;
import io.github.luinara.sqs.task.TaskRepository;
import io.github.luinara.sqs.task.TaskService;
import io.github.luinara.sqs.task.UserTaskRepository;
import io.github.luinara.sqs.user.dto.GameStateDto;
import io.github.luinara.sqs.user.dto.TaskCompletionDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final String WATER_TASK_TITLE = "Wasser trinken";
    private static final int WATER_GOAL_ML = 3000;
    private static final int FIRST_EVOLUTION_LEVEL = 15;
    private static final int FINAL_EVOLUTION_LEVEL = 35;
    private static final int HAPPINESS_DECAY_PER_MISSED_DAY = 25;
    private static final int XP_PENALTY_PER_MOTIVATION_DECAY = 10;
    private static final Duration DEFAULT_DAILY_RESET_INTERVAL = Duration.ofHours(24);

    private final UserRepository userRepository;
    private final PokemonRepository pokemonRepository;
    private final TaskRepository taskRepository;
    private final UserTaskRepository userTaskRepository;
    private final JdbcTemplate jdbcTemplate;
    private final TaskService taskService;
    private final Clock clock;
    private final Duration dailyResetInterval;

    @Autowired
    public UserService(
            UserRepository userRepository,
            PokemonRepository pokemonRepository,
            TaskRepository taskRepository,
            UserTaskRepository userTaskRepository,
            JdbcTemplate jdbcTemplate,
            TaskService taskService,
            Clock clock,
            @Value("${pokehabit.daily-reset-interval:PT24H}") Duration dailyResetInterval
    ) {
        this.userRepository = userRepository;
        this.pokemonRepository = pokemonRepository;
        this.taskRepository = taskRepository;
        this.userTaskRepository = userTaskRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.taskService = taskService;
        this.clock = clock;
        this.dailyResetInterval = sanitizeDailyResetInterval(dailyResetInterval);
    }

    UserService(
            UserRepository userRepository,
            PokemonRepository pokemonRepository,
            TaskRepository taskRepository,
            UserTaskRepository userTaskRepository,
            JdbcTemplate jdbcTemplate,
            TaskService taskService,
            Clock clock
    ) {
        this(
                userRepository,
                pokemonRepository,
                taskRepository,
                userTaskRepository,
                jdbcTemplate,
                taskService,
                clock,
                DEFAULT_DAILY_RESET_INTERVAL
        );
    }

    @Transactional
    public GameStateDto getGameStateForUsername(String username) {
        Optional<UserEntity> opt = userRepository.findByUsernameIgnoreCase(username);
        if (opt.isEmpty()) {
            return null; // caller should handle null -> 401 or 404
        }
        UserEntity user = opt.get();
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        applyDailyResetIfDue(user, now);

        GameStateDto dto = new GameStateDto();
        dto.setWaterLevel(user.getHydrationMl());
        dto.setFoodLevel(user.getHunger());
        dto.setEgg(user.isEgg());

        Integer pId = user.getCurrentPokemonId();
        dto.setCurrentPokemonId(pId);
        Optional<PokemonEntity> currentPokemon = pId == null
                ? Optional.empty()
                : pokemonRepository.findById(pId);

        if (user.isEgg()) {
            dto.setPokemonImageUrl("/assets/egg.png");
        } else {
            currentPokemon.ifPresent(pokemon -> dto.setPokemonName(pokemon.getName()));
            dto.setPokemonImageUrl(currentPokemon.map(PokemonEntity::getImageUrl).orElse(null));
        }

        dto.setPokemonLevel(user.getPokemonLevel());
        dto.setGrowth(user.getPokemonXp());
        dto.setHappiness(user.getHappiness());
        dto.setPendingFeedPoints(user.getPendingFeedPoints());
        dto.setTasks(buildTaskCompletions(user));
        dto.setStreak(user.getStreak());
        // yesterdayLoggedIn helper: compute from lastLoginAt
        OffsetDateTime last = user.getLastLoginAt();
        boolean yesterdayLoggedIn = false;
        if (last != null) {
            // if last login falls on previous UTC day
            if (last.withOffsetSameInstant(ZoneOffset.UTC).toLocalDate().isEqual(now.toLocalDate().minusDays(1))) {
                yesterdayLoggedIn = true;
            }
        }
        dto.setYesterdayLoggedIn(yesterdayLoggedIn);
        dto.setServerNow(now.toString());
        return dto;
    }

    private List<TaskCompletionDto> buildTaskCompletions(UserEntity user) {
        Map<Long, Boolean> completedByTaskId = userTaskRepository.findByUserId(user.getId()).stream()
                .collect(Collectors.toMap(
                        userTask -> userTask.getTaskId(),
                        userTask -> userTask.isCompleted(),
                        (first, second) -> first || second
                ));

        return taskRepository.findAll().stream()
                .map(task -> new TaskCompletionDto(
                        task.getId(),
                        task.getTitle(),
                        completedByTaskId.getOrDefault(task.getId(), false)
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public GameStateDto waterUser(String username, int ml) {
        var opt = userRepository.findByUsernameIgnoreCase(username);
        if (opt.isEmpty()) return null;
        UserEntity user = opt.get();
        applyDailyResetIfDue(user, OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC));
        user.setHydrationMl(user.getHydrationMl() + ml);
        userRepository.save(user);
        completeWaterTaskIfReady(user);
        return getGameStateForUsername(username);
    }

    private void completeWaterTaskIfReady(UserEntity user) {
        if (user.getHydrationMl() < WATER_GOAL_ML) {
            return;
        }

        taskRepository.findByTitle(WATER_TASK_TITLE)
                .ifPresent(task -> taskService.completeTaskForUserEntity(user, task));
    }

    public GameStateDto feedUser(String username) {
        var opt = userRepository.findByUsernameIgnoreCase(username);
        if (opt.isEmpty()) return null;
        UserEntity user = opt.get();
        applyDailyResetIfDue(user, OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC));
        int pending = user.getPendingFeedPoints();
        if (pending <= 0) return getGameStateForUsername(username);
        int needed = 100 - user.getHappiness();
        int toApply = Math.min(needed, pending);
        user.setHappiness(Math.min(100, user.getHappiness() + toApply));
        user.setPendingFeedPoints(pending - toApply);
        userRepository.save(user);
        return getGameStateForUsername(username);
    }

    @Transactional
    public GameStateDto testLevelUp(String username) {
        var opt = userRepository.findByUsernameIgnoreCase(username);
        if (opt.isEmpty()) return null;

        UserEntity user = opt.get();
        int oldLevel = user.getPokemonLevel();
        int newLevel = oldLevel + 1;
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        user.setPokemonLevel(newLevel);
        user.setPokemonXp(0);
        user.setLastLevelUpAt(now);

        if (user.isEgg() && newLevel >= 10) {
            user.setEgg(false);
            user.setHatchedAt(now);
        }

        if (oldLevel < FIRST_EVOLUTION_LEVEL && newLevel >= FIRST_EVOLUTION_LEVEL) {
            attemptEvolution(user);
        }
        if (oldLevel < FINAL_EVOLUTION_LEVEL && newLevel >= FINAL_EVOLUTION_LEVEL) {
            attemptEvolution(user);
        }

        userRepository.save(user);
        return getGameStateForUsername(username);
    }

    @Transactional
    public GameStateDto testMotivationDecay(String username) {
        var opt = userRepository.findByUsernameIgnoreCase(username);
        if (opt.isEmpty()) return null;

        UserEntity user = opt.get();
        applyMotivationDecay(user, HAPPINESS_DECAY_PER_MISSED_DAY);
        userRepository.save(user);

        return getGameStateForUsername(username);
    }

    @Transactional
    public boolean deleteAccount(String username) {
        var opt = userRepository.findByUsernameIgnoreCase(username);
        if (opt.isEmpty()) return false;

        UserEntity user = opt.get();
        Long userId = user.getId();

        userTaskRepository.deleteByUserId(userId);
        deleteUserStatsIfPresent(userId);
        userRepository.delete(user);

        return true;
    }

    private void deleteUserStatsIfPresent(Long userId) {
        try {
            Boolean tableExists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) > 0 FROM information_schema.tables WHERE LOWER(table_name) = 'user_stats'",
                    Boolean.class
            );

            if (Boolean.TRUE.equals(tableExists)) {
                jdbcTemplate.update("DELETE FROM user_stats WHERE user_id = ?", userId);
            }
        } catch (DataAccessException ignored) {
            // The Spring JPA test schema does not always include the Prisma-owned stats table.
        }
    }

    private void attemptEvolution(UserEntity user) {
        Integer currentId = user.getCurrentPokemonId();
        if (currentId == null) return;

        pokemonRepository.findById(currentId)
                .map(pokemon -> pokemon.getEvolutionId())
                .ifPresent(user::setCurrentPokemonId);
    }

    private void applyMotivationDecay(UserEntity user, int motivationLoss) {
        int currentHappiness = user.getHappiness();

        user.setHappiness(Math.max(0, currentHappiness - motivationLoss));

        if (currentHappiness > 0) {
            user.setPokemonXp(Math.max(0, user.getPokemonXp() - XP_PENALTY_PER_MOTIVATION_DECAY));
        }
    }

    private void applyDailyResetIfDue(UserEntity user, OffsetDateTime nowUtc) {
        OffsetDateTime resetAnchor = resolveResetAnchor(user);

        if (Duration.between(resetAnchor.toInstant(), nowUtc.toInstant()).compareTo(dailyResetInterval) < 0) {
            return;
        }

        user.setHydrationMl(0);
        user.setLastDailyResetAt(nowUtc);

        if (user.getId() != null) {
            userTaskRepository.resetCompletionsByUserId(user.getId());
        }

        userRepository.save(user);
    }

    private OffsetDateTime resolveResetAnchor(UserEntity user) {
        if (user.getLastDailyResetAt() != null) {
            return user.getLastDailyResetAt().withOffsetSameInstant(ZoneOffset.UTC);
        }

        if (user.getLastLoginAt() != null) {
            return user.getLastLoginAt().withOffsetSameInstant(ZoneOffset.UTC);
        }

        return user.getCreatedAt().withOffsetSameInstant(ZoneOffset.UTC);
    }

    private static Duration sanitizeDailyResetInterval(Duration interval) {
        if (interval == null || interval.isZero() || interval.isNegative()) {
            return DEFAULT_DAILY_RESET_INTERVAL;
        }

        return interval;
    }
}
