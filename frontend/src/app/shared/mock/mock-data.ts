import { GameState, MockAccount, StorageSnapshot } from '../models/app-state.model';
import { RegisterCredentials } from '../models/auth.model';
import { PokemonSpeciesName, PetState, StarterPokemonSpeciesName } from '../models/pet.model';
import { TaskItem } from '../models/task.model';
import { AppUser } from '../models/user.model';

export const STORAGE_KEY = 'sqs.frontend.mvp.state';

export const PET_RULES = {
  feedCost: 10,
  maxAvailableFoodPoints: 250,
  growthPerFeeding: 34,
  happinessPerFeeding: 12,
  maxHappiness: 100,
  maxHearts: 3,
  initialGrowthGoal: 100,
  heartRecoveryStep: 0.5,
  heartRecoveryStreakDays: 2,
  dailyHappinessGainLimit: 60,
  happinessDecayPerMissedDay: 10,
  levelUpCooldownHours: 0,
  maxHunger: 100,
  dailyHungerResetValue: 0,
} as const;

export const QUALITY_RULES = {
  targetScore: 75,
  maxScore: 100,
} as const;

export const DEMO_ACCOUNT = {
  username: 'demo',
  password: 'password123', // NOSONAR - local demo seed credential, not a production secret.
  userName: 'demo',
  starterPokemonSpecies: 'bulbasaur',
} as const;

export const STARTER_POKEMON_OPTIONS: ReadonlyArray<{
  species: StarterPokemonSpeciesName;
  label: string;
  description: string;
}> = [
  {
    species: 'bulbasaur',
    label: 'Bulbasaur',
    description: 'Pflanzen-Starter mit ruhigem Wachstum.',
  },
  {
    species: 'charmander',
    label: 'Charmander',
    description: 'Feuer-Starter für aktive Tagesroutinen.',
  },
  {
    species: 'squirtle',
    label: 'Squirtle',
    description: 'Wasser-Starter für stabile Tagesroutinen.',
  },
] as const;

const POKEMON_EVOLUTION_CHAINS: Record<
  StarterPokemonSpeciesName,
  readonly [PokemonSpeciesName, PokemonSpeciesName, PokemonSpeciesName]
> = {
  bulbasaur: ['bulbasaur', 'ivysaur', 'venusaur'],
  charmander: ['charmander', 'charmeleon', 'charizard'],
  squirtle: ['squirtle', 'wartortle', 'blastoise'],
};

const FIRST_EVOLUTION_LEVEL = 15;
const FINAL_EVOLUTION_LEVEL = 35;

export function createInitialSnapshot(): StorageSnapshot {
  const demoAccount = createMockAccount(DEMO_ACCOUNT);

  return {
    accounts: [demoAccount],
    activeUserId: null,
  };
}

export function createMockAccount(credentials: RegisterCredentials): MockAccount {
  const normalizedEmail = normalizeEmail(credentials.username);
  const now = new Date().toISOString();
  const user = createUser({
    email: normalizedEmail,
    userName: credentials.userName.trim(),
    joinedAt: now,
  });

  return {
    user,
    password: credentials.password,
    gameState: createInitialGameState(credentials.starterPokemonSpecies),
  };
}

export function createInitialGameState(
  starterPokemonSpecies: StarterPokemonSpeciesName = 'bulbasaur'
): GameState {
  const now = new Date().toISOString();

  return {
    pet: createInitialPetState(starterPokemonSpecies),
    tasks: createInitialTasks(),
    qualityScore: 0,
    qualityTarget: QUALITY_RULES.targetScore,
    qualityLastResetAt: now,
    dailyQuestLastResetAt: now,
    totalCompletedTasks: 0,
    totalEarnedPoints: 0,
  };
}

export function calculateNextGrowthGoal(currentGoal: number): number {
  return Math.round(currentGoal * 1.15) + 8;
}

