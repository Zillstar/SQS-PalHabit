package io.github.luinara.sqs.user;

import io.github.luinara.sqs.user.dto.GameStateDto;
import io.github.luinara.sqs.task.TaskService;
import io.github.luinara.sqs.task.TaskRepository;
import io.github.luinara.sqs.task.UserTaskRepository;
import io.github.luinara.sqs.task.entity.TaskEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private io.github.luinara.sqs.pokemon.PokemonRepository pokemonRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserTaskRepository userTaskRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private TaskService taskService;

    private UserService userService;

    private Clock clock;
    private OffsetDateTime nowUtc;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-06-16T10:00:00Z"), ZoneOffset.UTC);
        nowUtc = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        userService = createUserService(clock, Duration.ofDays(7));
        lenient().when(taskRepository.findAll()).thenReturn(List.of());
        lenient().when(userTaskRepository.findByUserId(any())).thenReturn(List.of());
    }

    @Test
    void getGameState_mapsFieldsCorrectly_and_setsYesterdayLoggedInTrue() {
        UserEntity entity = new UserEntity();
        entity.setUsername("testuser");
        entity.setHydrationMl(120);
        entity.setHunger(50);
        entity.setPokemonLevel(5);
        entity.setPokemonXp(42);
        entity.setHappiness(7);
        entity.setPendingFeedPoints(12);
        entity.setStreak(3);
        entity.setLastLoginAt(nowUtc.minusDays(1)); // yesterday

        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.getGameStateForUsername("testuser");

        assertThat(dto).isNotNull();
        assertThat(dto.getWaterLevel()).isEqualTo(120);
        assertThat(dto.getFoodLevel()).isEqualTo(50);
        assertThat(dto.getPokemonLevel()).isEqualTo(5);
        assertThat(dto.getGrowth()).isEqualTo(42);
        assertThat(dto.getHappiness()).isEqualTo(7);
        assertThat(dto.getPendingFeedPoints()).isEqualTo(12);
        assertThat(dto.getStreak()).isEqualTo(3);
        assertThat(dto.isYesterdayLoggedIn()).isTrue();
        assertThat(dto.getServerNow()).isNotNull();
    }

    @Test
    void getGameState_setsYesterdayLoggedInFalse_whenLastLoginOlder() {
        UserEntity entity = new UserEntity();
        entity.setUsername("olduser");
        entity.setHydrationMl(10);
        entity.setHunger(5);
        entity.setPokemonLevel(1);
        entity.setPokemonXp(5);
        entity.setHappiness(1);
        entity.setStreak(1);
        entity.setLastLoginAt(nowUtc.minusDays(2)); // older than yesterday

        when(userRepository.findByUsernameIgnoreCase("olduser")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.getGameStateForUsername("olduser");

        assertThat(dto).isNotNull();
        assertThat(dto.isYesterdayLoggedIn()).isFalse();
    }

    @Test
    void getGameState_resetsDailyProgress_afterConfiguredIntervalWithoutNewLogin() {
        Clock resetClock = Clock.fixed(Instant.parse("2026-06-16T10:01:00Z"), ZoneOffset.UTC);
        userService = createUserService(resetClock, Duration.ofMinutes(1));

        UserEntity entity = new UserEntity();
        entity.setId(17L);
        entity.setUsername("timer");
        entity.setHydrationMl(3000);
        entity.setStreak(2);
        entity.setLastLoginAt(OffsetDateTime.parse("2026-06-16T10:00:00Z"));

        when(userRepository.findByUsernameIgnoreCase("timer")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.getGameStateForUsername("timer");

        assertThat(dto).isNotNull();
        assertThat(dto.getWaterLevel()).isZero();
        assertThat(dto.getStreak()).isEqualTo(2);
        assertThat(entity.getLastDailyResetAt()).isEqualTo(OffsetDateTime.parse("2026-06-16T10:01:00Z"));
        verify(userTaskRepository).resetCompletionsByUserId(17L);
        verify(userRepository).save(entity);
    }

    @Test
    void getGameState_doesNotResetAgain_beforeNextInterval() {
        Clock resetClock = Clock.fixed(Instant.parse("2026-06-16T10:01:30Z"), ZoneOffset.UTC);
        userService = createUserService(resetClock, Duration.ofMinutes(1));

        UserEntity entity = new UserEntity();
        entity.setId(18L);
        entity.setUsername("timer");
        entity.setHydrationMl(500);
        entity.setLastLoginAt(OffsetDateTime.parse("2026-06-16T10:00:00Z"));
        entity.setLastDailyResetAt(OffsetDateTime.parse("2026-06-16T10:01:00Z"));

        when(userRepository.findByUsernameIgnoreCase("timer")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.getGameStateForUsername("timer");

        assertThat(dto).isNotNull();
        assertThat(dto.getWaterLevel()).isEqualTo(500);
        verify(userTaskRepository, never()).resetCompletionsByUserId(any());
    }

    @Test
    void waterUser_increasesHydration_and_returnsDto() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setHydrationMl(40);
        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.waterUser("tester", 25);

        assertThat(dto).isNotNull();
        assertThat(dto.getWaterLevel()).isEqualTo(65); // 40 + 25
        verify(userRepository).save(entity);
        verify(taskRepository, never()).findByTitle("Wasser trinken");
    }

    @Test
    void waterUser_reachesGoal_completesWaterTask() {
        UserEntity entity = new UserEntity();
        entity.setId(9L);
        entity.setUsername("tester");
        entity.setHydrationMl(2750);
        TaskEntity waterTask = new TaskEntity();
        waterTask.setId(1L);
        waterTask.setTitle("Wasser trinken");

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));
        when(taskRepository.findByTitle("Wasser trinken")).thenReturn(Optional.of(waterTask));

        GameStateDto dto = userService.waterUser("tester", 250);

        assertThat(dto).isNotNull();
        assertThat(dto.getWaterLevel()).isEqualTo(3000);
        verify(taskService).completeTaskForUserEntity(entity, waterTask);
    }

    @Test
    void waterUser_missingWaterTask_stillSavesHydration() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setHydrationMl(2900);

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));
        when(taskRepository.findByTitle("Wasser trinken")).thenReturn(Optional.empty());

        GameStateDto dto = userService.waterUser("tester", 250);

        assertThat(dto).isNotNull();
        assertThat(dto.getWaterLevel()).isEqualTo(3150);
        verify(userRepository).save(entity);
        verifyNoInteractions(taskService);
    }

    @Test
    void feedUser_appliesPendingFeedPoints_and_updatesHappiness() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setPendingFeedPoints(15);
        entity.setHappiness(90);

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.feedUser("tester");

        assertThat(dto).isNotNull();
        // happiness should increase by min(needed=10, pending=15) => +10 -> 100
        assertThat(dto.getHappiness()).isEqualTo(100);
        assertThat(entity.getPendingFeedPoints()).isEqualTo(5);
        verify(userRepository).save(entity);
    }

    @Test
    void getGameStateForUsername_whenNotEgg_includesPokemonImageAndFields() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setEgg(false);
        entity.setCurrentPokemonId(10);
        entity.setHappiness(20);
        entity.setPokemonLevel(5);
        entity.setPokemonXp(30);

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));
        io.github.luinara.sqs.pokemon.PokemonEntity p = new io.github.luinara.sqs.pokemon.PokemonEntity();
        p.setId(10);
        p.setImageUrl("/img/10.png");
        when(pokemonRepository.findById(10)).thenReturn(Optional.of(p));

        GameStateDto dto = userService.getGameStateForUsername("tester");

        assertThat(dto).isNotNull();
        assertThat(dto.getCurrentPokemonId()).isEqualTo(10);
        assertThat(dto.getPokemonImageUrl()).isEqualTo("/img/10.png");
        assertThat(dto.getHappiness()).isEqualTo(20);
        assertThat(dto.getPokemonLevel()).isEqualTo(5);
        assertThat(dto.getGrowth()).isEqualTo(30);
    }

    @Test
    void getGameStateForUsername_whenEggStillSet_includesSelectedPokemonImageAndName() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setEgg(true);
        entity.setCurrentPokemonId(4);

        io.github.luinara.sqs.pokemon.PokemonEntity p = new io.github.luinara.sqs.pokemon.PokemonEntity();
        p.setId(4);
        p.setName("charmander");
        p.setImageUrl("/img/charmander.png");

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));
        when(pokemonRepository.findById(4)).thenReturn(Optional.of(p));

        GameStateDto dto = userService.getGameStateForUsername("tester");

        assertThat(dto).isNotNull();
        assertThat(dto.getCurrentPokemonId()).isEqualTo(4);
        assertThat(dto.isEgg()).isTrue();
        assertThat(dto.getPokemonName()).isNull();
        assertThat(dto.getPokemonImageUrl()).isEqualTo("/assets/egg.png");
    }

    @Test
    void getGameState_userNotFound_returnsNull() {
        when(userRepository.findByUsernameIgnoreCase("nouser")).thenReturn(Optional.empty());
        GameStateDto dto = userService.getGameStateForUsername("nouser");
        assertThat(dto).isNull();
    }

    @Test
    void getGameState_pokemonIdNull_setsPokemonImageNull() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setEgg(false);
        entity.setCurrentPokemonId(null);
        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.getGameStateForUsername("tester");
        assertThat(dto).isNotNull();
        assertThat(dto.getCurrentPokemonId()).isNull();
        assertThat(dto.getPokemonImageUrl()).isNull();
        // pokemonRepository.findById should not be called when pId is null
        verifyNoInteractions(pokemonRepository);
    }

    @Test
    void waterUser_userNotFound_returnsNull() {
        when(userRepository.findByUsernameIgnoreCase("nouser")).thenReturn(Optional.empty());
        GameStateDto dto = userService.waterUser("nouser", 10);
        assertThat(dto).isNull();
        verify(userRepository, never()).save(any());
    }

    @Test
    void feedUser_userNotFound_returnsNull() {
        when(userRepository.findByUsernameIgnoreCase("nouser")).thenReturn(Optional.empty());
        GameStateDto dto = userService.feedUser("nouser");
        assertThat(dto).isNull();
        verify(userRepository, never()).save(any());
    }

    @Test
    void feedUser_pendingZero_returnsDto_andDoesNotSave() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setPendingFeedPoints(0);
        entity.setHappiness(50);

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.feedUser("tester");

        assertThat(dto).isNotNull();
        // when pending <= 0, feedUser should not modify or save the user
        verify(userRepository, never()).save(entity);
        assertThat(dto.getHappiness()).isEqualTo(50);
    }

    @Test
    void testLevelUp_incrementsLevelAndResetsGrowth() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setPokemonLevel(7);
        entity.setPokemonXp(80);
        entity.setEgg(false);

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.testLevelUp("tester");

        assertThat(dto).isNotNull();
        assertThat(entity.getPokemonLevel()).isEqualTo(8);
        assertThat(entity.getPokemonXp()).isZero();
        assertThat(entity.getLastLevelUpAt()).isNotNull();
        assertThat(dto.getPokemonLevel()).isEqualTo(8);
        assertThat(dto.getGrowth()).isZero();
        verify(userRepository).save(entity);
    }

    @Test
    void testLevelUp_hatchesEggAtLevel10() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setPokemonLevel(9);
        entity.setPokemonXp(100);
        entity.setEgg(true);

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.testLevelUp("tester");

        assertThat(dto).isNotNull();
        assertThat(entity.isEgg()).isFalse();
        assertThat(entity.getHatchedAt()).isNotNull();
    }

    @Test
    void testLevelUp_evolvesWhenCrossingEvolutionLevel() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setPokemonLevel(14);
        entity.setPokemonXp(100);
        entity.setEgg(false);
        entity.setCurrentPokemonId(100);

        io.github.luinara.sqs.pokemon.PokemonEntity pokemon = new io.github.luinara.sqs.pokemon.PokemonEntity();
        pokemon.setId(100);
        pokemon.setEvolutionId(101);

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));
        when(pokemonRepository.findById(100)).thenReturn(Optional.of(pokemon));
        when(pokemonRepository.findById(101)).thenReturn(Optional.empty());

        GameStateDto dto = userService.testLevelUp("tester");

        assertThat(dto).isNotNull();
        assertThat(entity.getPokemonLevel()).isEqualTo(15);
        assertThat(entity.getCurrentPokemonId()).isEqualTo(101);
    }

    @Test
    void testLevelUp_userNotFound_returnsNull() {
        when(userRepository.findByUsernameIgnoreCase("nouser")).thenReturn(Optional.empty());

        GameStateDto dto = userService.testLevelUp("nouser");

        assertThat(dto).isNull();
        verify(userRepository, never()).save(any());
    }

    @Test
    void testMotivationDecay_lowersHappinessAndClampsAtZero() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setHappiness(12);
        entity.setPokemonXp(50);

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.testMotivationDecay("tester");

        assertThat(dto).isNotNull();
        assertThat(entity.getHappiness()).isZero();
        assertThat(entity.getPokemonXp()).isEqualTo(40);
        assertThat(dto.getHappiness()).isZero();
        assertThat(dto.getGrowth()).isEqualTo(40);
        verify(userRepository).save(entity);
    }

    @Test
    void testMotivationDecay_clampsAtZeroWithoutLoweringGrowth() {
        UserEntity entity = new UserEntity();
        entity.setUsername("tester");
        entity.setHappiness(0);
        entity.setPokemonXp(15);

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));

        GameStateDto dto = userService.testMotivationDecay("tester");

        assertThat(dto).isNotNull();
        assertThat(entity.getHappiness()).isZero();
        assertThat(entity.getPokemonXp()).isEqualTo(15);
        assertThat(dto.getGrowth()).isEqualTo(15);
        verify(userRepository).save(entity);
    }

    @Test
    void testMotivationDecay_userNotFound_returnsNull() {
        when(userRepository.findByUsernameIgnoreCase("nouser")).thenReturn(Optional.empty());

        GameStateDto dto = userService.testMotivationDecay("nouser");

        assertThat(dto).isNull();
        verify(userRepository, never()).save(any());
    }

    @Test
    void deleteAccount_removesDependentRowsAndUser() {
        UserEntity entity = new UserEntity();
        entity.setId(42L);
        entity.setUsername("tester");

        when(userRepository.findByUsernameIgnoreCase("tester")).thenReturn(Optional.of(entity));
        when(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) > 0 FROM information_schema.tables WHERE LOWER(table_name) = 'user_stats'",
                Boolean.class
        )).thenReturn(true);

        boolean deleted = userService.deleteAccount("tester");

        assertThat(deleted).isTrue();
        verify(userTaskRepository).deleteByUserId(42L);
        verify(jdbcTemplate).update("DELETE FROM user_stats WHERE user_id = ?", 42L);
        verify(userRepository).delete(entity);
    }

    @Test
    void deleteAccount_userNotFound_returnsFalse() {
        when(userRepository.findByUsernameIgnoreCase("nouser")).thenReturn(Optional.empty());

        boolean deleted = userService.deleteAccount("nouser");

        assertThat(deleted).isFalse();
        verify(userTaskRepository, never()).deleteByUserId(any());
        verify(userRepository, never()).delete(any());
    }

    private UserService createUserService(Clock serviceClock, Duration dailyResetInterval) {
        return new UserService(
                userRepository,
                pokemonRepository,
                taskRepository,
                userTaskRepository,
                jdbcTemplate,
                taskService,
                serviceClock,
                dailyResetInterval
        );
    }
}
