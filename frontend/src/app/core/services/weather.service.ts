import { computed, Injectable, signal } from '@angular/core';
import { resolveWeatherScene } from '../state/weather-appearance.logic';
import { WeatherLocation, WeatherSnapshot } from '../../shared/models/weather.model';
import { BackendWeatherAdapter, WeatherAdapter } from './weather.adapter';

const DEFAULT_LOCATION: WeatherLocation = {
  latitude: 52.52,
  longitude: 13.41,
  label: 'Berlin',
};
const HAWAII_FALLBACK_LOCATION: WeatherLocation = {
  latitude: 21.29637,
  longitude: -157.70175,
  label: 'Hawaii Kai, Hawaii, Vereinigte Staaten',
};
const WEATHER_LOCATION_STORAGE_KEY = 'sqs-weather-location';
const WEATHER_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly weatherAdapter: WeatherAdapter = new BackendWeatherAdapter();
  readonly location = signal<WeatherLocation>(readStoredLocation());
  readonly snapshot = signal<WeatherSnapshot | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly scene = computed(() => resolveWeatherScene(this.snapshot()));
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private hasInitialized = false;

  initialize(): void {
    if (this.hasInitialized) {
      return;
    }

    this.hasInitialized = true;
    this.runAsync(() => this.refresh());
    this.startAutoRefresh();
  }

  async refresh(): Promise<void> {
    await this.loadWeatherForLocation(this.location());
  }

  async searchCity(cityName: string): Promise<void> {
    const normalizedCityName = cityName.trim();

    if (!normalizedCityName) {
      this.errorMessage.set('Bitte gib eine Stadt ein.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const location = await this.weatherAdapter.resolveCity(normalizedCityName);
      this.location.set(location);
      storeLocation(location);
      await this.loadWeatherForLocation(location, false);
    } catch {
      this.errorMessage.set(`Für "${normalizedCityName}" wurden keine Wetterdaten gefunden.`);
      this.isLoading.set(false);
    }
  }

  private startAutoRefresh(): void {
    this.refreshIntervalId ??= setInterval(() => {
      this.runAsync(() => this.refresh());
    }, WEATHER_REFRESH_INTERVAL_MS);
  }

  private runAsync(action: () => Promise<unknown>): void {
    action().catch(() => {
      this.errorMessage.set('Wetterdaten sind gerade nicht verfügbar.');
      this.isLoading.set(false);
    });
  }

  private async loadWeatherForLocation(
    location: WeatherLocation,
    shouldToggleLoading = true
  ): Promise<void> {
    if (shouldToggleLoading) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
    }

    try {
      this.snapshot.set(await this.weatherAdapter.loadWeather(location));
    } catch {
      this.errorMessage.set('Wetterdaten sind gerade nicht verfügbar.');
    } finally {
      this.isLoading.set(false);
    }
  }
}

function readStoredLocation(): WeatherLocation {
  try {
    const rawValue = globalThis.localStorage?.getItem(WEATHER_LOCATION_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_LOCATION;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<WeatherLocation>;

    if (
      typeof parsedValue.latitude === 'number' &&
      typeof parsedValue.longitude === 'number' &&
      typeof parsedValue.label === 'string' &&
      parsedValue.label.trim()
    ) {
      return migrateStoredLocation({
        latitude: parsedValue.latitude,
        longitude: parsedValue.longitude,
        label: parsedValue.label,
      });
    }
  } catch {
    globalThis.localStorage?.removeItem(WEATHER_LOCATION_STORAGE_KEY);
  }

  return DEFAULT_LOCATION;
}

function storeLocation(location: WeatherLocation): void {
  globalThis.localStorage?.setItem(WEATHER_LOCATION_STORAGE_KEY, JSON.stringify(location));
}

function migrateStoredLocation(location: WeatherLocation): WeatherLocation {
  if (isLegacyHawaiiIslandLocation(location)) {
    storeLocation(HAWAII_FALLBACK_LOCATION);
    return HAWAII_FALLBACK_LOCATION;
  }

  return location;
}

function isLegacyHawaiiIslandLocation(location: WeatherLocation): boolean {
  const normalizedLabel = location.label.toLowerCase();

  return (
    normalizedLabel === 'hawaii, hawaii, vereinigte staaten' &&
    Math.abs(location.latitude - 19.54814) < 0.01 &&
    Math.abs(location.longitude - -155.66495) < 0.01
  );
}
