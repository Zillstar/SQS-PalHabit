import { GameFeedback, GameState, MockAccount } from '../../shared/models/app-state.model';
import { LoginCredentials, RegisterCredentials } from '../../shared/models/auth.model';
import { PetCareState, PetState } from '../../shared/models/pet.model';
import { TaskItem } from '../../shared/models/task.model';
import {
  calculateNextGrowthGoal,
  createInitialGameState,
  createMockAccount,
  normalizeEmail,
  PET_RULES,
  QUALITY_RULES,
  resolvePokemonSpeciesForLevel,
  resolveStarterPokemonSpecies,
} from '../../shared/mock/mock-data';

export interface GameStateActionResult {
  gameState: GameState;
  feedback: GameFeedback | null;
}

export function findAccountForLogin(
  accounts: MockAccount[],
  credentials: LoginCredentials
): MockAccount | null {
  const normalizedEmail = normalizeEmail(credentials.username);

  return (
    accounts.find(
      (account) =>
        account.user.email === normalizedEmail && account.password === credentials.password
    ) ?? null
  );
}

export function hasAccountWithEmail(accounts: MockAccount[], email: string): boolean {
  const normalizedEmail = normalizeEmail(email);
  return accounts.some((account) => account.user.email === normalizedEmail);
}

export function createRegisteredAccount(credentials: RegisterCredentials): MockAccount {
  return createMockAccount({
    ...credentials,
    username: normalizeEmail(credentials.username),
    userName: credentials.userName.trim(),
  });
}

export function completeTaskInGameStateWithFeedback(
  gameState: GameState,
  taskId: string
): GameStateActionResult {
  const normalizedGameState = normalizeGameState(gameState);
  const taskToComplete = normalizedGameState.tasks.find(
    (task) => task.id === taskId && !task.isCompleted
  );

  if (!taskToComplete) {
    return {
      gameState: normalizedGameState,
      feedback: null,
    };
  }

  return completeTask(normalizedGameState, taskToComplete);
}

export function completeTaskInGameState(gameState: GameState, taskId: string): GameState {
  return completeTaskInGameStateWithFeedback(gameState, taskId).gameState;
}

export function feedPetInGameStateWithFeedback(
  gameState: GameState,
  now = new Date()
): GameStateActionResult {
  const normalizedGameState = resetDailyProgressIfExpired(gameState, now);
  const currentPet = normalizedGameState.pet;

  if (currentPet.availableFoodPoints < PET_RULES.feedCost) {
    return {
      gameState: normalizedGameState,
      feedback: createGameFeedback(
        'info',
        `Noch ${PET_RULES.feedCost - currentPet.availableFoodPoints} Fortschritt bis zur naechsten Pflege.`
      ),
    };
  }

  const remainingDailyHappiness = Math.max(
    0,
    PET_RULES.dailyHappinessGainLimit - currentPet.dailyHappinessGained
  );
  const happinessGain = Math.min(
    PET_RULES.happinessPerFeeding,
    remainingDailyHappiness,
    PET_RULES.maxHappiness - currentPet.happiness
  );
  const growthResult = calculateFeedingGrowth(currentPet);

  const updatedGameState: GameState = {
    ...normalizedGameState,
    pet: {
      ...currentPet,
      level: growthResult.level,
      growthProgress: growthResult.growthProgress,
      growthGoal: growthResult.growthGoal,
      pokemonSpecies: resolvePokemonSpeciesForLevel(
        growthResult.level,
        currentPet.starterPokemonSpecies
      ),
      availableFoodPoints: clampAvailableFoodPoints(
        currentPet.availableFoodPoints - PET_RULES.feedCost
      ),
      happiness: currentPet.happiness + happinessGain,
      hunger: PET_RULES.dailyHungerResetValue,
      hearts: currentPet.hearts,
      mealsServed: currentPet.mealsServed + 1,
      dailyHappinessGained: currentPet.dailyHappinessGained + happinessGain,
      happinessGainLastResetAt: currentPet.happinessGainLastResetAt,
      lastFedAt: now.toISOString(),
      lastHappinessDecayAt: currentPet.lastHappinessDecayAt,
      lastLevelUpAt: growthResult.didLevelUp ? now.toISOString() : currentPet.lastLevelUpAt,
      isEgg: currentPet.isEgg && growthResult.level < 10,
    },
  };

  if (growthResult.didLevelUp) {
    return {
      gameState: updatedGameState,
      feedback: createGameFeedback(
        'level-up',
        `${currentPet.name} erreicht Level ${growthResult.level}: ${formatPokemonName(
          updatedGameState.pet.pokemonSpecies
        )} ist bereit.`
      ),
    };
  }

  if (happinessGain <= 0) {
    return {
      gameState: updatedGameState,
      feedback: createGameFeedback(
        'feeding',
        'Pflege verbucht. Das tägliche Motivation-Limit ist für heute erreicht.'
      ),
    };
  }

  return {
    gameState: updatedGameState,
    feedback: createGameFeedback(
      'feeding',
      `${currentPet.name} sammelt Quest-Fortschritt: +${happinessGain} Motivation.`
    ),
  };
}

