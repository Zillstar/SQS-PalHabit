import { AppStateService } from "../../../frontend/src/app/core/services/app-state.service";
import { PET_RULES } from "../../../frontend/src/app/shared/mock/mock-data";
import {
  BackendApiError,
  DashboardSnapshot,
} from "../../../frontend/src/app/core/services/backend-api.service";
import { GameState } from "../../../frontend/src/app/shared/models/app-state.model";
import { AppUser } from "../../../frontend/src/app/shared/models/user.model";

const ACTIVE_USERNAME_STORAGE_KEY = "sqs.backend.activeUsername";

describe("AppStateService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("meldet sich an, speichert den Session-Spielernamen und setzt den Dashboard-State", async () => {
    const backendApi = createBackendApiMock({
      login: createSnapshot(1, 25),
    });
    const service = new AppStateService(backendApi);

    const result = await service.login({
      username: "mira",
      password: "password123",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("mira");
    expect(backendApi.login).toHaveBeenCalledWith("mira", "password123");
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.userName).toBe("mira");
    expect(service.pet()?.growthProgress).toBe(25);
    expect(globalThis.localStorage.getItem(ACTIVE_USERNAME_STORAGE_KEY)).toBe(
      "mira",
    );
  });

  it("registriert neue Nutzer und merkt sich die Backend-Session", async () => {
    const backendApi = createBackendApiMock({
      signup: createSnapshot(1, 0, "nova"),
    });
    const service = new AppStateService(backendApi);

    const result = await service.register({
      username: "nova",
      password: "password123",
      userName: "Nova",
      starterPokemonSpecies: "charmander",
    });

    expect(result).toEqual({
      success: true,
      message: "Profil erstellt: nova.",
    });
    expect(backendApi.signup).toHaveBeenCalledWith({
      username: "nova",
      password: "password123",
      userName: "Nova",
      starterPokemonSpecies: "charmander",
    });
    expect(service.user()?.userName).toBe("nova");
    expect(globalThis.localStorage.getItem(ACTIVE_USERNAME_STORAGE_KEY)).toBe(
      "nova",
    );
  });

  it("ignoriert eine Sprite-URL, die nicht zur aktuellen Pokemon-ID passt", async () => {
    const snapshot = createSnapshot(10, 0);
    snapshot.backendGameState.currentPokemonId = 4;
    snapshot.backendGameState.pokemonImageUrl =
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png";

    const backendApi = createBackendApiMock({ login: snapshot });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });

    expect(service.pokemonImageUrl()).toBeNull();
  });

  it("nutzt das Backend-Ei-PNG auch wenn die Starter-ID nicht im Dateinamen steckt", async () => {
    const snapshot = createSnapshot(1, 0);
    snapshot.backendGameState.currentPokemonId = 4;
    snapshot.backendGameState.isEgg = true;
    snapshot.backendGameState.pokemonImageUrl = "/assets/egg.png";

    const backendApi = createBackendApiMock({ login: snapshot });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });

    expect(service.pokemonImageUrl()).toBe("/assets/egg.png");
  });

  it("nutzt eine Sprite-URL, wenn sie zur aktuellen Pokemon-ID passt", async () => {
    const snapshot = createSnapshot(10, 0);
    snapshot.backendGameState.currentPokemonId = 4;
    snapshot.backendGameState.pokemonImageUrl =
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png";

    const backendApi = createBackendApiMock({ login: snapshot });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });

    expect(service.pokemonImageUrl()).toContain("/4.png");
  });

  it("restauriert eine gespeicherte Session über das Backend", async () => {
    globalThis.localStorage.setItem(ACTIVE_USERNAME_STORAGE_KEY, "mira");
    const backendApi = createBackendApiMock({
      loadDashboard: createSnapshot(3, 70),
    });
    const service = new AppStateService(backendApi);

    await expect(service.restoreSession()).resolves.toBe(true);

    expect(backendApi.loadDashboard).toHaveBeenCalledWith("mira");
    expect(service.user()?.userName).toBe("mira");
    expect(service.pet()?.level).toBe(3);
    expect(service.isLoading()).toBe(false);
  });

  it("räumt eine gespeicherte Session auf, wenn Restore fehlschlägt", async () => {
    globalThis.localStorage.setItem(ACTIVE_USERNAME_STORAGE_KEY, "mira");
    const backendApi = createBackendApiMock({
      loadDashboardError: new BackendApiError(401, "unauthenticated"),
    });
    const service = new AppStateService(backendApi);

    await expect(service.restoreSession()).resolves.toBe(false);

    expect(service.isAuthenticated()).toBe(false);
    expect(
      globalThis.localStorage.getItem(ACTIVE_USERNAME_STORAGE_KEY),
    ).toBeNull();
  });

  it("meldet ab und leert lokalen Session-State", async () => {
    globalThis.localStorage.setItem(ACTIVE_USERNAME_STORAGE_KEY, "mira");
    const backendApi = createBackendApiMock({
      login: createSnapshot(1, 0),
    });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });
    await service.logout();

    expect(backendApi.logout).toHaveBeenCalledOnce();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(
      globalThis.localStorage.getItem(ACTIVE_USERNAME_STORAGE_KEY),
    ).toBeNull();
  });

  it("löscht den Account und beendet die lokale Session", async () => {
    const backendApi = createBackendApiMock({
      login: createSnapshot(1, 0),
    });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });
    const result = await service.deleteAccount();

    expect(result).toEqual({
      success: true,
      message: "Profil gelöscht.",
    });
    expect(backendApi.deleteAccount).toHaveBeenCalledOnce();
    expect(service.isAuthenticated()).toBe(false);
  });

  it("zeigt Server-Fehlertexte beim Login unverändert an", async () => {
    const backendApi = createBackendApiMock({
      loginError: new BackendApiError(404, "Server nicht erreichbar."),
    });
    const service = new AppStateService(backendApi);

    await expect(
      service.login({ username: "mira", password: "password123" }),
    ).resolves.toEqual({
      success: false,
      message: "Server nicht erreichbar.",
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it("speichert Wasser über das Backend und zeigt Hydration-Feedback", async () => {
    const waterSnapshot = createSnapshot(1, 10);
    waterSnapshot.backendGameState.waterLevel = 500;

    const backendApi = createBackendApiMock({
      login: createSnapshot(1, 0),
      addWater: waterSnapshot,
    });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });
    await service.addWater(500);

    expect(backendApi.addWater).toHaveBeenCalledWith("mira", 500, "bulbasaur");
    expect(service.waterLevel()).toBe(500);
    expect(service.lastGameFeedback()).toMatchObject({
      kind: "hydration",
      message: "+500 ml Wasser getrunken.",
    });
  });

  it("setzt Quest-Punkte für das Pokémon ein und zeigt Feedback", async () => {
    const initialSnapshot = createSnapshot(1, 0);
    initialSnapshot.gameState.pet.availableFoodPoints = PET_RULES.feedCost;
    initialSnapshot.backendGameState.pendingFeedPoints = PET_RULES.feedCost;

    const fedSnapshot = createSnapshot(1, 10);
    fedSnapshot.gameState.pet.availableFoodPoints = 0;
    fedSnapshot.backendGameState.pendingFeedPoints = 0;
    fedSnapshot.backendGameState.happiness = 1;

    const backendApi = createBackendApiMock({
      login: initialSnapshot,
      feed: fedSnapshot,
    });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });
    await service.feedPet();

    expect(backendApi.feed).toHaveBeenCalledWith("mira", "bulbasaur");
    expect(service.pet()?.availableFoodPoints).toBe(0);
    expect(service.lastGameFeedback()).toMatchObject({
      kind: "feeding",
      message: "Fortschritt wurde für deinen Partner eingesetzt.",
    });
  });

  it("triggert Level-Up-Feedback und Animation, wenn ein Backend-Snapshot ein höheres Level liefert", async () => {
    vi.useFakeTimers();
    const backendApi = createBackendApiMock({
      login: createSnapshot(1, 90),
      completeTask: createSnapshot(2, 0),
    });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });
    await service.completeTask("2");

    expect(service.lastGameFeedback()?.kind).toBe("level-up");
    expect(service.isPetLevelingUp()).toBe(true);
    vi.advanceTimersByTime(1200);

    expect(service.isPetLevelingUp()).toBe(false);
  });

  it("triggert Level-Up-Feedback über den Test-Level-Up-Buttonpfad", async () => {
    vi.useFakeTimers();
    const backendApi = createBackendApiMock({
      login: createSnapshot(3, 100),
      testLevelUp: createSnapshot(4, 0),
    });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });
    await service.testLevelUp();

    expect(backendApi.testLevelUp).toHaveBeenCalledWith("mira", "bulbasaur");
    expect(service.pet()?.level).toBe(4);
    expect(service.lastGameFeedback()).toMatchObject({
      kind: "level-up",
      message: "Level-Up auf 4.",
    });
    expect(service.isPetLevelingUp()).toBe(true);
    vi.advanceTimersByTime(1200);

    expect(service.isPetLevelingUp()).toBe(false);
  });

  it("senkt Motivation ueber den Testbuttonpfad und zeigt Feedback", async () => {
    const initialSnapshot = createSnapshot(3, 40);
    initialSnapshot.gameState.pet.happiness = 60;
    initialSnapshot.backendGameState.happiness = 60;
    const decayedSnapshot = createSnapshot(3, 30);
    decayedSnapshot.gameState.pet.happiness = 35;
    decayedSnapshot.backendGameState.happiness = 35;

    const backendApi = createBackendApiMock({
      login: initialSnapshot,
      testMotivationDecay: decayedSnapshot,
    });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });
    await service.testMotivationDecay();

    expect(backendApi.testMotivationDecay).toHaveBeenCalledWith(
      "mira",
      "bulbasaur",
    );
    expect(service.pet()?.happiness).toBe(35);
    expect(service.pet()?.growthProgress).toBe(30);
    expect(service.lastGameFeedback()).toMatchObject({
      kind: "info",
      message: "Motivationstest ausgeführt: 60% -> 35%, Wachstum 40 -> 30.",
    });
  });

  it("laesst Wachstum unveraendert, wenn Motivation bereits bei null ist", async () => {
    const initialSnapshot = createSnapshot(3, 50);
    initialSnapshot.gameState.pet.happiness = 0;
    initialSnapshot.backendGameState.happiness = 0;
    const decayedSnapshot = createSnapshot(3, 50);
    decayedSnapshot.gameState.pet.happiness = 0;
    decayedSnapshot.backendGameState.happiness = 0;

    const backendApi = createBackendApiMock({
      login: initialSnapshot,
      testMotivationDecay: decayedSnapshot,
    });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });
    await service.testMotivationDecay();

    expect(service.pet()?.happiness).toBe(0);
    expect(service.pet()?.growthProgress).toBe(50);
    expect(service.lastGameFeedback()).toMatchObject({
      kind: "info",
      message: "Motivation ist bereits bei 0%.",
    });
  });

  it("triggert keine Animation, wenn das Level gleich bleibt", async () => {
    vi.useFakeTimers();
    const backendApi = createBackendApiMock({
      login: createSnapshot(1, 20),
      completeTask: createSnapshot(1, 30),
    });
    const service = new AppStateService(backendApi);

    await service.login({ username: "mira", password: "password123" });
    await service.completeTask("2");

    expect(service.lastGameFeedback()?.kind).toBe("quest");
    expect(service.isPetLevelingUp()).toBe(false);
  });
});

