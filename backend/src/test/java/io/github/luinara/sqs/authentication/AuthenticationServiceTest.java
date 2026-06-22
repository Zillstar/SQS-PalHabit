package io.github.luinara.sqs.authentication;

import io.github.luinara.sqs.user.UserEntity;
import io.github.luinara.sqs.user.UserRepository;
import io.github.luinara.sqs.pokemon.PokemonEntity;
import io.github.luinara.sqs.pokemon.PokemonRepository;
import io.github.luinara.sqs.pokemon.PokeApiPokemonService;
import io.github.luinara.sqs.pokemon.StarterPokemonCatalog;
import io.github.luinara.sqs.task.UserTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.groups.Tuple.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    private AuthenticationService authService;

    @Mock
    UserRepository repo;

    @Mock
    PokemonRepository pokemonRepository;

    @Mock
    PokeApiPokemonService pokeApiPokemonService;

    @Mock
    UserTaskRepository userTaskRepository;

    @BeforeEach
    void setUp() {
        authService = new AuthenticationService();
    }

    @Test
    void createUserSuccessAndLogin() {
        boolean created = authService.createUser("hugo", "password123");
        assertTrue(created, "user should be created");

        Optional<String> token = authService.login("hugo", "password123");
        assertTrue(token.isPresent(), "login should succeed with correct password");
    }

    @Test
    void createDuplicateUserReturnsFalse() {
        boolean created1 = authService.createUser("bobo", "password123");
        boolean created2 = authService.createUser("bobo", "anotherPass");
        assertTrue(created1);
        assertFalse(created2, "creating a duplicate username should return false");
    }

    @Test
    void loginWithWrongPasswordFails() {
        authService.createUser("peter", "secret123");
        Optional<String> token = authService.login("peter", "wrongpass");
        assertTrue(token.isEmpty(), "login should fail with wrong password");
    }

    @Test
    void login_blocksUserAfterRepeatedFailures() {
        authService.createUser("peter", "secret123");

        for (int index = 0; index < 5; index += 1) {
            assertThat(authService.login("peter", "wrongpass")).isEmpty();
        }

        assertThat(authService.login("peter", "secret123")).isEmpty();
    }

    @Test
    void login_successClearsPreviousFailures() {
        authService.createUser("peter", "secret123");

        assertThat(authService.login("peter", "wrongpass")).isEmpty();
        assertThat(authService.login("peter", "secret123")).isPresent();

        for (int index = 0; index < 4; index += 1) {
            assertThat(authService.login("peter", "wrongpass")).isEmpty();
        }

        assertThat(authService.login("peter", "secret123")).isPresent();
    }

    @Test
    void logoutInvalidatesToken() {
        authService.createUser("dan", "pw12345");
        Optional<String> tokenOpt = authService.login("dan", "pw12345");
        assertTrue(tokenOpt.isPresent());
        String token = tokenOpt.get();

        Optional<String> validBefore = authService.validateToken(token);
        assertTrue(validBefore.isPresent());

        authService.logout(token);

        Optional<String> validAfter = authService.validateToken(token);
        assertTrue(validAfter.isEmpty(), "token should be invalid after logout");
    }

    @Test
    void createUserInvalidArgumentsThrows() {
        assertThrows(InvalidRequestException.class, () -> authService.createUser(null, "pw"));
        assertThrows(InvalidRequestException.class, () -> authService.createUser("", "pw"));
        assertThrows(InvalidRequestException.class, () -> authService.createUser("eve", null));
    }

    @Test
    void inMemory_createLoginLogoutFlow() {
        AuthenticationService svc = new AuthenticationService();

        boolean created = svc.createUser("hugo", "password123");
        assertThat(created).isTrue();

        Optional<String> tokenOpt = svc.login("hugo", "password123");
        assertThat(tokenOpt).isPresent();

        String token = tokenOpt.get();
        Optional<String> validated = svc.validateToken(token);
        assertThat(validated).contains("hugo");

        svc.logout(token);
        assertThat(svc.validateToken(token)).isEmpty();
    }

    @Test
    void inMemory_duplicateCreateReturnsFalse() {
        AuthenticationService svc = new AuthenticationService();

        boolean first = svc.createUser("bobo", "password123");
        boolean second = svc.createUser("bobo", "password123");

        assertThat(first).isTrue();
        assertThat(second).isFalse();
    }

    @Test
    void db_createUser_whenExists_returnsFalse() {
        when(repo.existsByUsernameIgnoreCase("hans")).thenReturn(true);

        AuthenticationService svc = new AuthenticationService(Optional.of(repo));
        boolean created = svc.createUser("hans", "password123");

        assertThat(created).isFalse();
        verify(repo, never()).save(any());
    }

    @Test
    void db_createUser_raceConstraint_returnsFalse() {
        when(repo.existsByUsernameIgnoreCase("david")).thenReturn(false);
        when(repo.save(any())).thenThrow(new DataIntegrityViolationException("unique"));

        AuthenticationService svc = new AuthenticationService(Optional.of(repo));
        boolean created = svc.createUser("david", "password123");

        assertThat(created).isFalse();
        verify(repo).save(any());
    }

    @Test
    void db_createUser_seedsSelectedStarterChainAndAssignsStarter() {
        when(repo.existsByUsernameIgnoreCase("fire")).thenReturn(false);
        when(pokemonRepository.findById(any())).thenReturn(Optional.empty());
        when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AuthenticationService svc = new AuthenticationService(
                Optional.of(repo),
                Optional.of(pokemonRepository)
        );
        boolean created = svc.createUser("fire", "password123", 4);

        assertThat(created).isTrue();

        ArgumentCaptor<UserEntity> userCaptor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repo).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getCurrentPokemonId()).isEqualTo(4);

        ArgumentCaptor<PokemonEntity> pokemonCaptor = ArgumentCaptor.forClass(PokemonEntity.class);
        verify(pokemonRepository, times(3)).save(pokemonCaptor.capture());
        assertThat(pokemonCaptor.getAllValues())
                .extracting(PokemonEntity::getId, PokemonEntity::getName, PokemonEntity::getEvolutionId)
                .containsExactly(
                        tuple(4, "charmander", 5),
                        tuple(5, "charmeleon", 6),
                        tuple(6, "charizard", null)
                );
    }

    @Test
    void db_createUser_usesExternalPokemonDetailsWhenAvailable() {
        when(repo.existsByUsernameIgnoreCase("apiuser")).thenReturn(false);
        when(pokemonRepository.findById(any())).thenReturn(Optional.empty());
        when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(pokeApiPokemonService.fetchPokemon(
                anyInt(),
                any(StarterPokemonCatalog.StarterPokemonSeed.class)
        )).thenAnswer(invocation -> {
            StarterPokemonCatalog.StarterPokemonSeed seed = invocation.getArgument(1);
            return new PokeApiPokemonService.PokemonDetails(
                    seed.id(),
                    seed.name() + "-api",
                    "https://assets.example.test/" + seed.id() + ".png"
            );
        });

        AuthenticationService svc = new AuthenticationService(
                Optional.of(repo),
                Optional.of(pokemonRepository),
                Optional.of(pokeApiPokemonService)
        );
        boolean created = svc.createUser("apiuser", "password123", 1);

        assertThat(created).isTrue();

        ArgumentCaptor<PokemonEntity> pokemonCaptor = ArgumentCaptor.forClass(PokemonEntity.class);
        verify(pokemonRepository, times(3)).save(pokemonCaptor.capture());
        assertThat(pokemonCaptor.getAllValues())
                .extracting(PokemonEntity::getId, PokemonEntity::getName, PokemonEntity::getImageUrl)
                .containsExactly(
                        tuple(1, "bulbasaur-api", "https://assets.example.test/1.png"),
                        tuple(2, "ivysaur-api", "https://assets.example.test/2.png"),
                        tuple(3, "venusaur-api", "https://assets.example.test/3.png")
                );
    }

    @Test
    void db_createUser_reusesExistingPokemonWithoutExternalCall() {
        when(repo.existsByUsernameIgnoreCase("cached")).thenReturn(false);
        when(pokemonRepository.findById(1)).thenReturn(Optional.of(existingPokemon(1, "bulbasaur", 2, 0)));
        when(pokemonRepository.findById(2)).thenReturn(Optional.of(existingPokemon(2, "ivysaur", 3, 1)));
        when(pokemonRepository.findById(3)).thenReturn(Optional.of(existingPokemon(3, "venusaur", null, 2)));
        when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AuthenticationService svc = new AuthenticationService(
                Optional.of(repo),
                Optional.of(pokemonRepository),
                Optional.of(pokeApiPokemonService)
        );
        boolean created = svc.createUser("cached", "password123", 1);

        assertThat(created).isTrue();
        verifyNoInteractions(pokeApiPokemonService);
        verify(pokemonRepository, never()).save(any(PokemonEntity.class));

        ArgumentCaptor<UserEntity> userCaptor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repo).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getCurrentPokemonId()).isEqualTo(1);
    }

    @Test
    void db_createUser_updatesMissingEvolutionMetadataWithoutExternalCall() {
        PokemonEntity existing = existingPokemon(4, "charmander", null, 0);
        when(repo.existsByUsernameIgnoreCase("metadata")).thenReturn(false);
        when(pokemonRepository.findById(4)).thenReturn(Optional.of(existing));
        when(pokemonRepository.findById(5)).thenReturn(Optional.of(existingPokemon(5, "charmeleon", 6, 1)));
        when(pokemonRepository.findById(6)).thenReturn(Optional.of(existingPokemon(6, "charizard", null, 2)));
        when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AuthenticationService svc = new AuthenticationService(
                Optional.of(repo),
                Optional.of(pokemonRepository),
                Optional.of(pokeApiPokemonService)
        );
        boolean created = svc.createUser("metadata", "password123", 4);

        assertThat(created).isTrue();
        assertThat(existing.getName()).isEqualTo("charmander");
        assertThat(existing.getImageUrl()).isEqualTo("https://assets.example.test/4.png");
        assertThat(existing.getEvolutionId()).isEqualTo(5);
        verifyNoInteractions(pokeApiPokemonService);
        verify(pokemonRepository).save(existing);
    }

    @Test
    void db_login_updatesLastLogin() {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        String hash = enc.encode("password123");

        UserEntity entity = new UserEntity("eve", hash);
        when(repo.findByUsernameIgnoreCase("eve")).thenReturn(Optional.of(entity));

        AuthenticationService svc = new AuthenticationService(Optional.of(repo));
        Optional<String> res = svc.login("eve", "password123");

        assertThat(res).isPresent();

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repo).save(captor.capture());
        UserEntity saved = captor.getValue();
        assertThat(saved.getLastLoginAt()).isNotNull();
        assertThat(saved.getLastLoginAt()).isBeforeOrEqualTo(OffsetDateTime.now());
    }

    @Test
    void db_login_incrementsStreak_whenLastLoginWasYesterday() {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        String hash = enc.encode("password123");

        UserEntity entity = new UserEntity("frank", hash);
        entity.setStreak(2);
        entity.setLastLoginAt(OffsetDateTime.now(ZoneOffset.UTC).minusDays(1));
        when(repo.findByUsernameIgnoreCase("frank")).thenReturn(Optional.of(entity));

        AuthenticationService svc = new AuthenticationService(Optional.of(repo));
        Optional<String> res = svc.login("frank", "password123");

        assertThat(res).isPresent();

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repo).save(captor.capture());
        UserEntity saved = captor.getValue();
        assertThat(saved.getStreak()).isEqualTo(3);
    }

    @Test
    void db_login_doesNotResetDailyGoals_whenCalendarDayChanged() {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        String hash = enc.encode("password123");
        Clock fixedClock = Clock.fixed(Instant.parse("2026-06-16T10:00:00Z"), ZoneOffset.UTC);

        UserEntity entity = new UserEntity("daily", hash);
        entity.setId(42L);
        entity.setHydrationMl(2500);
        entity.setStreak(2);
        entity.setLastLoginAt(OffsetDateTime.parse("2026-06-15T09:00:00Z"));
        when(repo.findByUsernameIgnoreCase("daily")).thenReturn(Optional.of(entity));

        AuthenticationService svc = new AuthenticationService(
                Optional.of(repo),
                Optional.empty(),
                Optional.empty(),
                fixedClock
        );
        Optional<String> res = svc.login("daily", "password123");

        assertThat(res).isPresent();

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repo).save(captor.capture());
        UserEntity saved = captor.getValue();
        assertThat(saved.getHydrationMl()).isEqualTo(2500);
        assertThat(saved.getStreak()).isEqualTo(3);
        verify(userTaskRepository, never()).resetCompletionsByUserId(any());
    }

    @Test
    void db_login_doesNotResetDailyGoals_afterConfiguredOneMinuteInterval() {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        String hash = enc.encode("password123");
        Clock fixedClock = Clock.fixed(Instant.parse("2026-06-16T10:01:00Z"), ZoneOffset.UTC);

        UserEntity entity = new UserEntity("quick-reset", hash);
        entity.setId(43L);
        entity.setHydrationMl(1500);
        entity.setStreak(2);
        entity.setLastLoginAt(OffsetDateTime.parse("2026-06-16T10:00:00Z"));
        when(repo.findByUsernameIgnoreCase("quick-reset")).thenReturn(Optional.of(entity));

        AuthenticationService svc = new AuthenticationService(
                Optional.of(repo),
                Optional.empty(),
                Optional.empty(),
                fixedClock
        );
        Optional<String> res = svc.login("quick-reset", "password123");

        assertThat(res).isPresent();

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repo).save(captor.capture());
        UserEntity saved = captor.getValue();
        assertThat(saved.getHydrationMl()).isEqualTo(1500);
        assertThat(saved.getStreak()).isEqualTo(2);
        verify(userTaskRepository, never()).resetCompletionsByUserId(any());
    }

    @Test
    void db_login_resetsStreak_whenLastLoginOlderThanYesterday() {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        String hash = enc.encode("password123");

        UserEntity entity = new UserEntity("grace", hash);
        entity.setStreak(5);
        entity.setLastLoginAt(OffsetDateTime.now(ZoneOffset.UTC).minusDays(3));
        when(repo.findByUsernameIgnoreCase("grace")).thenReturn(Optional.of(entity));

        AuthenticationService svc = new AuthenticationService(Optional.of(repo));
        Optional<String> res = svc.login("grace", "password123");

        assertThat(res).isPresent();

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repo).save(captor.capture());
        UserEntity saved = captor.getValue();
        assertThat(saved.getStreak()).isEqualTo(1);
    }

    @Test
    void db_login_appliesInactivityPenalty_whenUserSkippedFullDay() {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        String hash = enc.encode("password123");
        Clock fixedClock = Clock.fixed(Instant.parse("2026-06-16T10:00:00Z"), ZoneOffset.UTC);

        UserEntity entity = new UserEntity("lazy", hash);
        entity.setId(21L);
        entity.setStreak(4);
        entity.setPokemonLevel(8);
        entity.setPokemonXp(60);
        entity.setHappiness(45);
        entity.setHydrationMl(1800);
        entity.setLastLevelUpAt(OffsetDateTime.parse("2026-06-13T10:00:00Z"));
        entity.setLastLoginAt(OffsetDateTime.parse("2026-06-14T09:00:00Z"));
        when(repo.findByUsernameIgnoreCase("lazy")).thenReturn(Optional.of(entity));

        AuthenticationService svc = new AuthenticationService(
                Optional.of(repo),
                Optional.empty(),
                Optional.empty(),
                fixedClock
        );
        Optional<String> res = svc.login("lazy", "password123");

        assertThat(res).isPresent();

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repo).save(captor.capture());
        UserEntity saved = captor.getValue();
        assertThat(saved.getStreak()).isEqualTo(1);
        assertThat(saved.getPokemonLevel()).isEqualTo(8);
        assertThat(saved.getPokemonXp()).isEqualTo(50);
        assertThat(saved.getHappiness()).isEqualTo(20);
        assertThat(saved.getHydrationMl()).isEqualTo(1800);
        assertThat(saved.getLastLevelUpAt()).isEqualTo(OffsetDateTime.parse("2026-06-13T10:00:00Z"));
        assertThat(saved.getLastLoginAt()).isEqualTo(OffsetDateTime.parse("2026-06-16T10:00:00Z"));
        verify(userTaskRepository, never()).resetCompletionsByUserId(any());
    }

    @Test
    void db_login_clampsMotivationAtZeroAndAppliesXpPenalty() {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        String hash = enc.encode("password123");
        Clock fixedClock = Clock.fixed(Instant.parse("2026-06-16T10:00:00Z"), ZoneOffset.UTC);

        UserEntity entity = new UserEntity("tired", hash);
        entity.setStreak(2);
        entity.setPokemonLevel(1);
        entity.setPokemonXp(30);
        entity.setHappiness(5);
        entity.setLastLoginAt(OffsetDateTime.parse("2026-06-14T09:00:00Z"));
        when(repo.findByUsernameIgnoreCase("tired")).thenReturn(Optional.of(entity));

        AuthenticationService svc = new AuthenticationService(
                Optional.of(repo),
                Optional.empty(),
                Optional.empty(),
                fixedClock
        );
        Optional<String> res = svc.login("tired", "password123");

        assertThat(res).isPresent();

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(repo).save(captor.capture());
        UserEntity saved = captor.getValue();
        assertThat(saved.getPokemonLevel()).isEqualTo(1);
        assertThat(saved.getHappiness()).isZero();
        assertThat(saved.getPokemonXp()).isEqualTo(20);
    }

    @Test
    void login_withNullUsernameOrPassword_returnsEmpty() {
        AuthenticationService svc = new AuthenticationService();
        Optional<String> r1 = svc.login(null, "pw");
        Optional<String> r2 = svc.login("user", null);
        assertTrue(r1.isEmpty());
        assertTrue(r2.isEmpty());
    }

    @Test
    void login_withEmptyUsernameOrPassword_returnsEmpty_whenNoSuchUser() {
        AuthenticationService svc = new AuthenticationService();
        // no user created for empty username -> should return empty
        Optional<String> r1 = svc.login("", "pw");
        Optional<String> r2 = svc.login("user", "");
        assertTrue(r1.isEmpty());
        assertTrue(r2.isEmpty());
    }

    private static PokemonEntity existingPokemon(
            int id,
            String name,
            Integer evolutionId,
            int evolutionStage
    ) {
        PokemonEntity pokemon = new PokemonEntity();
        pokemon.setId(id);
        pokemon.setName(name);
        pokemon.setImageUrl("https://assets.example.test/" + id + ".png");
        pokemon.setEvolutionId(evolutionId);
        pokemon.setEvolutionStage(evolutionStage);
        return pokemon;
    }
}
