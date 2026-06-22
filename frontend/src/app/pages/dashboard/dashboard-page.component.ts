import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AppStateService } from '../../core/services/app-state.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { WeatherService } from '../../core/services/weather.service';
import { PetCardComponent } from './components/pet-card/pet-card.component';
import { QualityGateCardComponent } from './components/quality-gate-card/quality-gate-card.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';

type PetAction = 'feed' | 'level-up' | 'motivation';

@Component({
  selector: 'sqs-dashboard-page',
  standalone: true,
  imports: [TopBarComponent, TaskListComponent, PetCardComponent, QualityGateCardComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnDestroy {
  private static readonly DASHBOARD_REFRESH_INTERVAL_MS = 5000;

  private readonly router = inject(Router);
  readonly appState = inject(AppStateService);
  readonly weather = inject(WeatherService);
  readonly pokemon = inject(PokemonService);
  readonly busyTaskId = signal<string | null>(null);
  readonly busyWaterAmountMl = signal<number | null>(null);
  readonly busyPetAction = signal<PetAction | null>(null);
  private readonly dashboardRefreshInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.weather.initialize();
    this.dashboardRefreshInterval = setInterval(() => {
      if (!this.appState.isAuthenticated() || this.appState.isActionPending()) {
        return;
      }

      this.runAsync(() => this.appState.resetCurrentProgress(false));
    }, DashboardPageComponent.DASHBOARD_REFRESH_INTERVAL_MS);

    effect(() => {
      const pet = this.appState.pet();

      if (!pet) {
        return;
      }

      if (pet.isEgg) {
        return;
      }

      this.runAsync(() => this.pokemon.loadSpecies(pet.pokemonSpecies));
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.dashboardRefreshInterval);
  }

  completeTask(taskId: string): void {
    if (this.isQuestListBusy()) {
      return;
    }

    this.busyTaskId.set(taskId);
    this.runAsync(
      () => this.appState.completeTask(taskId),
      () => this.busyTaskId.set(null)
    );
  }

  feedPet(): void {
    this.runPetAction('feed', () => this.appState.feedPet());
  }

  testLevelUpPet(): void {
    this.runPetAction('level-up', () => this.appState.testLevelUp());
  }

  testMotivationDecay(): void {
    this.runPetAction('motivation', () => this.appState.testMotivationDecay());
  }

  addWater(amountMl: number): void {
    if (this.isQuestListBusy()) {
      return;
    }

    this.busyWaterAmountMl.set(amountMl);
    this.runAsync(
      () => this.appState.addWater(amountMl),
      () => this.busyWaterAmountMl.set(null)
    );
  }

  refreshWeather(): void {
    this.runAsync(() => this.weather.refresh());
  }

  searchWeatherCity(cityName: string): void {
    this.runAsync(() => this.weather.searchCity(cityName));
  }

  async logout(): Promise<void> {
    await this.appState.logout();
    await this.router.navigateByUrl('/auth');
  }

  async deleteAccount(): Promise<void> {
    const confirmed = globalThis.confirm(
      'Profil wirklich löschen? Dein Spielstand und alle Quest-Fortschritte werden dauerhaft entfernt.'
    );

    if (!confirmed) {
      return;
    }

    const result = await this.appState.deleteAccount();

    if (!result.success) {
      globalThis.alert(result.message);
      return;
    }

    await this.router.navigateByUrl('/auth');
  }

  private isQuestListBusy(): boolean {
    return this.busyTaskId() !== null || this.busyWaterAmountMl() !== null;
  }

  private runPetAction(actionName: PetAction, action: () => Promise<unknown>): void {
    if (this.busyPetAction() !== null || this.appState.isActionPending()) {
      return;
    }

    this.busyPetAction.set(actionName);
    this.runAsync(action, () => this.busyPetAction.set(null));
  }

  private runAsync(action: () => Promise<unknown>, afterAction?: () => void): void {
    action()
      .catch((error: unknown) => {
        console.error('Dashboard action failed', error);
      })
      .finally(() => afterAction?.());
  }
}