interface BackendApiMockOptions {
  login?: DashboardSnapshot;
  loginError?: Error;
  signup?: DashboardSnapshot;
  signupError?: Error;
  loadDashboard?: DashboardSnapshot;
  loadDashboardError?: Error;
  completeTask?: DashboardSnapshot;
  addWater?: DashboardSnapshot;
  feed?: DashboardSnapshot;
  testLevelUp?: DashboardSnapshot;
  testMotivationDecay?: DashboardSnapshot;
  deleteAccountError?: Error;
}

function createBackendApiMock(options: BackendApiMockOptions) {
  return {
    login: createAsyncMock(options.login, options.loginError),
    signup: createAsyncMock(options.signup, options.signupError),
    loadDashboard: createAsyncMock(
      options.loadDashboard,
      options.loadDashboardError,
    ),
    completeTask: createAsyncMock(options.completeTask),
    addWater: createAsyncMock(options.addWater),
    feed: createAsyncMock(options.feed),
    testLevelUp: createAsyncMock(options.testLevelUp),
    testMotivationDecay: createAsyncMock(options.testMotivationDecay),
    logout: vi.fn().mockResolvedValue(undefined),
    deleteAccount: createAsyncMock(undefined, options.deleteAccountError),
  } as unknown as ConstructorParameters<typeof AppStateService>[0];
}

