import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await seedPokemon();
  await seedEvolutions();
  await seedEvolutionStages();

  const passwordHash = await bcrypt.hash("test123", 10);

  const pokemonCount = await prisma.pokemon.count();

  const randomPokemonId = randomInt(1, pokemonCount + 1);

  await prisma.user.upsert({
    where: { username: "testuser" },
    update: {
      currentPokemonId: 1,
      eggPokemonId: 1,
    },
    create: {
      username: "testuser",
      passwordHash,
      isEgg: true,
      happiness: 0,
      currentPokemonId: 1,
      eggPokemonId: randomPokemonId,

      stats: {
        create: {
          totalLogins: 0,
          totalHappinessGained: 0,
        },
      },
    },
  });

  const tasks = [
    {
      title: "30 Minuten lernen",
      legacyTitles: ["Complete one study session"],
      description: "Schließe eine fokussierte Lerneinheit ab.",
      feedPoints: 20,
    },
    {
      title: "Wasser trinken",
      legacyTitles: ["Drink water"],
      description: "Trinke genug Wasser über den Tag verteilt.",
      feedPoints: 10,
    },
    {
      title: "Arbeitsplatz aufräumen",
      legacyTitles: [
        "Clean workspace",
        "Arbeitsplatz aufraeumen",
        "Workspace aufraeumen",
        "Workspace aufräumen",
      ],
      description: "Räume deinen Schreibtisch oder Lernbereich auf.",
      feedPoints: 15,
    },
  ];

  for (const task of tasks) {
    let existingTask = await prisma.task.findUnique({
      where: { title: task.title },
    });

    for (const legacyTitle of task.legacyTitles) {
      if (existingTask) {
        break;
      }

      existingTask = await prisma.task.findUnique({
        where: { title: legacyTitle },
      });
    }

    if (existingTask) {
      await prisma.task.update({
        where: { id: existingTask.id },
        data: {
          title: task.title,
          description: task.description,
          feedPoints: task.feedPoints,
        },
      });
      continue;
    }

    await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        feedPoints: task.feedPoints,
      },
    });
  }

  const testUser = await prisma.user.findUnique({
    where: { username: "testuser" },
  });

  const allTasks = await prisma.task.findMany();

  if (testUser) {
    for (const task of allTasks) {
      await prisma.userTask.upsert({
        where: {
          userId_taskId: {
            userId: testUser.id,
            taskId: task.id,
          },
        },
        update: {},
        create: {
          userId: testUser.id,
          taskId: task.id,
          completed: false,
        },
      });
    }
  }

  console.log("Seed completed");
}

async function seedPokemon() {
  console.log("Loading Pokemon...");

  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
  const data = await response.json();

  for (let i = 0; i < data.results.length; i++) {
    const pokemonId = i + 1;

    const pokemonResponse = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${pokemonId}`,
    );

    const pokemonData = await pokemonResponse.json();

    await prisma.pokemon.upsert({
      where: {
        id: pokemonData.id,
      },
      update: {
        name: pokemonData.name,
        imageUrl: pokemonData.sprites.other["official-artwork"].front_default,
      },
      create: {
        id: pokemonData.id,
        name: pokemonData.name,
        imageUrl: pokemonData.sprites.other["official-artwork"].front_default,
      },
    });

    console.log("Pokemon saved.");
  }

  console.log("Pokemon loaded.");
}
type EvolutionPair = {
  from: string;
  to: string;
};

function extractEvolutions(chain: any, evolutionPairs: EvolutionPair[]) {
  for (const next of chain.evolves_to) {
    evolutionPairs.push({
      from: chain.species.name,
      to: next.species.name,
    });

    extractEvolutions(next, evolutionPairs);
  }
}

async function seedEvolutions() {
  console.log("Loading evolutions...");

  for (let id = 1; id <= 151; id++) {
    const speciesResponse = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${id}`,
    );
    const speciesData = await speciesResponse.json();

    const evolutionChainUrl = new URL(speciesData.evolution_chain.url);

    if (evolutionChainUrl.hostname !== "pokeapi.co") {
      throw new Error("Invalid evolution chain URL");
    }

    const evolutionChainResponse = await fetch(evolutionChainUrl.toString());
    const evolutionChainData = await evolutionChainResponse.json();

    const evolutionPairs: { from: string; to: string }[] = [];

    extractEvolutions(evolutionChainData.chain, evolutionPairs);

    for (const pair of evolutionPairs) {
      const fromPokemon = await prisma.pokemon.findFirst({
        where: { name: pair.from },
      });

      const toPokemon = await prisma.pokemon.findFirst({
        where: { name: pair.to },
      });

      if (
        fromPokemon &&
        toPokemon &&
        fromPokemon.id <= 151 &&
        toPokemon.id <= 151
      ) {
        await prisma.pokemon.update({
          where: { id: fromPokemon.id },
          data: {
            evolutionId: toPokemon.id,
          },
        });

        console.log("Evolution relation saved.");
      }
    }
  }

  console.log("Evolutions loaded.");
}

async function seedEvolutionStages() {
  console.log("Loading evolution stages...");

  await prisma.pokemon.updateMany({
    data: {
      evolutionStage: 0,
    },
  });

  await prisma.pokemon.updateMany({
    where: {
      name: {
        in: ["ivysaur", "charmeleon", "wartortle"],
      },
    },
    data: {
      evolutionStage: 1,
    },
  });

  await prisma.pokemon.updateMany({
    where: {
      name: {
        in: ["venusaur", "charizard", "blastoise"],
      },
    },
    data: {
      evolutionStage: 2,
    },
  });

  console.log("Evolution stages loaded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
