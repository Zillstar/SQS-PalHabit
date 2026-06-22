package io.github.luinara.sqs.config;

import io.github.luinara.sqs.authentication.AuthenticationService;
import io.github.luinara.sqs.pokemon.PokemonEntity;
import io.github.luinara.sqs.pokemon.PokemonRepository;
import io.github.luinara.sqs.pokemon.StarterPokemonCatalog;
import io.github.luinara.sqs.task.TaskRepository;
import io.github.luinara.sqs.task.UserTaskRepository;
import io.github.luinara.sqs.task.entity.TaskEntity;
import io.github.luinara.sqs.user.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Profile("dev")
public class DevDataSeeder implements ApplicationRunner {

    private static final String DEMO_USERNAME = "demo";
    private static final String DEMO_PASSWORD = "password123";

    private final AuthenticationService authenticationService;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final UserTaskRepository userTaskRepository;
    private final PokemonRepository pokemonRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DevDataSeeder(
            AuthenticationService authenticationService,
            UserRepository userRepository,
            TaskRepository taskRepository,
            UserTaskRepository userTaskRepository,
            PokemonRepository pokemonRepository
    ) {
        this.authenticationService = authenticationService;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.userTaskRepository = userTaskRepository;
        this.pokemonRepository = pokemonRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedPokemon();
        seedDemoUser();
        seedTasks();
    }

    private void seedDemoUser() {
        var demoUser = userRepository.findByUsernameIgnoreCase(DEMO_USERNAME);

        if (demoUser.isPresent()) {
            var user = demoUser.get();
            user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
            if (user.getCurrentPokemonId() == null) {
                user.setCurrentPokemonId(1);
            }
            resetDemoProgress(user);
            userRepository.save(user);
            return;
        }

        authenticationService.createUser(DEMO_USERNAME, DEMO_PASSWORD);
        userRepository.findByUsernameIgnoreCase(DEMO_USERNAME)
                .ifPresent(user -> {
                    resetDemoProgress(user);
                    userRepository.save(user);
                });
    }

    private void resetDemoProgress(io.github.luinara.sqs.user.UserEntity user) {
        if (user.getId() != null) {
            userTaskRepository.deleteByUserId(user.getId());
        }

        if (user.getCurrentPokemonId() == null) {
            user.setCurrentPokemonId(1);
        }
        user.setEgg(true);
        user.setHappiness(60);
        user.setHydrationMl(0);
        user.setHunger(0);
        user.setPokemonLevel(1);
        user.setPokemonXp(0);
        user.setPendingFeedPoints(0);
        user.setLastTaskCompletionDate(null);
        user.setLastDailyResetAt(null);
        user.setLastLevelUpAt(null);
        user.setHatchedAt(null);
    }

    private void seedPokemon() {
        for (StarterPokemonCatalog.StarterPokemonSeed pokemon : StarterPokemonCatalog.all()) {
            PokemonEntity entity = pokemonRepository.findById(pokemon.id()).orElseGet(PokemonEntity::new);
            entity.setId(pokemon.id());
            entity.setName(pokemon.name());
            entity.setImageUrl(pokemon.imageUrl());
            entity.setEvolutionId(pokemon.evolutionId());
            entity.setEvolutionStage(pokemon.evolutionStage());
            pokemonRepository.save(entity);
        }
    }

    private void seedTasks() {
        for (SeedTask task : defaultTasks()) {
            var existingTask = taskRepository.findByTitle(task.title());

            for (String legacyTitle : task.legacyTitles()) {
                if (existingTask.isPresent()) {
                    break;
                }

                existingTask = taskRepository.findByTitle(legacyTitle);
            }

            TaskEntity entity = existingTask.orElseGet(() -> {
                TaskEntity newTask = new TaskEntity();
                return newTask;
            });

            entity.setTitle(task.title());
            entity.setDescription(task.description());
            entity.setFeedPoints(task.feedPoints());
            taskRepository.save(entity);
        }
    }

    private List<SeedTask> defaultTasks() {
        return List.of(
                new SeedTask(
                        "Wasser trinken",
                        List.of(),
                        "Trinke Wasser und speichere deinen Fortschritt im Backend.",
                        10
                ),
                new SeedTask(
                        "30 Minuten lernen",
                        List.of(),
                        "Schließe eine fokussierte Lerneinheit ab.",
                        20
                ),
                new SeedTask(
                        "Sport erledigen",
                        List.of(),
                        "Bewegung bringt Feed-Punkte für dein Pokémon.",
                        20
                ),
                new SeedTask(
                        "Arbeitsplatz aufräumen",
                        List.of("Clean workspace", "Workspace aufräumen", "Workspace aufraeumen"),
                        "Räume deinen Arbeitsbereich für besseren Fokus auf.",
                        15
                ),
                new SeedTask(
                        "10 Seiten lesen",
                        List.of(),
                        "Lies zehn Seiten und sammle Routinepunkte.",
                        10
                )
        );
    }

    private record SeedTask(
            String title,
            List<String> legacyTitles,
            String description,
            int feedPoints
    ) {
    }
}