function createAsyncMock<T>(value: T, error?: Error) {
  return error
    ? vi.fn().mockRejectedValue(error)
    : vi.fn().mockResolvedValue(value);
}

function createSnapshot(
  level: number,
  growth: number,
  username = "mira",
): DashboardSnapshot {
  const user: AppUser = {
    id: username,
    email: username,
    userName: username,
    joinedAt: "2026-06-15T10:00:00Z",
  };
  const gameState: GameState = {
    pet: {
      name: "Pokémon Partner",
      level,
      growthProgress: growth,
      growthGoal: 100,
      availableFoodPoints: 0,
      happiness: 0,
      hunger: 0,
      hearts: 5,
      mealsServed: 0,
      dailyHappinessGained: 0,
      happinessGainLastResetAt: "2026-06-15T10:00:00Z",
      lastFedAt: null,
      lastHappinessDecayAt: null,
      lastLevelUpAt: null,
      goodCareStreakDays: 0,
      lastGoodCareDay: null,
      isEgg: level < 10,
      starterPokemonSpecies: "bulbasaur",
      pokemonSpecies: "bulbasaur",
    },
    tasks: [
      {
        id: "2",
        title: "Lesen",
        description: "Ein paar Seiten lesen.",
        icon: "docs",
        tone: "green",
        category: "delivery",
        isRequired: true,
        checklistReference: "Quest #2",
        points: 10,
        isCompleted: level > 1,
      },
    ],
    qualityScore: level > 1 ? 10 : 0,
    qualityTarget: 10,
    qualityLastResetAt: "2026-06-15T10:00:00Z",
    dailyQuestLastResetAt: "2026-06-15T10:00:00Z",
    totalCompletedTasks: level > 1 ? 1 : 0,
    totalEarnedPoints: level > 1 ? 10 : 0,
  };

  return {
    user,
    gameState,
    backendGameState: {
      waterLevel: 0,
      foodLevel: 0,
      currentPokemonId: 1,
      isEgg: level < 10,
      pokemonImageUrl: "/assets/egg.png",
      pokemonLevel: level,
      growth,
      happiness: 0,
      pendingFeedPoints: 0,
      tasks: [{ id: 2, title: "Lesen", completed: level > 1 }],
      streak: 1,
      yesterdayLoggedIn: false,
      serverNow: "2026-06-15T10:00:00Z",
    },
  };
}
