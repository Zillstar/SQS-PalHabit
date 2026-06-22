package io.github.luinara.sqs.authentication;

import io.github.luinara.sqs.pokemon.PokemonEntity;
import io.github.luinara.sqs.pokemon.PokemonRepository;
import io.github.luinara.sqs.pokemon.PokeApiPokemonService;
import io.github.luinara.sqs.pokemon.StarterPokemonCatalog;
import io.github.luinara.sqs.user.UserEntity;
import io.github.luinara.sqs.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Authentication service — simple in-memory implementation for development and tests.
 *
 * - Stores users in a ConcurrentHashMap with BCrypt-hashed passwords (fallback).
 * - In DB-mode uses UserRepository. For DB-mode we rely on HttpSession (session-based auth).
 */
@Service
public class AuthenticationService {

    private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    private static final Duration LOGIN_LOCKOUT_DURATION = Duration.ofMinutes(15);
    private static final int DEFAULT_STARTER_POKEMON_ID = 1;
    private static final int HAPPINESS_DECAY_PER_MISSED_DAY = 25;
    private static final int XP_PENALTY_PER_MISSED_DAY = 10;

    private final Map<String, String> users = new ConcurrentHashMap<>();
    private final Map<String, String> sessions = new ConcurrentHashMap<>();
    private final Map<String, LoginFailure> loginFailures = new ConcurrentHashMap<>();
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private final UserRepository userRepository; // optional
    private final PokemonRepository pokemonRepository; // optional
    private final PokeApiPokemonService pokeApiPokemonService; // optional
    private final Clock clock;

    @Autowired
    public AuthenticationService(
            Optional<UserRepository> userRepository,
            Optional<PokemonRepository> pokemonRepository,
            Optional<PokeApiPokemonService> pokeApiPokemonService,
            Clock clock
    ) {
        // If a JPA repository is available (e.g., when running with database profile), use it.
        this.userRepository = userRepository.orElse(null);
        this.pokemonRepository = pokemonRepository.orElse(null);
        this.pokeApiPokemonService = pokeApiPokemonService.orElse(null);
        this.clock = clock;
    }

    public AuthenticationService(
            Optional<UserRepository> userRepository,
            Optional<PokemonRepository> pokemonRepository,
            Optional<PokeApiPokemonService> pokeApiPokemonService
    ) {
        this(userRepository, pokemonRepository, pokeApiPokemonService, Clock.systemUTC());
    }

    public AuthenticationService(
            Optional<UserRepository> userRepository,
            Optional<PokemonRepository> pokemonRepository
    ) {
        this(userRepository, pokemonRepository, Optional.empty(), Clock.systemUTC());
    }

    public AuthenticationService(Optional<UserRepository> userRepository) {
        this(userRepository, Optional.empty(), Optional.empty(), Clock.systemUTC());
    }

    public AuthenticationService() {
        this.userRepository = null;
        this.pokemonRepository = null;
        this.pokeApiPokemonService = null;
        this.clock = Clock.systemUTC();
    }

    /**
     * Create a new user. Returns true when created, false when username already exists.
     */
    public boolean createUser(String username, String password) {
        return createUser(username, password, null);
    }

    /**
     * Create a new user. Returns true when created, false when username already exists.
     */
    public boolean createUser(String username, String password, Integer starterPokemonId) {

        if (username == null || username.trim().isEmpty() || password == null) {
            throw new InvalidRequestException("username and password must be provided");
        }
        String key = normalizeUsername(username);

        if (userRepository != null) {
            if (userRepository.existsByUsernameIgnoreCase(username)) {
                return false;
            }

            String hash = passwordEncoder.encode(password);
            UserEntity entity = new UserEntity(username, hash);
            entity.setCreatedAt(OffsetDateTime.now());

            assignStarterPokemonIfAvailable(entity, starterPokemonId);
            entity.setEgg(true);
            entity.setHappiness(0);

            try {
                userRepository.save(entity);
                return true;
            } catch (DataIntegrityViolationException ex) {
                return false;
            }
        }

        // Fallback to in-memory store
        if (users.containsKey(key)) {
            return false;
        }
        String hash = passwordEncoder.encode(password);
        users.put(key, hash);
        return true;
    }

