import { Page } from "@playwright/test";
import { expect, test } from "../../frontend/testing/playwright-test";
import {
  berlinWeatherLocation,
  berlinWeatherSnapshot,
  clearBrowserStorage,
  fulfillOpenMeteoForecast,
  learningTask,
  waterTask,
} from "./mock-api";

const ivysaurSpriteUrl =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png";

const tasks = [waterTask, learningTask];

test.describe("PokeHabit", () => {
  test("führt vom Login durch Quest, Wasser, Training, Level-Up und Logout", async ({
    page,
  }, testInfo) => {
    const completions = new Map<number, boolean>([
      [1, false],
      [2, false],
    ]);
    const gameState = {
      waterLevel: 500,
      foodLevel: 0,
      pokemonImageUrl: ivysaurSpriteUrl,
      pokemonLevel: 2,
      growth: 40,
      happiness: 75,
      pendingFeedPoints: 10,
      streak: 2,
      yesterdayLoggedIn: true,
      serverNow: "2026-06-15T10:00:00Z",
    };

    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());

      if (url.pathname === "/api/auth/login") {
        await route.fulfill({ json: { message: "authenticated" } });
        return;
      }

      if (url.pathname === "/api/auth/logout") {
        await route.fulfill({ json: { message: "logged out" } });
        return;
      }

      if (url.pathname === "/api/tasks") {
        await route.fulfill({ json: tasks });
        return;
      }

      if (url.pathname === "/api/user/game-state") {
        await route.fulfill({ json: createGameState(gameState, completions) });
        return;
      }

      if (url.pathname === "/api/user/water") {
        const body = (await request.postDataJSON()) as { ml: number };
        gameState.waterLevel += body.ml;

        if (gameState.waterLevel >= 3000 && !completions.get(1)) {
          completions.set(1, true);
          gameState.pendingFeedPoints += 10;
          gameState.growth += 10;
        }

        await route.fulfill({ json: createGameState(gameState, completions) });
        return;
      }

      if (url.pathname === "/api/tasks/2/complete") {
        completions.set(2, true);
        gameState.pendingFeedPoints += 20;
        gameState.growth += 10;
        await route.fulfill({ json: { success: true } });
        return;
      }

      if (url.pathname === "/api/user/feed") {
        gameState.pendingFeedPoints = Math.max(
          0,
          gameState.pendingFeedPoints - 10,
        );
        gameState.happiness = Math.min(100, gameState.happiness + 1);
        await route.fulfill({ json: createGameState(gameState, completions) });
        return;
      }

      if (url.pathname === "/api/user/test-level-up") {
        gameState.pokemonLevel += 1;
        gameState.growth = 0;
        await route.fulfill({ json: createGameState(gameState, completions) });
        return;
      }

      if (url.pathname === "/api/user/test-motivation-decay") {
        const previousHappiness = gameState.happiness;
        gameState.happiness = Math.max(0, gameState.happiness - 25);
        if (previousHappiness > 0) {
          gameState.growth = Math.max(0, gameState.growth - 10);
        }
        await route.fulfill({ json: createGameState(gameState, completions) });
        return;
      }

      if (url.pathname === "/api/weather/location") {
        await route.fulfill({ json: berlinWeatherLocation() });
        return;
      }

      if (url.pathname === "/api/weather/current") {
        await route.fulfill({
          json: berlinWeatherSnapshot({ temperatureC: 22, weatherCode: 2 }),
        });
        return;
      }

      await route.fulfill({ status: 404, json: { error: "not mocked" } });
    });

    await page.route("https://api.open-meteo.com/**", async (route) => {
      await fulfillOpenMeteoForecast(route, {
        temperatureC: 22,
        weatherCode: 2,
      });
    });

    await page.route("https://pokeapi.co/**", async (route) => {
      await route.fulfill({
        json: {
          id: 2,
          name: "ivysaur",
          sprites: {
            other: {
              "official-artwork": {
                front_default: ivysaurSpriteUrl,
              },
            },
          },
          types: [{ type: { name: "grass" } }, { type: { name: "poison" } }],
        },
      });
    });

    await clearBrowserStorage(page);

    await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 10000 });

    await page.getByLabel("Spielername").fill("demo");
    await page.getByLabel("Passwort").fill("password123");
    await page
      .getByRole("button", { name: "Einloggen und weitermachen" })
      .click();

    await page.waitForURL("**/dashboard");
    await expect(
      page.getByRole("heading", { name: "Pokémon Quest Board" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Tagesquests" }),
    ).toBeVisible();
    await expect(page.getByText("500 / 3000 ml")).toBeVisible();
    await expect(motivationBadge(page)).toContainText("75%");
    await expect(
      page.getByRole("button", { name: "Partner trainieren", exact: true }),
    ).toBeEnabled();

    await page.getByRole("button", { name: "Motivation senken" }).click();
    await expect(motivationBadge(page)).toContainText("50%");
    await expect(
      page.getByText(
        "Motivationstest ausgeführt: 75% -> 50%, Wachstum 40 -> 30.",
      ),
    ).toBeVisible();

    await page
      .locator("sqs-task-card")
      .filter({ hasText: "30 Minuten lernen" })
      .getByRole("button", { name: "Erledigen" })
      .click();
    await expect(
      page.getByText("Quest erledigt. Dein Spielstand wurde aktualisiert."),
    ).toBeVisible();

    await page.getByRole("button", { name: "+500 ml" }).click();
    await expect(page.getByText("1000 / 3000 ml")).toBeVisible();
    await expect(page.getByText("+500 ml Wasser getrunken.")).toBeVisible();

    await page
      .getByRole("button", { name: "Partner trainieren", exact: true })
      .click();
    await expect(
      page.getByText("Fortschritt wurde für deinen Partner eingesetzt."),
    ).toBeVisible();
    await expect(motivationBadge(page)).toContainText("51%");

    await page.getByRole("button", { name: "Level-Up testen" }).click();
    await expect(page.getByText("Level-Up auf 3.")).toBeVisible();

    await testInfo.attach("Demo-Screenshot nach Level-Up", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    await page.getByRole("button", { name: "Abmelden" }).click();
    await page.waitForURL("**/auth");
  });
});

function createGameState(
  gameState: {
    waterLevel: number;
    foodLevel: number;
    pokemonImageUrl: string;
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

function motivationBadge(page: Page) {
  return page.locator("sqs-stat-badge").filter({ hasText: "Motivation" });
}
