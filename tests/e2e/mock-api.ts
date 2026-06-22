import { Page, Route } from "@playwright/test";

export type TaskFixture = {
  id: number;
  title: string;
  description: string;
};

export const waterTask: TaskFixture = {
  id: 1,
  title: "Wasser trinken",
  description: "Trinke heute 3 Liter Wasser.",
};

export const learningTask: TaskFixture = {
  id: 2,
  title: "30 Minuten lernen",
  description: "Ein fokussierter Lernblock für dein Pokémon.",
};

export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    globalThis.localStorage.clear();
  });
}

export function berlinWeatherLocation() {
  return {
    latitude: 52.52,
    longitude: 13.41,
    label: "Berlin, Berlin, Deutschland",
  };
}

export function berlinWeatherSnapshot({
  temperatureC,
  weatherCode,
}: {
  temperatureC: number;
  weatherCode: number;
}) {
  return {
    condition: "cloudy",
    timeOfDay: "day",
    temperatureC,
    weatherCode,
    label: "Bewoelkt",
    locationLabel: "Berlin, Berlin, Deutschland",
    updatedAt: "2026-06-15T10:00:00Z",
  };
}

export async function fulfillOpenMeteoForecast(
  route: Route,
  {
    temperatureC,
    weatherCode,
  }: {
    temperatureC: number;
    weatherCode: number;
  },
): Promise<void> {
  await route.fulfill({
    json: {
      current: {
        temperature_2m: temperatureC,
        weather_code: weatherCode,
        is_day: 1,
        time: "2026-06-15T10:00",
      },
    },
  });
}