export function resolvePokemonSpeciesForLevel(
  level: number,
  starterPokemonSpecies: StarterPokemonSpeciesName = 'bulbasaur'
): PokemonSpeciesName {
  const chain =
    POKEMON_EVOLUTION_CHAINS[starterPokemonSpecies] ?? POKEMON_EVOLUTION_CHAINS.bulbasaur;

  if (level >= FINAL_EVOLUTION_LEVEL) {
    return chain[2];
  }

  if (level >= FIRST_EVOLUTION_LEVEL) {
    return chain[1];
  }

  return chain[0];
}

export function resolveStarterPokemonSpecies(
  species: PokemonSpeciesName | undefined
): StarterPokemonSpeciesName {
  for (const [starter, chain] of Object.entries(POKEMON_EVOLUTION_CHAINS)) {
    if ((chain as readonly PokemonSpeciesName[]).includes(species as PokemonSpeciesName)) {
      return starter as StarterPokemonSpeciesName;
    }
  }

  return 'bulbasaur';
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createUser(input: Pick<AppUser, 'email' | 'userName' | 'joinedAt'>): AppUser {
  return {
    id: createId('user'),
    email: input.email,
    userName: input.userName,
    joinedAt: input.joinedAt,
  };
}

function createInitialPetState(starterPokemonSpecies: StarterPokemonSpeciesName): PetState {
  const now = new Date().toISOString();

  return {
    name: 'Pokémon Partner',
    level: 1,
    growthProgress: 0,
    growthGoal: PET_RULES.initialGrowthGoal,
    availableFoodPoints: 0,
    happiness: 0,
    hunger: PET_RULES.dailyHungerResetValue,
    hearts: PET_RULES.maxHearts,
    mealsServed: 0,
    dailyHappinessGained: 0,
    happinessGainLastResetAt: now,
    lastFedAt: null,
    lastHappinessDecayAt: null,
    lastLevelUpAt: null,
    goodCareStreakDays: 0,
    lastGoodCareDay: null,
    isEgg: true,
    starterPokemonSpecies,
    pokemonSpecies: resolvePokemonSpeciesForLevel(1, starterPokemonSpecies),
  };
}

function createInitialTasks(): TaskItem[] {
  return [
    createQualityTask({
      slug: 'water',
      title: 'Wasser trinken',
      description: 'Wasser gibt deinem Pokémon Energie.',
      icon: 'coverage',
      tone: 'blue',
      category: 'delivery',
      checklistReference: 'Quest: Wasser',
      points: 10,
    }),
    createQualityTask({
      slug: 'study',
      title: '30 Minuten lernen',
      description: 'Ein konzentrierter Lernblock zahlt direkt auf Level-Fortschritt ein.',
      icon: 'test',
      tone: 'green',
      category: 'delivery',
      checklistReference: 'Quest: Lernen',
      points: 20,
    }),
    createQualityTask({
      slug: 'sport',
      title: 'Sport',
      description: 'Bewegung bringt Bonuspunkte für Happiness und Tagesfortschritt.',
      icon: 'rocket',
      tone: 'amber',
      category: 'delivery',
      checklistReference: 'Quest: Sport',
      points: 20,
    }),
    createQualityTask({
      slug: 'clean-room',
      title: 'Zimmer aufräumen',
      description: 'Ein klarer Raum gibt Fokus und bringt soliden Fortschritt.',
      icon: 'layers',
      tone: 'slate',
      category: 'delivery',
      checklistReference: 'Quest: Aufräumen',
      points: 15,
    }),
    createQualityTask({
      slug: 'read',
      title: '10 Seiten lesen',
      description: 'Eine kleine Leseeinheit für Routine, Fokus und Pokémon-Wachstum.',
      icon: 'docs',
      tone: 'green',
      category: 'delivery',
      checklistReference: 'Quest: Lesen',
      points: 10,
    }),
  ];
}

function createQualityTask(
  input: Omit<TaskItem, 'id' | 'isCompleted' | 'isRequired'> & {
    slug: string;
    isRequired?: boolean;
  }
): TaskItem {
  const { slug, isRequired = true, ...task } = input;

  return {
    id: `task-${slug}`,
    ...task,
    isRequired,
    isCompleted: false,
  };
}

function createId(prefix: string): string {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  return `${prefix}-${randomPart}`;
}