export function feedPetInGameState(gameState: GameState): GameState {
  return feedPetInGameStateWithFeedback(gameState).gameState;
}

export function resetDailyProgressIfExpired(gameState: GameState, now = new Date()): GameState {
  const normalizedGameState = normalizeGameState(gameState, now);
  const shouldResetHappinessLimit = isBeforeToday(
    normalizedGameState.pet.happinessGainLastResetAt,
    now
  );
  const nextPet = applyHappinessDecay(normalizedGameState.pet, now);

  if (!shouldResetHappinessLimit) {
    return {
      ...normalizedGameState,
      pet: nextPet,
    };
  }

  return {
    ...normalizedGameState,
    pet: {
      ...nextPet,
      dailyHappinessGained: 0,
      happinessGainLastResetAt: now.toISOString(),
    },
  };
}

export function resetGameState(): GameState {
  return createInitialGameState();
}

export function derivePetCareState(gameState: GameState): PetCareState {
  const normalizedGameState = normalizeGameState(gameState);
  const pet = normalizedGameState.pet;
  const growthRatio = pet.growthGoal <= 0 ? 0 : pet.growthProgress / pet.growthGoal;

  if (pet.happiness < 25 || pet.hearts <= 1) {
    return 'needs-care';
  }

  if (pet.availableFoodPoints >= PET_RULES.feedCost) {
    return 'ready-to-feed';
  }

  if (growthRatio >= 0.7) {
    return 'growing';
  }

  if (
    normalizedGameState.qualityScore >= normalizedGameState.qualityTarget &&
    pet.happiness >= 70
  ) {
    return 'thriving';
  }

  return 'calm';
}

export function canCompleteTaskInGameState(gameState: GameState, taskId: string): boolean {
  const normalizedGameState = normalizeGameState(gameState);
  const task = normalizedGameState.tasks.find((candidate) => candidate.id === taskId);

  return Boolean(task && !task.isCompleted);
}

export function normalizeGameState(gameState: GameState, now = new Date()): GameState {
  const nowIso = now.toISOString();
  const initialGameState = createInitialGameState();
  const normalizedTasks = normalizeTasks(gameState.tasks);
  const qualityScore = calculateQualityScore(normalizedTasks);

  return {
    ...gameState,
    tasks: normalizedTasks,
    qualityScore,
    qualityTarget: gameState.qualityTarget || QUALITY_RULES.targetScore,
    qualityLastResetAt: gameState.qualityLastResetAt ?? nowIso,
    dailyQuestLastResetAt: gameState.dailyQuestLastResetAt ?? nowIso,
    totalCompletedTasks:
      gameState.totalCompletedTasks ?? normalizedTasks.filter((task) => task.isCompleted).length,
    totalEarnedPoints: gameState.totalEarnedPoints ?? qualityScore,
    pet: normalizePetState(gameState.pet ?? initialGameState.pet, nowIso),
  };
}

export function calculateQualityScore(tasks: TaskItem[]): number {
  return Math.min(
    QUALITY_RULES.maxScore,
    tasks.reduce((score, task) => score + (task.isCompleted ? task.points : 0), 0)
  );
}

export function isQualityGateReached(gameState: GameState): boolean {
  const normalizedGameState = normalizeGameState(gameState);
  return normalizedGameState.qualityScore >= normalizedGameState.qualityTarget;
}

function completeTask(
  gameState: GameState,
  taskToComplete: GameState['tasks'][number]
): GameStateActionResult {
  const updatedTasks = gameState.tasks.map((task) =>
    task.id === taskToComplete.id ? { ...task, isCompleted: true } : task
  );
  const nextQualityScore = calculateQualityScore(updatedTasks);
  const didReachGate =
    gameState.qualityScore < gameState.qualityTarget && nextQualityScore >= gameState.qualityTarget;

  const updatedGameState: GameState = {
    ...gameState,
    tasks: updatedTasks,
    qualityScore: nextQualityScore,
    totalCompletedTasks: gameState.totalCompletedTasks + 1,
    totalEarnedPoints: gameState.totalEarnedPoints + taskToComplete.points,
    pet: {
      ...gameState.pet,
      availableFoodPoints: clampAvailableFoodPoints(
        gameState.pet.availableFoodPoints + taskToComplete.points
      ),
    },
  };

  return {
    gameState: updatedGameState,
    feedback: createGameFeedback(
      didReachGate ? 'level-up' : 'quest',
      didReachGate
        ? `Tagesziel erreicht: ${nextQualityScore} Fortschritt.`
        : `Quest erledigt: +${taskToComplete.points} Fortschritt.`
    ),
  };
}

