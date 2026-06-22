import { computed, Injectable, signal } from '@angular/core';
import { AuthResult, LoginCredentials, RegisterCredentials } from '../../shared/models/auth.model';
import { GameFeedback, GameState } from '../../shared/models/app-state.model';
import { PetCareState } from '../../shared/models/pet.model';
import { AppUser } from '../../shared/models/user.model';
import {
  BackendApiError,
  BackendApiService,
  BackendGameStateDto,
  DashboardSnapshot,
} from './backend-api.service';
import { derivePetCareState } from '../state/app-state.logic';

const ACTIVE_USERNAME_STORAGE_KEY = 'sqs.backend.activeUsername';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  private readonly activeUser = signal<AppUser | null>(null);
  private readonly activeGameState = signal<GameState | null>(null);
  private readonly activeBackendGameState = signal<BackendGameStateDto | null>(null);
  private readonly isSessionRestoring = signal(false);
  private readonly activeActionCount = signal(0);
  private isBackgroundRefreshInFlight = false;
  private feedbackClearTimeout: ReturnType<typeof setTimeout> | null = null;
  private levelUpAnimationTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly isAuthenticated = computed(() => this.activeUser() !== null);
  readonly isLoading = computed(() => this.isSessionRestoring());
  readonly isActionPending = computed(() => this.activeActionCount() > 0);
  readonly user = computed(() => this.activeUser());
  readonly pet = computed(() => this.activeGameState()?.pet ?? null);
  readonly tasks = computed(() => this.activeGameState()?.tasks ?? []);
  readonly backendGameState = computed(() => this.activeBackendGameState());
  readonly waterLevel = computed(() => this.backendGameState()?.waterLevel ?? 0);
  readonly foodLevel = computed(() => this.backendGameState()?.foodLevel ?? 0);
  readonly streak = computed(() => this.backendGameState()?.streak ?? 0);
  readonly serverNow = computed(() => this.backendGameState()?.serverNow ?? null);
  readonly pokemonImageUrl = computed(() => {
    const backendGameState = this.backendGameState();

    if (!backendGameState?.pokemonImageUrl) {
      return null;
    }

    if (backendGameState.isEgg) {
      return backendGameState.pokemonImageUrl;
    }

    return isPokemonImageForCurrentId(
      backendGameState.pokemonImageUrl,
      backendGameState.currentPokemonId
    )
      ? backendGameState.pokemonImageUrl
      : null;
  });
  readonly qualityScore = computed(() => this.activeGameState()?.qualityScore ?? 0);
  readonly qualityTarget = computed(() => this.activeGameState()?.qualityTarget ?? 0);
  readonly qualityGateReached = computed(() => this.qualityScore() >= this.qualityTarget());
  readonly totalTaskCount = computed(() => this.tasks().length);
  readonly completedTaskCount = computed(
    () => this.tasks().filter((task) => task.isCompleted).length
  );
  readonly petCareState = computed<PetCareState>(() => {
    const gameState = this.activeGameState();

    return gameState ? derivePetCareState(gameState) : 'calm';
  });
  readonly qualityQuestProgress = computed(() => {
    const total = this.totalTaskCount();
    const completed = this.completedTaskCount();
    const pending = Math.max(0, total - completed);

    return {
      completed,
      total,
      pending,
      completedRequired: completed,
      totalRequired: total,
      percentage: total <= 0 ? 0 : Math.round((completed / total) * 100),
    };
  });
  readonly lastGameFeedback = signal<GameFeedback | null>(null);
  readonly isPetLevelingUp = signal(false);

  constructor(private readonly backendApi: BackendApiService) {}

  async restoreSession(): Promise<boolean> {
    if (this.isAuthenticated()) {
      return true;
    }

    const username = readStoredUsername();

    if (!username) {
      return false;
    }

    this.isSessionRestoring.set(true);

    try {
      this.applyDashboardSnapshot(await this.backendApi.loadDashboard(username));
      return true;
    } catch {
      clearStoredUsername();
      this.clearSession();
      return false;
    } finally {
      this.isSessionRestoring.set(false);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const snapshot = await this.backendApi.login(credentials.username, credentials.password);
      this.applyDashboardSnapshot(snapshot);
      storeUsername(snapshot.user.userName);

      return {
        success: true,
        message: `Willkommen zurück, ${snapshot.user.userName}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(
          error,
          'Login fehlgeschlagen. Bitte prüfe Benutzername und Passwort.'
        ),
      };
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    try {
      const snapshot = await this.backendApi.signup(credentials);
      this.applyDashboardSnapshot(snapshot);
      storeUsername(snapshot.user.userName);

      return {
        success: true,
        message: `Profil erstellt: ${snapshot.user.userName}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Registrierung fehlgeschlagen.'),
      };
    }
  }

  async logout(): Promise<void> {
    await this.runAction(async () => {
      try {
        await this.backendApi.logout();
      } finally {
        clearStoredUsername();
        this.clearSession();
      }
    });
  }

  async deleteAccount(): Promise<AuthResult> {
    return this.runAction(async () => {
      try {
        await this.backendApi.deleteAccount();
        clearStoredUsername();
        this.clearSession();

        return {
          success: true,
          message: 'Profil gelöscht.',
        };
      } catch (error) {
        return {
          success: false,
          message: getApiErrorMessage(error, 'Profil konnte nicht gelöscht werden.'),
        };
      }
    });
  }

  async completeTask(taskId: string): Promise<void> {
    const username = this.activeUser()?.userName;

    if (!username || this.isActionPending()) {
      return;
    }

    await this.runAction(async () => {
      try {
        const before = this.activeGameState();
        const snapshot = await this.backendApi.completeTask(
          username,
          taskId,
          this.pet()?.starterPokemonSpecies
        );
        const didLevelUp = this.applyDashboardSnapshot(snapshot, true);

        if (!didLevelUp) {
          this.showFeedback({
            id: createFeedbackId('quest'),
            kind: 'quest',
            message:
              snapshot.gameState.totalCompletedTasks > (before?.totalCompletedTasks ?? 0)
                ? 'Quest erledigt. Dein Spielstand wurde aktualisiert.'
                : 'Spielstand wurde aktualisiert.',
          });
        }
      } catch (error) {
        this.showFeedback({
          id: createFeedbackId('info'),
          kind: 'info',
          message: getApiErrorMessage(error, 'Quest konnte nicht abgeschlossen werden.'),
        });
      }
    });
  }

  async addWater(amountMl: number): Promise<void> {
    const username = this.activeUser()?.userName;

    if (!username || this.isActionPending()) {
      return;
    }

    await this.runAction(async () => {
      try {
        const snapshot = await this.backendApi.addWater(
          username,
          amountMl,
          this.pet()?.starterPokemonSpecies
        );
        const didLevelUp = this.applyDashboardSnapshot(snapshot, true);

        if (!didLevelUp) {
          this.showFeedback({
            id: createFeedbackId('hydration'),
            kind: 'hydration',
            message: `+${amountMl} ml Wasser getrunken.`,
          });
        }
      } catch (error) {
        this.showFeedback({
          id: createFeedbackId('info'),
          kind: 'info',
          message: getApiErrorMessage(error, 'Wasser konnte nicht gespeichert werden.'),
        });
      }
    });
  }

  async feedPet(): Promise<void> {
    const username = this.activeUser()?.userName;

    if (!username || this.isActionPending()) {
      return;
    }

    await this.runAction(async () => {
      try {
        const snapshot = await this.backendApi.feed(username, this.pet()?.starterPokemonSpecies);
        const didLevelUp = this.applyDashboardSnapshot(snapshot, true);

        if (!didLevelUp) {
          this.showFeedback({
            id: createFeedbackId('feeding'),
            kind: 'feeding',
            message: 'Fortschritt wurde für deinen Partner eingesetzt.',
          });
        }
      } catch (error) {
        this.showFeedback({
          id: createFeedbackId('info'),
          kind: 'info',
          message: getApiErrorMessage(error, 'Pokémon konnte nicht gefüttert werden.'),
        });
      }
    });
  }

  async testLevelUp(): Promise<void> {
    const username = this.activeUser()?.userName;

    if (!username || this.isActionPending()) {
      return;
    }

    await this.runAction(async () => {
      try {
        const snapshot = await this.backendApi.testLevelUp(
          username,
          this.pet()?.starterPokemonSpecies
        );
        const didLevelUp = this.applyDashboardSnapshot(snapshot, true);

        if (!didLevelUp) {
          this.showFeedback({
            id: createFeedbackId('info'),
            kind: 'info',
            message: 'Test-Level-Up ausgeführt.',
          });
        }
      } catch (error) {
        this.showFeedback({
          id: createFeedbackId('info'),
          kind: 'info',
          message: getApiErrorMessage(error, 'Test-Level-Up konnte nicht ausgeführt werden.'),
        });
      }
    });
  }

  async testMotivationDecay(): Promise<void> {
    const username = this.activeUser()?.userName;

    if (!username || this.isActionPending()) {
      return;
    }

    await this.runAction(async () => {
      try {
        const previousHappiness = this.pet()?.happiness ?? 0;
        const previousGrowth = this.pet()?.growthProgress ?? 0;
        const snapshot = await this.backendApi.testMotivationDecay(
          username,
          this.pet()?.starterPokemonSpecies
        );
        this.applyDashboardSnapshot(snapshot);
        const nextHappiness = snapshot.gameState.pet.happiness;
        const nextGrowth = snapshot.gameState.pet.growthProgress;

        this.showFeedback({
          id: createFeedbackId('info'),
          kind: 'info',
          message: createMotivationDecayFeedback(
            previousHappiness,
            nextHappiness,
            previousGrowth,
            nextGrowth
          ),
        });
      } catch (error) {
        this.showFeedback({
          id: createFeedbackId('info'),
          kind: 'info',
          message: getApiErrorMessage(error, 'Motivationstest konnte nicht ausgeführt werden.'),
        });
      }
    });
  }

  async resetCurrentProgress(showReloadFeedback = true): Promise<void> {
    const username = this.activeUser()?.userName;

    if (!username || this.isActionPending()) {
      return;
    }

    if (!showReloadFeedback) {
      if (this.isBackgroundRefreshInFlight) {
        return;
      }

      this.isBackgroundRefreshInFlight = true;

      try {
        this.applyDashboardSnapshot(await this.backendApi.loadDashboard(username));
      } finally {
        this.isBackgroundRefreshInFlight = false;
      }

      return;
    }

    await this.runAction(async () => {
      try {
        this.applyDashboardSnapshot(await this.backendApi.loadDashboard(username));
        if (showReloadFeedback) {
          this.showFeedback({
            id: createFeedbackId('info'),
            kind: 'info',
            message: 'Spielstand neu geladen.',
          });
        }
      } catch (error) {
        this.showFeedback({
          id: createFeedbackId('info'),
          kind: 'info',
          message: getApiErrorMessage(error, 'Spielstand konnte nicht neu geladen werden.'),
        });
      }
    });
  }

  private async runAction<T>(action: () => Promise<T>): Promise<T> {
    this.activeActionCount.update((count) => count + 1);

    try {
      return await action();
    } finally {
      this.activeActionCount.update((count) => Math.max(0, count - 1));
    }
  }

  private applyDashboardSnapshot(snapshot: DashboardSnapshot, announceLevelUp = false): boolean {
    const previousLevel = this.activeGameState()?.pet.level ?? snapshot.gameState.pet.level;
    this.activeUser.set(snapshot.user);
    this.activeGameState.set(snapshot.gameState);
    this.activeBackendGameState.set(snapshot.backendGameState);

    const nextLevel = snapshot.gameState.pet.level;

    if (announceLevelUp && nextLevel > previousLevel) {
      this.triggerLevelUpFeedback(nextLevel);
      return true;
    }

    return false;
  }

  private clearSession(): void {
    this.activeUser.set(null);
    this.activeGameState.set(null);
    this.activeBackendGameState.set(null);
    this.lastGameFeedback.set(null);
    this.isPetLevelingUp.set(false);

    if (this.levelUpAnimationTimeout) {
      clearTimeout(this.levelUpAnimationTimeout);
      this.levelUpAnimationTimeout = null;
    }
  }

  private triggerLevelUpFeedback(level: number): void {
    this.isPetLevelingUp.set(true);
    this.showFeedback({
      id: createFeedbackId('level-up'),
      kind: 'level-up',
      message: `Level-Up auf ${level}.`,
    });

    if (this.levelUpAnimationTimeout) {
      clearTimeout(this.levelUpAnimationTimeout);
    }

    this.levelUpAnimationTimeout = setTimeout(() => {
      this.isPetLevelingUp.set(false);
      this.levelUpAnimationTimeout = null;
    }, 1200);
  }

  private showFeedback(feedback: GameFeedback): void {
    this.lastGameFeedback.set(feedback);

    if (this.feedbackClearTimeout) {
      clearTimeout(this.feedbackClearTimeout);
    }

    this.feedbackClearTimeout = setTimeout(() => {
      this.lastGameFeedback.set(null);
      this.feedbackClearTimeout = null;
    }, 3600);
  }
}