    /**
     * Authenticate a user with username and password.
     * Returns an Optional token (in in-memory mode) or Optional username (in DB-mode).
     */
    public Optional<String> login(String username, String password) {
        if (username == null || password == null) {
            return Optional.empty();
        }
        String key = normalizeUsername(username);

        if (isLoginBlocked(key)) {
            return Optional.empty();
        }

        String storedHash = null;
        if (userRepository != null) {
            Optional<UserEntity> opt = userRepository.findByUsernameIgnoreCase(username);
            if (opt.isEmpty()) {
                registerFailedLogin(key);
                return Optional.empty();
            }
            storedHash = opt.get().getPasswordHash();
        } else {
            storedHash = users.get(key);
            if (storedHash == null) {
                registerFailedLogin(key);
                return Optional.empty();
            }
        }

        if (passwordEncoder.matches(password, storedHash)) {
            clearFailedLogins(key);

            if (userRepository != null) {
                // DB-mode: update lastLoginAt and streak, then persist
                Optional<UserEntity> optEntity = userRepository.findByUsernameIgnoreCase(username);
                optEntity.ifPresent(entity -> {
                    OffsetDateTime nowUtc = OffsetDateTime.now(clock)
                            .withOffsetSameInstant(ZoneOffset.UTC);
                    updateLoginProgress(entity, nowUtc);
                    userRepository.save(entity);
                });
                return Optional.of(key); // return canonical username (lowercased key)
            } else {
                // In-memory mode: create token and store in sessions map
                String token = UUID.randomUUID().toString();
                sessions.put(token, key);
                return Optional.of(token);
            }
        }

        registerFailedLogin(key);
        return Optional.empty();
    }

    private void updateLoginProgress(UserEntity entity, OffsetDateTime nowUtc) {
        OffsetDateTime last = entity.getLastLoginAt();
        LocalDate today = nowUtc.toLocalDate();

        if (last == null) {
            entity.setStreak(1);
            entity.setLastLoginAt(nowUtc);
            return;
        }

        LocalDate lastDate = last.withOffsetSameInstant(ZoneOffset.UTC).toLocalDate();

        if (lastDate.isEqual(today)) {
            entity.setLastLoginAt(nowUtc);
            return;
        }

        if (lastDate.isEqual(today.minusDays(1))) {
            entity.setStreak(entity.getStreak() + 1);
            entity.setLastLoginAt(nowUtc);
            return;
        }

        long missedDays = Math.max(0, ChronoUnit.DAYS.between(lastDate, today) - 1);
        entity.setStreak(1);
        applyInactivityPenalty(entity, missedDays);
        entity.setLastLoginAt(nowUtc);
    }

    private void applyInactivityPenalty(UserEntity entity, long missedDays) {
        if (missedDays <= 0) {
            return;
        }

        int happinessLoss = (int) Math.min(Integer.MAX_VALUE, missedDays * HAPPINESS_DECAY_PER_MISSED_DAY);
        applyMotivationDecay(entity, happinessLoss, missedDays);
    }

    private void applyMotivationDecay(UserEntity entity, int motivationLoss, long missedDays) {
        int currentHappiness = entity.getHappiness();

        entity.setHappiness(Math.max(0, currentHappiness - motivationLoss));

        if (currentHappiness > 0) {
            int xpPenalty = (int) Math.min(Integer.MAX_VALUE, missedDays * XP_PENALTY_PER_MISSED_DAY);
            entity.setPokemonXp(Math.max(0, entity.getPokemonXp() - xpPenalty));
        }
    }

    /**
     * Logout the current user / invalidate token (in-memory mode).
     */
    public void logout(String token) {
        if (token == null) return;
        sessions.remove(token);
    }

