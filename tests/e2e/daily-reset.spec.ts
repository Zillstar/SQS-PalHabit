import { Page } from "@playwright/test";
import { expect, test } from "../../frontend/testing/playwright-test";

const tasks = [
  {
    id: 1,
    title: "Wasser trinken",
    description: "Trinke heute 3 Liter Wasser.",
  },
  {
    id: 2,
    title: "30 Minuten lernen",
    description: "Ein fokussierter Lernblock für dein Pokémon.",
  },
];

test.describe("Daily reset", () => {
  test("zeigt nach abgelaufenem Reset-Intervall ohne neuen Login wieder offene Buttons", async ({
    page,
  }) => {
    let loginCount = 0;
    let resetExpired = false;
    const completions = new Map<number, boolean>([
      [1, false],
      [2, false],
    ]);
    const gameState = {
      waterLevel: 2500,
      foodLevel: 0,
      currentPokemonId: 1,
      isEgg: true,
      pokemonImageUrl: "/assets/egg.png",
      pokemonName: "bulbasaur",
      pokemonLevel: 3,
      growth: 40,
      happiness: 80,
      pendingFeedPoints: 0,
      streak: 2,
      yesterdayLoggedIn: true,
      serverNow: "2026-06-16T10:00:00Z",
    };

    await page.route("**/assets/egg.png", async (route) => {
      await route.fulfill({
        path: "../backend/src/main/resources/static/assets/egg.png",
      });
    });

    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());

      if (url.pathname === "/api/auth/login") {
        loginCount += 1;
        await route.fulfill({ json: { message: "authenticated" } });
        return;
      }

      if (url.pathname === "/api/auth/logout") {
        resetExpired = true;
        await page.reload();
        completions.set(1, false);
        completions.set(2, false);
        gameState.waterLevel = 0;
        gameState.pendingFeedPoints = 0;
        gameState.streak = 3;
        gameState.serverNow = "2026-06-17T10:01:00Z";

        await route.fulfill({ json: { message: "logged out" } });
        return;
      }

      if (url.pathname === "/api/tasks") {
        await route.fulfill({ json: tasks });
        return;
      }

      if (url.pathname === "/api/user/game-state") {
        if (resetExpired) {
          completions.set(1, false);
          completions.set(2, false);
          gameState.waterLevel = 0;
          gameState.pendingFeedPoints = 0;
          gameState.serverNow = "2026-06-16T10:01:00Z";
        }

        await route.fulfill({ json: createGameState(gameState, completions) });
        return;
      }

      if (url.pathname === "/api/user/water") {
        const body = (await request.postDataJSON()) as { ml: number };
        gameState.waterLevel += body.ml;

        if (gameState.waterLevel >= 3000) {
          completions.set(1, true);
          gameState.pendingFeedPoints += 10;
        }

        await route.fulfill({ json: createGameState(gameState, completions) });
        return;
      }

      if (url.pathname === "/api/tasks/2/complete") {
        completions.set(2, true);
        gameState.pendingFeedPoints += 20;
        await route.fulfill({ json: { success: true } });
        return;
      }

      if (url.pathname === "/api/weather/location") {
        await route.fulfill({ json: weatherLocation() });
        return;
      }

      if (url.pathname === "/api/weather/current") {
        await route.fulfill({ json: weatherSnapshot() });
        return;
      }

      await route.fulfill({
        status: 404,
        json: { error: `not mocked: ${request.method()} ${url.pathname}` },
      });
    });

    await mockExternalServices(page);
    await page.addInitScript(() => {
      globalThis.localStorage.clear();
    });

    await login(page);
    await expect(streakMetric(page)).toContainText("2");
    await expect(page.getByText("2500 / 3000 ml")).toBeVisible();

    await page.getByRole("button", { name: "+500 ml" }).click();
    await expect(page.getByText("3000 / 3000 ml")).toBeVisible();
    await expect(page.getByRole("button", { name: "+500 ml" })).toBeDisabled();

    const learningQuest = page
      .locator("sqs-task-card")
      .filter({ hasText: "30 Minuten lernen" });
    await learningQuest.getByRole("button", { name: "Erledigen" }).click();
    await expect(
      learningQuest.getByRole("button", { name: "Erledigt" }),
    ).toBeDisabled();
    await expect(questSummary(page)).toHaveText("2/2");

    resetExpired = true;

    await expect(page.getByText("0 / 3000 ml")).toBeVisible();
    await expect(page.getByRole("button", { name: "+250 ml" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "+500 ml" })).toBeEnabled();
    await expect(
      page
        .locator("sqs-task-card")
        .filter({ hasText: "30 Minuten lernen" })
        .getByRole("button", { name: "Erledigen" }),
    ).toBeEnabled();
    await expect(questSummary(page)).toHaveText("0/2");
    expect(loginCount).toBe(1);
  });
});

async function login(page: Page) {
  await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 10000 });
  await page.getByLabel("Spielername").fill("reset-demo");
  await page.getByLabel("Passwort").fill("password123");
  await page
    .getByRole("button", { name: "Einloggen und weitermachen" })
    .click();
  await page.waitForURL("**/dashboard");
}

async function mockExternalServices(page: Page) {
  await page.route("https://api.open-meteo.com/**", async (route) => {
    await route.fulfill({
      json: {
        current: {
          temperature_2m: 22,
          weather_code: 2,
          is_day: 1,
          time: "2026-06-16T10:00",
        },
      },
    });
  });

  await page.route("https://pokeapi.co/**", async (route) => {
    await route.fulfill({
      json: {
        id: 1,
        name: "bulbasaur",
        sprites: {
          other: {
            "official-artwork": {
              front_default: "/assets/egg.png",
            },
          },
        },
        types: [{ type: { name: "grass" } }, { type: { name: "poison" } }],
      },
    });
  });
}

function streakMetric(page: Page) {
  return page
    .locator(".quality-gate__metric")
    .filter({ hasText: "Anmelde-Serie" });
}

function questSummary(page: Page) {
  return page
    .locator(".task-list__summary-item")
    .filter({ hasText: "Quests" })
    .locator("strong");
}

function createGameState(
  gameState: {
    waterLevel: number;
    foodLevel: number;
    currentPokemonId: number;
    isEgg: boolean;
    pokemonImageUrl: string;
    pokemonName: string;
    pokemonLevel: number;
    growth: number;
    happiness: number;
    pendingFeedPoints: number;
    streak: number;
    yesterdayLoggedIn: boolean;
    serverNow: string;
  },
  completions: Map<number, boolean>,
) {
  return {
    ...gameState,
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      completed: completions.get(task.id) ?? false,
    })),
  };
}

function weatherLocation() {
  return {
    latitude: 52.52,
    longitude: 13.41,
    label: "Berlin, Berlin, Deutschland",
  };
}

function weatherSnapshot() {
  return {
    condition: "cloudy",
    timeOfDay: "day",
    temperatureC: 22,
    weatherCode: 2,
    label: "Bewoelkt",
    locationLabel: "Berlin, Berlin, Deutschland",
    updatedAt: "2026-06-16T10:00:00Z",
  };
}
