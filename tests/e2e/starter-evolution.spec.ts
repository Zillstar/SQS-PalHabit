import { expect, test } from "../../frontend/testing/playwright-test";
import {
  berlinWeatherLocation,
  berlinWeatherSnapshot,
  clearBrowserStorage,
  fulfillOpenMeteoForecast,
  waterTask,
} from "./mock-api";

const tasks = [waterTask];

const speciesByStarter = {
  1: ["bulbasaur", "ivysaur", "venusaur"],
  4: ["charmander", "charmeleon", "charizard"],
  7: ["squirtle", "wartortle", "blastoise"],
} as const;

const starterFlows: ReadonlyArray<{
  starterPokemonId: keyof typeof speciesByStarter;
  label: string;
  expected: readonly [string, string, string];
}> = [
  {
    starterPokemonId: 1,
    label: "Bulbasaur",
    expected: ["Bulbasaur", "Ivysaur", "Venusaur"],
  },
  {
    starterPokemonId: 4,
    label: "Charmander",
    expected: ["Charmander", "Charmeleon", "Charizard"],
  },
  {
    starterPokemonId: 7,
    label: "Squirtle",
    expected: ["Squirtle", "Wartortle", "Blastoise"],
  },
];

test.describe.configure({ timeout: 60_000 });

for (const starterFlow of starterFlows) {
  test(`registriert ${starterFlow.label} und entwickelt bei Level 15 und 35 korrekt`, async ({
    page,
  }) => {
    let starterPokemonId: keyof typeof speciesByStarter = 1;
    const gameState = {
      waterLevel: 0,
      foodLevel: 0,
      pokemonImageUrl: null,
      pokemonLevel: 1,
      growth: 0,
      happiness: 0,
      pendingFeedPoints: 0,
      streak: 1,
      yesterdayLoggedIn: false,
      serverNow: "2026-06-15T10:00:00Z",
    };

    await page.route("**/assets/egg.png", async (route) => {
      await route.fulfill({
        path: "../backend/src/main/resources/static/assets/egg.png",
      });
    });

    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());

      if (url.pathname === "/api/auth/signup") {
        const body = (await request.postDataJSON()) as {
          starterPokemonId: keyof typeof speciesByStarter;
        };
        starterPokemonId = body.starterPokemonId;
        await route.fulfill({ json: { message: "created" } });
        return;
      }

      if (url.pathname === "/api/tasks") {
        await route.fulfill({ json: tasks });
        return;
      }

      if (url.pathname === "/api/user/game-state") {
        await route.fulfill({
          json: createGameState(gameState, starterPokemonId),
        });
        return;
      }

      if (url.pathname === "/api/user/test-level-up") {
        gameState.pokemonLevel += 1;
        gameState.growth = 0;
        await route.fulfill({
          json: createGameState(gameState, starterPokemonId),
        });
        return;
      }

      if (url.pathname === "/api/weather/location") {
        await route.fulfill({ json: berlinWeatherLocation() });
        return;
      }

      if (url.pathname === "/api/weather/current") {
        await route.fulfill({
          json: berlinWeatherSnapshot({ temperatureC: 20, weatherCode: 1 }),
        });
        return;
      }

      await route.fulfill({ status: 404, json: { error: "not mocked" } });
    });

    await page.route("https://api.open-meteo.com/**", async (route) => {
      await fulfillOpenMeteoForecast(route, {
        temperatureC: 20,
        weatherCode: 1,
      });
    });

    await page.route("https://pokeapi.co/**", async (route) => {
      const name = resolveSpecies(gameState.pokemonLevel, starterPokemonId);
      const pokemonId = resolvePokemonId(
        gameState.pokemonLevel,
        starterPokemonId,
      );
      await route.fulfill({
        json: {
          id: pokemonId,
          name,
          sprites: {
            other: {
              "official-artwork": {
                front_default: resolveImageUrl(pokemonId),
              },
            },
          },
          types: [{ type: { name: "water" } }],
        },
      });
    });

    await clearBrowserStorage(page);

    await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 10000 });
    await page.getByRole("tab", { name: "Registrieren" }).click();
    await expect(
      page.getByRole("heading", { name: "Lege dein Spielerprofil an" }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Spielername" })
      .fill(`flow-${starterFlow.label.toLowerCase()}-${Date.now()}`);
    await page.getByLabel("Passwort").fill("password123");
    await page.getByText(starterFlow.label).click();
    await page
      .getByRole("button", { name: "Profil anlegen und starten" })
      .click();

    await page.waitForURL("**/dashboard");
    await expect(
      page.getByRole("heading", {
        name: /Pokémon-Ei begleitet/,
      }),
    ).toBeVisible();
    expect(starterPokemonId).toBe(starterFlow.starterPokemonId);
    await expect(page.locator("sqs-pet-visual img")).toHaveAttribute(
      "src",
      /egg\.png/,
    );

    for (let index = 0; index < 9; index += 1) {
      await page.getByRole("button", { name: "Level-Up testen" }).click();
    }

    await expect(
      page.getByRole("heading", {
        name: new RegExp(String.raw`${starterFlow.expected[0]} begleitet`),
      }),
    ).toBeVisible();
    await expect(page.getByText("Level 10")).toBeVisible();
    await expect(page.locator("sqs-pet-visual img")).toHaveAttribute(
      "src",
      new RegExp(String.raw`/${starterPokemonId}\.png`),
    );

    for (let index = 0; index < 5; index += 1) {
      await page.getByRole("button", { name: "Level-Up testen" }).click();
    }

    await expect(
      page.getByRole("heading", {
        name: new RegExp(String.raw`${starterFlow.expected[1]} begleitet`),
      }),
    ).toBeVisible();
    await expect(page.getByText("Level 15")).toBeVisible();
    await expect(page.locator("sqs-pet-visual img")).toHaveAttribute(
      "src",
      new RegExp(String.raw`/${starterPokemonId + 1}\.png`),
    );

    for (let index = 0; index < 20; index += 1) {
      await page.getByRole("button", { name: "Level-Up testen" }).click();
    }

    await expect(
      page.getByRole("heading", {
        name: new RegExp(String.raw`${starterFlow.expected[2]} begleitet`),
      }),
    ).toBeVisible();
    await expect(page.getByText("Level 35")).toBeVisible();
    await expect(page.locator("sqs-pet-visual img")).toHaveAttribute(
      "src",
      new RegExp(String.raw`/${starterPokemonId + 2}\.png`),
    );
  });
}

