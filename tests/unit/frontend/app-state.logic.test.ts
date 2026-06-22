import {
  canCompleteTaskInGameState,
  calculateQualityScore,
  completeTaskInGameState,
  completeTaskInGameStateWithFeedback,
  createRegisteredAccount,
  derivePetCareState,
  feedPetInGameState,
  feedPetInGameStateWithFeedback,
  findAccountForLogin,
  hasAccountWithEmail,
  isQualityGateReached,
  normalizeGameState,
  resetDailyProgressIfExpired,
  resetGameState,
} from "../../../frontend/src/app/core/state/app-state.logic";
import {
  createInitialGameState,
  createInitialSnapshot,
  PET_RULES,
} from "../../../frontend/src/app/shared/mock/mock-data";

describe("app-state.logic", () => {
  it("meldet den Demo-Account auch mit gemischter Schreibweise des Spielernamens an", () => {
    const snapshot = createInitialSnapshot();

    const account = findAccountForLogin(snapshot.accounts, {
      username: "  DEMO ",
      password: "password123",
    });

    expect(account?.user.userName).toBe("demo");
  });

  it("erkennt vorhandene Konten unabhängig von Groß- und Kleinschreibung", () => {
    const snapshot = createInitialSnapshot();

    expect(hasAccountWithEmail(snapshot.accounts, " Demo ")).toBe(true);
    expect(hasAccountWithEmail(snapshot.accounts, "neu@sqs.app")).toBe(false);
  });

  it("erstellt neue Konten mit bereinigten Eingaben und frischem Task-State", () => {
    const account = createRegisteredAccount({
      username: "  TEST ",
      password: "geheim123",
      userName: "  Mira  ",
      starterPokemonSpecies: "squirtle",
    });

    expect(account.user.email).toBe("test");
    expect(account.user.userName).toBe("Mira");
    expect(account.gameState.tasks).toHaveLength(5);
    expect(account.gameState.qualityScore).toBe(0);
    expect(account.gameState.pet.level).toBe(1);
    expect(account.gameState.pet.pokemonSpecies).toBe("squirtle");
  });

  it("markiert eine Quest als erledigt und schreibt Punkte gut", () => {
    const initialGameState = createInitialGameState();
    const firstTask = initialGameState.tasks[0];

    const updatedGameState = completeTaskInGameState(
      initialGameState,
      firstTask.id,
    );

    expect(updatedGameState.tasks[0].isCompleted).toBe(true);
    expect(updatedGameState.totalCompletedTasks).toBe(1);
    expect(updatedGameState.totalEarnedPoints).toBe(firstTask.points);
    expect(updatedGameState.pet.availableFoodPoints).toBe(firstTask.points);
    expect(updatedGameState.qualityScore).toBe(firstTask.points);
  });

  it("begrenzt verfuegbare Quest-Punkte beim Task-Abschluss auf 250", () => {
    const initialGameState = createInitialGameState();
    const firstTask = initialGameState.tasks[0];

    const updatedGameState = completeTaskInGameState(
      {
        ...initialGameState,
        pet: {
          ...initialGameState.pet,
          availableFoodPoints: 248,
        },
      },
      firstTask.id,
    );

    expect(updatedGameState.pet.availableFoodPoints).toBe(250);
  });

  it("lässt einen bereits erledigten Task beim zweiten Versuch unverändert", () => {
    const initialGameState = createInitialGameState();
    const firstTaskId = initialGameState.tasks[0].id;

    const onceCompleted = completeTaskInGameState(
      initialGameState,
      firstTaskId,
    );
    const twiceCompleted = completeTaskInGameState(onceCompleted, firstTaskId);

    expect(twiceCompleted).toEqual(onceCompleted);
  });

  it("berechnet und erkennt das Tagesziel aus Quests", () => {
    let gameState = createInitialGameState();

    for (const task of gameState.tasks) {
      gameState = completeTaskInGameState(gameState, task.id);
    }

    expect(calculateQualityScore(gameState.tasks)).toBe(75);
    expect(isQualityGateReached(gameState)).toBe(true);
  });

  it("liefert beim Erreichen des Tagesziels Level-Up-Feedback", () => {
    let gameState = createInitialGameState();

    for (const task of gameState.tasks.slice(0, 4)) {
      gameState = completeTaskInGameState(gameState, task.id);
    }

    const result = completeTaskInGameStateWithFeedback(
      gameState,
      gameState.tasks[4].id,
    );

    expect(result.gameState.qualityScore).toBe(75);
    expect(result.feedback?.kind).toBe("level-up");
  });

  it("pflegt das Pokémon nur, wenn genug Quest-Punkte vorhanden sind", () => {
    const initialGameState = createInitialGameState();

    const result = feedPetInGameStateWithFeedback(initialGameState);

    expect(result.gameState).toEqual(initialGameState);
    expect(result.feedback?.kind).toBe("info");
  });

  it("erhöht Motivation bei Pflege, aber nur bis zum Tageslimit", () => {
    const initialGameState = createInitialGameState();
    let gameState = {
      ...initialGameState,
      pet: {
        ...initialGameState.pet,
        availableFoodPoints: 100,
      },
    };

    for (let index = 0; index < 6; index += 1) {
      gameState = feedPetInGameState(gameState);
    }

    expect(gameState.pet.happiness).toBe(PET_RULES.dailyHappinessGainLimit);
    expect(gameState.pet.dailyHappinessGained).toBe(
      PET_RULES.dailyHappinessGainLimit,
    );
  });

  it("levelt direkt bei vollem Wachstum und aktualisiert die Pokémon-Stufe", () => {
    const initialGameState = createInitialGameState();
    const preparedGameState = {
      ...initialGameState,
      pet: {
        ...initialGameState.pet,
        availableFoodPoints: 24,
        growthProgress: 80,
        growthGoal: 100,
        happiness: 70,
      },
    };

    const updatedGameState = feedPetInGameState(preparedGameState);

    expect(updatedGameState.pet.level).toBe(2);
    expect(updatedGameState.pet.growthProgress).toBe(14);
    expect(updatedGameState.pet.growthGoal).toBe(123);
    expect(updatedGameState.pet.pokemonSpecies).toBe("bulbasaur");
    expect(updatedGameState.pet.availableFoodPoints).toBe(
      24 - PET_RULES.feedCost,
    );
  });

  it("wechselt ab Level 15 zu Ivysaur und ab Level 35 zu Venusaur", () => {
    const initialGameState = createInitialGameState();
    const levelFourteenState = {
      ...initialGameState,
      pet: {
        ...initialGameState.pet,
        level: 14,
        availableFoodPoints: 40,
        growthProgress: 100,
        growthGoal: 100,
      },
    };
    const levelThirtyFourState = {
      ...initialGameState,
      pet: {
        ...initialGameState.pet,
        level: 34,
        availableFoodPoints: 40,
        growthProgress: 100,
        growthGoal: 100,
      },
    };

    expect(feedPetInGameState(levelFourteenState).pet.pokemonSpecies).toBe(
      "ivysaur",
    );
    expect(feedPetInGameState(levelThirtyFourState).pet.pokemonSpecies).toBe(
      "venusaur",
    );
  });

  it("entwickelt gewählte Starter entlang ihrer eigenen Reihenfolge", () => {
    const initialGameState = createInitialGameState("charmander");
    const levelFourteenState = {
      ...initialGameState,
      pet: {
        ...initialGameState.pet,
        level: 14,
        availableFoodPoints: 40,
        growthProgress: 100,
        growthGoal: 100,
      },
    };

    expect(feedPetInGameState(levelFourteenState).pet).toMatchObject({
      starterPokemonSpecies: "charmander",
      pokemonSpecies: "charmeleon",
    });
  });

  it("setzt das Demo-Spiel auf leere Quest-Werte zurück", () => {
    const resetState = resetGameState();

    expect(resetState.pet.name).toBe("Pokémon Partner");
    expect(resetState.pet.level).toBe(1);
    expect(resetState.pet.availableFoodPoints).toBe(0);
    expect(resetState.pet.growthProgress).toBe(0);
    expect(resetState.pet.pokemonSpecies).toBe("bulbasaur");
    expect(resetState.totalCompletedTasks).toBe(0);
    expect(resetState.qualityScore).toBe(0);
    expect(resetState.qualityTarget).toBe(75);
    expect(resetState.tasks.every((task) => !task.isCompleted)).toBe(true);
  });

  it("normalisiert unvollständige gespeicherte Tasks auf die Standardquests", () => {
    const initialGameState = createInitialGameState();
    const normalized = normalizeGameState({
      ...initialGameState,
      tasks: [
        {
          id: "legacy-task",
          title: "Alter Task",
          isCompleted: true,
        },
      ] as unknown as typeof initialGameState.tasks,
    });

    expect(normalized.tasks).toHaveLength(initialGameState.tasks.length);
    expect(normalized.tasks[0].checklistReference).toBe("Quest: Wasser");
    expect(normalized.tasks.every((task) => !task.isCompleted)).toBe(true);
  });

  it("senkt Motivation nach 24 Stunden ohne Pflege", () => {
    const initialGameState = createInitialGameState();

    const resetState = resetDailyProgressIfExpired(
      {
        ...initialGameState,
        pet: {
          ...initialGameState.pet,
          happiness: 80,
          lastFedAt: "2026-05-31T08:00:00.000Z",
          happinessGainLastResetAt: "2026-05-31T08:00:00.000Z",
        },
      },
      new Date("2026-06-01T08:00:00.000Z"),
    );

    expect(resetState.pet.happiness).toBe(70);
    expect(resetState.pet.dailyHappinessGained).toBe(0);
  });

  it("räumt ungültige Pflegezeitpunkte beim Tagesreset auf", () => {
    const initialGameState = createInitialGameState();

    const resetState = resetDailyProgressIfExpired(
      {
        ...initialGameState,
        pet: {
          ...initialGameState.pet,
          lastFedAt: "kein-datum",
          happinessGainLastResetAt: "auch-kein-datum",
          dailyHappinessGained: 12,
        },
      },
      new Date("2026-06-15T08:00:00.000Z"),
    );

    expect(resetState.pet.lastFedAt).toBeNull();
    expect(resetState.pet.dailyHappinessGained).toBe(0);
    expect(resetState.pet.happinessGainLastResetAt).toBe(
      "2026-06-15T08:00:00.000Z",
    );
  });

  it("berechnet Motivationsverfall ab dem letzten Decay-Anker", () => {
    const initialGameState = createInitialGameState();

    const resetState = resetDailyProgressIfExpired(
      {
        ...initialGameState,
        pet: {
          ...initialGameState.pet,
          happiness: 80,
          lastFedAt: "2026-06-10T08:00:00.000Z",
          lastHappinessDecayAt: "2026-06-12T08:00:00.000Z",
          happinessGainLastResetAt: "2026-06-15T08:00:00.000Z",
        },
      },
      new Date("2026-06-14T08:00:00.000Z"),
    );

    expect(resetState.pet.happiness).toBe(60);
    expect(resetState.pet.lastHappinessDecayAt).toBe(
      "2026-06-14T08:00:00.000Z",
    );
  });

  it("leitet Pflegezustände aus Quest- und Pokémon-Werten ab", () => {
    const initialGameState = createInitialGameState();

    expect(
      derivePetCareState({
        ...initialGameState,
        pet: { ...initialGameState.pet, happiness: 10 },
      }),
    ).toBe("needs-care");

    expect(
      derivePetCareState({
        ...initialGameState,
        pet: {
          ...initialGameState.pet,
          availableFoodPoints: PET_RULES.feedCost,
          happiness: 50,
        },
      }),
    ).toBe("ready-to-feed");

    let qualityGateState = initialGameState;

    for (const task of qualityGateState.tasks) {
      qualityGateState = completeTaskInGameState(qualityGateState, task.id);
    }

    expect(
      derivePetCareState({
        ...qualityGateState,
        pet: {
          ...qualityGateState.pet,
          availableFoodPoints: 0,
          happiness: 92,
          hearts: PET_RULES.maxHearts,
        },
      }),
    ).toBe("thriving");
  });

  it("erlaubt offene Quests und sperrt erledigte Quests", () => {
    const initialGameState = createInitialGameState();
    const firstTaskId = initialGameState.tasks[0].id;
    const completedState = completeTaskInGameState(
      initialGameState,
      firstTaskId,
    );

    expect(canCompleteTaskInGameState(initialGameState, firstTaskId)).toBe(
      true,
    );
    expect(canCompleteTaskInGameState(completedState, firstTaskId)).toBe(false);
    expect(
      canCompleteTaskInGameState(initialGameState, "unbekannte-quest"),
    ).toBe(false);
  });

  it("normalisiert bekannte gespeicherte Quests und fehlende Zaehler", () => {
    const initialGameState = createInitialGameState();

    const normalized = normalizeGameState({
      ...initialGameState,
      tasks: [
        { ...initialGameState.tasks[0], isCompleted: true },
        {
          ...initialGameState.tasks[1],
          id: "alte-quest",
          isCompleted: true,
        },
      ],
      qualityTarget: 0,
      qualityLastResetAt: undefined as unknown as string,
      dailyQuestLastResetAt: undefined as unknown as string,
      totalCompletedTasks: undefined as unknown as number,
      totalEarnedPoints: undefined as unknown as number,
    });

    expect(normalized.tasks[0].isCompleted).toBe(true);
    expect(normalized.tasks[1].isCompleted).toBe(false);
    expect(normalized.qualityTarget).toBe(75);
    expect(normalized.totalCompletedTasks).toBe(1);
    expect(normalized.totalEarnedPoints).toBe(initialGameState.tasks[0].points);
    expect(normalized.qualityLastResetAt).toBeTruthy();
    expect(normalized.dailyQuestLastResetAt).toBeTruthy();
  });

  it("normalisiert fehlende und begrenzte Pokemon-Werte", () => {
    const initialGameState = createInitialGameState();

    const normalized = normalizeGameState({
      ...initialGameState,
      pet: {
        ...initialGameState.pet,
        name: "",
        level: undefined as unknown as number,
        growthProgress: undefined as unknown as number,
        growthGoal: 0,
        availableFoodPoints: 999,
        happiness: 150,
        hunger: -5,
        hearts: 10,
        mealsServed: undefined as unknown as number,
        dailyHappinessGained: 999,
        happinessGainLastResetAt: undefined as unknown as string,
        lastFedAt: undefined as unknown as string | null,
        lastHappinessDecayAt: undefined as unknown as string | null,
        lastLevelUpAt: undefined as unknown as string | null,
        goodCareStreakDays: -2,
        lastGoodCareDay: undefined as unknown as string | null,
        isEgg: undefined as unknown as boolean,
        starterPokemonSpecies: undefined as unknown as "bulbasaur",
        pokemonSpecies: undefined as unknown as "bulbasaur",
      },
    });

    expect(normalized.pet.name).toContain("Partner");
    expect(normalized.pet.level).toBe(1);
    expect(normalized.pet.growthProgress).toBe(0);
    expect(normalized.pet.growthGoal).toBe(PET_RULES.initialGrowthGoal);
    expect(normalized.pet.availableFoodPoints).toBe(250);
    expect(normalized.pet.happiness).toBe(PET_RULES.maxHappiness);
    expect(normalized.pet.hunger).toBe(0);
    expect(normalized.pet.hearts).toBe(PET_RULES.maxHearts);
    expect(normalized.pet.mealsServed).toBe(0);
    expect(normalized.pet.dailyHappinessGained).toBe(
      PET_RULES.dailyHappinessGainLimit,
    );
    expect(normalized.pet.lastFedAt).toBeNull();
    expect(normalized.pet.lastHappinessDecayAt).toBeNull();
    expect(normalized.pet.lastLevelUpAt).toBeNull();
    expect(normalized.pet.goodCareStreakDays).toBe(0);
    expect(normalized.pet.lastGoodCareDay).toBeNull();
    expect(normalized.pet.isEgg).toBe(true);
    expect(normalized.pet.starterPokemonSpecies).toBe("bulbasaur");
  });

  it("normalisiert negative Quest-Punkte auf null", () => {
    const initialGameState = createInitialGameState();

    const normalized = normalizeGameState({
      ...initialGameState,
      pet: {
        ...initialGameState.pet,
        availableFoodPoints: -12,
      },
    });

    expect(normalized.pet.availableFoodPoints).toBe(0);
  });

  it("deckt wachsende und ruhige Pflegezustaende ab", () => {
    const initialGameState = createInitialGameState();

    expect(
      derivePetCareState({
        ...initialGameState,
        pet: {
          ...initialGameState.pet,
          availableFoodPoints: 0,
          happiness: 50,
          growthProgress: 80,
          growthGoal: 100,
        },
      }),
    ).toBe("growing");

    expect(
      derivePetCareState({
        ...initialGameState,
        pet: {
          ...initialGameState.pet,
          availableFoodPoints: 0,
          happiness: 50,
          growthProgress: 0,
          growthGoal: 0,
        },
      }),
    ).toBe("calm");
  });

  it("laesst Motivation ohne Pflege oder vollen Fehltag unveraendert", () => {
    const initialGameState = createInitialGameState();
    const now = new Date("2026-06-15T12:00:00.000Z");

    const withoutCare = resetDailyProgressIfExpired(
      {
        ...initialGameState,
        pet: {
          ...initialGameState.pet,
          happiness: 66,
          lastFedAt: null,
          happinessGainLastResetAt: "2026-06-15T08:00:00.000Z",
        },
      },
      now,
    );
    const sameDayCare = resetDailyProgressIfExpired(
      {
        ...initialGameState,
        pet: {
          ...initialGameState.pet,
          happiness: 66,
          lastFedAt: "2026-06-15T08:00:00.000Z",
          happinessGainLastResetAt: "2026-06-15T08:00:00.000Z",
        },
      },
      now,
    );

    expect(withoutCare.pet.happiness).toBe(66);
    expect(withoutCare.pet.lastHappinessDecayAt).toBeNull();
    expect(sameDayCare.pet.happiness).toBe(66);
    expect(sameDayCare.pet.lastHappinessDecayAt).toBeNull();
  });

  it("begrenzt Motivationsverfall bei null", () => {
    const initialGameState = createInitialGameState();

    const resetState = resetDailyProgressIfExpired(
      {
        ...initialGameState,
        pet: {
          ...initialGameState.pet,
          happiness: 10,
          lastFedAt: "2026-06-10T08:00:00.000Z",
          happinessGainLastResetAt: "2026-06-10T08:00:00.000Z",
        },
      },
      new Date("2026-06-15T08:00:00.000Z"),
    );

    expect(resetState.pet.happiness).toBe(0);
  });
});