    /**
     * Validate a token and return the associated username if valid (in-memory mode).
     */
    public Optional<String> validateToken(String token) {
        if (token == null) return Optional.empty();
        String username = sessions.get(token);
        return Optional.ofNullable(username);
    }

    private void assignStarterPokemonIfAvailable(UserEntity entity, Integer starterPokemonId) {
        if (pokemonRepository == null) {
            entity.setCurrentPokemonId(null);
            return;
        }

        int selectedStarterId = starterPokemonId == null ? DEFAULT_STARTER_POKEMON_ID : starterPokemonId;

        if (!StarterPokemonCatalog.allowedStarterIds().contains(selectedStarterId)) {
            throw new InvalidRequestException("starterPokemonId must be one of 1, 4 or 7");
        }

        seedStarterChain(selectedStarterId);
        entity.setCurrentPokemonId(selectedStarterId);
    }

    private void seedStarterChain(int selectedStarterId) {
        for (StarterPokemonCatalog.StarterPokemonSeed seed
                : StarterPokemonCatalog.chainForStarter(selectedStarterId)) {
            Optional<PokemonEntity> existingPokemon = pokemonRepository.findById(seed.id());
            if (existingPokemon.isPresent()) {
                PokemonEntity pokemon = existingPokemon.get();
                if (syncLocalEvolutionMetadata(pokemon, seed)) {
                    pokemonRepository.save(pokemon);
                }
                continue;
            }

            PokeApiPokemonService.PokemonDetails details = loadPokemonDetails(seed);
            PokemonEntity pokemon = new PokemonEntity();
            pokemon.setId(seed.id());
            pokemon.setName(details.name());
            pokemon.setImageUrl(details.imageUrl());
            pokemon.setEvolutionId(seed.evolutionId());
            pokemon.setEvolutionStage(seed.evolutionStage());
            pokemonRepository.save(pokemon);
        }
    }

    private boolean syncLocalEvolutionMetadata(
            PokemonEntity pokemon,
            StarterPokemonCatalog.StarterPokemonSeed seed
    ) {
        boolean changed = false;

        if (!Objects.equals(pokemon.getEvolutionId(), seed.evolutionId())) {
            pokemon.setEvolutionId(seed.evolutionId());
            changed = true;
        }

        if (!Objects.equals(pokemon.getEvolutionStage(), seed.evolutionStage())) {
            pokemon.setEvolutionStage(seed.evolutionStage());
            changed = true;
        }

        return changed;
    }

    private PokeApiPokemonService.PokemonDetails loadPokemonDetails(
            StarterPokemonCatalog.StarterPokemonSeed seed
    ) {
        if (pokeApiPokemonService == null) {
            return new PokeApiPokemonService.PokemonDetails(seed.id(), seed.name(), seed.imageUrl());
        }

        return pokeApiPokemonService.fetchPokemon(seed.id(), seed);
    }

    private boolean isLoginBlocked(String key) {
        LoginFailure failure = loginFailures.get(key);

        if (failure == null || failure.blockedUntil == null) {
            return false;
        }

        if (Instant.now(clock).isBefore(failure.blockedUntil)) {
            return true;
        }

        loginFailures.remove(key);
        return false;
    }

    private void registerFailedLogin(String key) {
        Instant now = Instant.now(clock);
        loginFailures.compute(key, (ignored, previous) -> {
            int attempts = previous == null ? 1 : previous.attempts + 1;
            Instant blockedUntil = attempts >= MAX_FAILED_LOGIN_ATTEMPTS
                    ? now.plus(LOGIN_LOCKOUT_DURATION)
                    : null;

            return new LoginFailure(attempts, blockedUntil);
        });
    }

    private void clearFailedLogins(String key) {
        loginFailures.remove(key);
    }

    private static String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }

    private record LoginFailure(int attempts, Instant blockedUntil) {
    }
}
