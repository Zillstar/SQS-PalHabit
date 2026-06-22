import {
  calculateNextGrowthGoal,
  createInitialGameState,
  createInitialSnapshot,
  PET_RULES,
  QUALITY_RULES,
  normalizeEmail,
  resolvePokemonSpeciesForLevel,
} from "../../../frontend/src/app/shared/mock/mock-data";

describe("mock-data", () => {
  it("normalisiert E-Mail-Adressen für stabile Vergleiche", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("berechnet das nächste Wachstumsziel nachvollziehbar größer", () => {
    expect(calculateNextGrowthGoal(100)).toBe(123);
    expect(calculateNextGrowthGoal(123)).toBeGreaterThan(123);
  });

  it("stellt einen initialen Snapshot mit Demo-Account bereit", () => {
    const snapshot = createInitialSnapshot();

    expect(snapshot.accounts).toHaveLength(1);
    expect(snapshot.activeUserId).toBeNull();
    expect(snapshot.accounts[0].user.userName).toBe("demo");
  });

  it("liefert einen neuen Spielzustand mit offenen Quests", () => {
    const gameState = createInitialGameState();

    expect(gameState.tasks).toHaveLength(5);
    expect(gameState.tasks.every((task) => !task.isCompleted)).toBe(true);
    expect(gameState.tasks.map((task) => task.id)).toEqual([
      "task-water",
      "task-study",
      "task-sport",
      "task-clean-room",
      "task-read",
    ]);
    expect(gameState.qualityTarget).toBe(QUALITY_RULES.targetScore);
    expect(gameState.pet.level).toBe(1);
    expect(gameState.pet.starterPokemonSpecies).toBe("bulbasaur");
    expect(gameState.pet.pokemonSpecies).toBe("bulbasaur");
  });

  it("erstellt neue Spielzustände mit dem gewählten Starter", () => {
    expect(createInitialGameState("charmander").pet).toMatchObject({
      starterPokemonSpecies: "charmander",
      pokemonSpecies: "charmander",
    });
    expect(createInitialGameState("squirtle").pet).toMatchObject({
      starterPokemonSpecies: "squirtle",
      pokemonSpecies: "squirtle",
    });
  });

  it("nutzt das Punkte-Balancing aus den Quests", () => {
    const gameState = createInitialGameState();
    const taskPoints = gameState.tasks.map((task) => task.points);

    expect(taskPoints).toEqual([10, 20, 20, 15, 10]);
    expect(taskPoints.every(Number.isInteger)).toBe(true);
    expect(Number.isInteger(PET_RULES.feedCost)).toBe(true);
    expect(Number.isInteger(PET_RULES.growthPerFeeding)).toBe(true);
    expect(Number.isInteger(PET_RULES.happinessPerFeeding)).toBe(true);
  });

  it("leitet die Pokémon-Stufe aus dem Level ab", () => {
    expect(resolvePokemonSpeciesForLevel(1)).toBe("bulbasaur");
    expect(resolvePokemonSpeciesForLevel(15)).toBe("ivysaur");
    expect(resolvePokemonSpeciesForLevel(35)).toBe("venusaur");
    expect(resolvePokemonSpeciesForLevel(15, "charmander")).toBe("charmeleon");
    expect(resolvePokemonSpeciesForLevel(35, "squirtle")).toBe("blastoise");
  });
});