function createGameState(
  gameState: {
    waterLevel: number;
    foodLevel: number;
    pokemonImageUrl: null;
    isEgg?: boolean;
    pokemonLevel: number;
    growth: number;
    happiness: number;
    pendingFeedPoints: number;
    streak: number;
    yesterdayLoggedIn: boolean;
    serverNow: string;
  },
  starterPokemonId: keyof typeof speciesByStarter,
) {
  const currentPokemonId = resolvePokemonId(
    gameState.pokemonLevel,
    starterPokemonId,
  );
  const isEgg = gameState.pokemonLevel < 10;

  return {
    ...gameState,
    currentPokemonId,
    isEgg,
    pokemonImageUrl: isEgg
      ? "/assets/egg.png"
      : resolveImageUrl(currentPokemonId),
    pokemonName: isEgg
      ? null
      : resolveSpecies(gameState.pokemonLevel, starterPokemonId),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      completed: false,
    })),
  };
}

function resolveSpecies(
  level: number,
  starterPokemonId: keyof typeof speciesByStarter,
): string {
  const chain = speciesByStarter[starterPokemonId];

  if (level >= 35) {
    return chain[2];
  }

  if (level >= 15) {
    return chain[1];
  }

  return chain[0];
}

function resolvePokemonId(
  level: number,
  starterPokemonId: keyof typeof speciesByStarter,
): number {
  if (level >= 35) {
    return starterPokemonId + 2;
  }

  if (level >= 15) {
    return starterPokemonId + 1;
  }

  return starterPokemonId;
}

function resolveImageUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}
