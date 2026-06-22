import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DEFAULT_WEATHER_SCENE } from '../../../../core/state/weather-appearance.logic';
import { GameFeedback } from '../../../../shared/models/app-state.model';
import { PetCareState, PokemonSnapshot, PetState } from '../../../../shared/models/pet.model';
import { WeatherScene, WeatherSnapshot } from '../../../../shared/models/weather.model';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { ProgressBarComponent } from '../../../../shared/ui/progress-bar/progress-bar.component';
import { StatBadgeComponent } from '../../../../shared/ui/stat-badge/stat-badge.component';
import { PetVisualComponent } from '../pet-visual/pet-visual.component';

const DEFAULT_POKEMON_SPRITE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png';

@Component({
  selector: 'sqs-pet-card',
  standalone: true,
  imports: [PetVisualComponent, ProgressBarComponent, StatBadgeComponent, UiButtonComponent],
  templateUrl: './pet-card.component.html',
  styleUrl: './pet-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PetCardComponent {
  readonly pet = input<PetState | null>(null);
  readonly completedTasks = input(0);
  readonly totalTasks = input(0);
  readonly weatherScene = input<WeatherScene>(DEFAULT_WEATHER_SCENE);
  readonly weatherSnapshot = input<WeatherSnapshot | null>(null);
  readonly weatherLoading = input(false);
  readonly weatherError = input<string | null>(null);
  readonly petCareState = input<PetCareState>('calm');
  readonly gameFeedback = input<GameFeedback | null>(null);
  readonly pokemon = input<PokemonSnapshot | null>(null);
  readonly pokemonImageUrl = input<string | null>(null);
  readonly pokemonLoading = input(false);
  readonly feedCost = input(10);
  readonly isLevelingUp = input(false);
  readonly isFeedBusy = input(false);
  readonly isTestLevelUpBusy = input(false);
  readonly isTestMotivationDecayBusy = input(false);
  readonly feedRequested = output<void>();
  readonly testLevelUpRequested = output<void>();
  readonly testMotivationDecayRequested = output<void>();
  readonly weatherRefreshRequested = output<void>();
  readonly weatherCitySubmitted = output<string>();

  readonly displayName = computed(() =>
    this.pet()?.isEgg
      ? 'Pokémon-Ei'
      : (this.pokemon()?.displayName ?? this.pet()?.name ?? 'Pokémon Partner')
  );
  readonly displaySpriteUrl = computed(() =>
    this.pet()?.isEgg
      ? (this.pokemonImageUrl() ?? 'egg.svg')
      : (this.pokemonImageUrl() ?? this.pokemon()?.spriteUrl ?? DEFAULT_POKEMON_SPRITE_URL)
  );
  readonly displayPokemonTypes = computed(() =>
    this.pet()?.isEgg ? [] : (this.pokemon()?.types ?? [])
  );
  readonly displayPokemonSource = computed(() =>
    this.pet()?.isEgg ? 'fallback' : (this.pokemon()?.source ?? 'fallback')
  );
  readonly canFeed = computed(() => (this.pet()?.availableFoodPoints ?? 0) >= this.feedCost());
  readonly pokemonStatus = computed(() => {
    if (this.pet()?.isEgg) {
      return 'Ei bis Lvl. 10';
    }

    if (this.pokemonLoading()) {
      return 'Daten laden';
    }

    const pokemon = this.pokemon();
    const species = this.pet()?.pokemonSpecies;

    return pokemon?.displayName ?? (species ? formatPokemonName(species) : 'Pokémon');
  });
  readonly weatherStatus = computed(() => {
    if (this.weatherLoading()) {
      return 'Wetter wird geladen';
    }

    return this.weatherError() ?? this.weatherScene().description;
  });
  readonly weatherUpdatedAtLabel = computed(() => {
    const weatherSnapshot = this.weatherSnapshot();

    if (!weatherSnapshot) {
      return 'Noch nicht aktualisiert';
    }

    const updatedAt = weatherSnapshot.updatedAt;

    if (!updatedAt) {
      return 'Zeit unbekannt';
    }

    const updatedAtTimeLabel = formatWeatherUpdatedAtTime(updatedAt);

    if (!updatedAtTimeLabel) {
      return 'Aktualisierungszeit unbekannt';
    }

    return `Letzte Aktualisierung: ${updatedAtTimeLabel}`;
  });

  requestFeeding(): void {
    if (this.isFeedBusy() || !this.canFeed()) {
      return;
    }

    this.feedRequested.emit();
  }

  requestTestLevelUp(): void {
    if (this.isTestLevelUpBusy()) {
      return;
    }

    this.testLevelUpRequested.emit();
  }

  requestTestMotivationDecay(): void {
    if (this.isTestMotivationDecayBusy()) {
      return;
    }

    this.testMotivationDecayRequested.emit();
  }

  requestWeatherRefresh(): void {
    this.weatherRefreshRequested.emit();
  }

  submitWeatherCity(event: SubmitEvent, cityName: string): void {
    event.preventDefault();
    this.weatherCitySubmitted.emit(cityName);
  }
}

export function formatWeatherUpdatedAtTime(updatedAt: string): string | null {
  const updatedAtDate = new Date(updatedAt);

  if (Number.isNaN(updatedAtDate.getTime())) {
    return null;
  }

  return `${new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(updatedAtDate)} Uhr`;
}

function formatPokemonName(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}