function normalizeTasks(tasks: TaskItem[] | undefined): TaskItem[] {
  const initialTasks = createInitialGameState().tasks;

  if (!Array.isArray(tasks) || tasks.some((task) => !('checklistReference' in task))) {
    return initialTasks;
  }

  const savedById = new Map(tasks.map((task) => [task.id, task]));

  return initialTasks.map((task) => ({
    ...task,
    isCompleted: savedById.get(task.id)?.isCompleted ?? false,
  }));
}

function normalizePetState(pet: PetState, nowIso: string): PetState {
  const level = Math.max(1, pet.level ?? 1);
  const starterPokemonSpecies = resolveStarterPokemonSpecies(
    pet.starterPokemonSpecies ?? pet.pokemonSpecies
  );

  return {
    ...pet,
    name: pet.name || 'Pokémon Partner',
    level,
    growthProgress: pet.growthProgress ?? 0,
    growthGoal: pet.growthGoal || PET_RULES.initialGrowthGoal,
    availableFoodPoints: clampAvailableFoodPoints(pet.availableFoodPoints ?? 0),
    happiness: clamp(pet.happiness ?? 0, 0, PET_RULES.maxHappiness),
    hunger: clamp(pet.hunger ?? PET_RULES.dailyHungerResetValue, 0, PET_RULES.maxHunger),
    hearts: clamp(pet.hearts ?? PET_RULES.maxHearts, 0, PET_RULES.maxHearts),
    mealsServed: pet.mealsServed ?? 0,
    dailyHappinessGained: clamp(
      pet.dailyHappinessGained ?? 0,
      0,
      PET_RULES.dailyHappinessGainLimit
    ),
    happinessGainLastResetAt: pet.happinessGainLastResetAt ?? nowIso,
    lastFedAt: pet.lastFedAt ?? null,
    lastHappinessDecayAt: pet.lastHappinessDecayAt ?? null,
    lastLevelUpAt: pet.lastLevelUpAt ?? null,
    goodCareStreakDays: Math.max(0, pet.goodCareStreakDays ?? 0),
    lastGoodCareDay: pet.lastGoodCareDay ?? null,
    isEgg: pet.isEgg ?? level < 10,
    starterPokemonSpecies,
    pokemonSpecies: resolvePokemonSpeciesForLevel(level, starterPokemonSpecies),
  };
}

function calculateFeedingGrowth(
  pet: PetState
): Pick<PetState, 'level' | 'growthProgress' | 'growthGoal'> & { didLevelUp: boolean } {
  const progressAfterFeeding = pet.growthProgress + PET_RULES.growthPerFeeding;

  if (progressAfterFeeding < pet.growthGoal) {
    return {
      level: pet.level,
      growthProgress: progressAfterFeeding,
      growthGoal: pet.growthGoal,
      didLevelUp: false,
    };
  }

  return {
    level: pet.level + 1,
    growthProgress: progressAfterFeeding - pet.growthGoal,
    growthGoal: calculateNextGrowthGoal(pet.growthGoal),
    didLevelUp: true,
  };
}

function applyHappinessDecay(pet: PetState, now: Date): PetState {
  if (!pet.lastFedAt) {
    return pet;
  }

  const lastFedAt = new Date(pet.lastFedAt);
  const lastDecayAt = pet.lastHappinessDecayAt ? new Date(pet.lastHappinessDecayAt) : null;

  if (Number.isNaN(lastFedAt.getTime())) {
    return {
      ...pet,
      lastFedAt: null,
    };
  }

  const decayAnchor =
    lastDecayAt && !Number.isNaN(lastDecayAt.getTime()) && lastDecayAt > lastFedAt
      ? lastDecayAt
      : lastFedAt;
  const fullDaysWithoutFeeding = Math.floor(hoursBetween(decayAnchor, now) / 24);

  if (fullDaysWithoutFeeding <= 0) {
    return pet;
  }

  const decayAppliedAt = new Date(
    decayAnchor.getTime() + fullDaysWithoutFeeding * 24 * 60 * 60 * 1000
  );

  return {
    ...pet,
    happiness: Math.max(
      0,
      pet.happiness - fullDaysWithoutFeeding * PET_RULES.happinessDecayPerMissedDay
    ),
    lastHappinessDecayAt: decayAppliedAt.toISOString(),
  };
}

function isBeforeToday(isoDate: string, now: Date): boolean {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return true;
  }

  return dayStart(date).getTime() < dayStart(now).getTime();
}

function dayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function hoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (60 * 60 * 1000);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampAvailableFoodPoints(value: number): number {
  return clamp(value, 0, PET_RULES.maxAvailableFoodPoints);
}

function formatPokemonName(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function createGameFeedback(kind: GameFeedback['kind'], message: string): GameFeedback {
  return {
    id: `${kind}-${Date.now()}-${createRandomIdPart()}`,
    kind,
    message,
  };
}

function createRandomIdPart(): string {
  return globalThis.crypto?.randomUUID?.() ?? String(Date.now());
}