function readStoredUsername(): string | null {
  return globalThis.localStorage?.getItem(ACTIVE_USERNAME_STORAGE_KEY) || null;
}

function storeUsername(username: string): void {
  globalThis.localStorage?.setItem(ACTIVE_USERNAME_STORAGE_KEY, username);
}

function clearStoredUsername(): void {
  globalThis.localStorage?.removeItem(ACTIVE_USERNAME_STORAGE_KEY);
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof BackendApiError) {
    return error.message;
  }

  return fallback;
}

function createFeedbackId(kind: GameFeedback['kind']): string {
  return `${kind}-${Date.now()}-${createRandomIdPart()}`;
}

function createRandomIdPart(): string {
  return globalThis.crypto?.randomUUID?.() ?? String(Date.now());
}

function createMotivationDecayFeedback(
  previousHappiness: number,
  nextHappiness: number,
  previousGrowth: number,
  nextGrowth: number
): string {
  if (nextHappiness < previousHappiness) {
    return `Motivationstest ausgeführt: ${previousHappiness}% -> ${nextHappiness}%, Wachstum ${previousGrowth} -> ${nextGrowth}.`;
  }

  return 'Motivation ist bereits bei 0%.';
}

function isPokemonImageForCurrentId(
  imageUrl: string,
  currentPokemonId: number | null | undefined
): boolean {
  if (currentPokemonId == null) {
    return true;
  }

  return new RegExp(String.raw`(^|/)${currentPokemonId}\.png(?:[?#].*)?$`).test(imageUrl);
}
