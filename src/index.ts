import "dotenv/config";
import { Client, GatewayIntentBits, Collection, REST, Routes } from "discord.js";
import { ConvexHttpClient } from "convex/browser";
import { loadCommands, type Command } from "./utils/commandLoader.js";
import { loadEvents } from "./utils/eventLoader.js";
import { logger } from "./utils/logger.js";

// Extend Discord.js Client type to include commands
declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
    convex: ConvexHttpClient;
  }
}

// Validate required environment variables
const requiredEnvVars = ["DISCORD_TOKEN", "DISCORD_CLIENT_ID"] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize collections and services
client.commands = new Collection();

// Initialize Convex client (optional - only if URL is provided)
if (process.env.CONVEX_URL) {
  client.convex = new ConvexHttpClient(process.env.CONVEX_URL);
  logger.info("Convex client initialized");
} else {
  logger.warn("CONVEX_URL not set - Convex features disabled");
}

// Main initialization function
async function init(): Promise<void> {
  try {
    // Load commands
    const commands = await loadCommands();
    for (const command of commands) {
      client.commands.set(command.data.name, command);
    }
    logger.info(`Loaded ${commands.length} commands`);

    // Load events
    const eventCount = await loadEvents(client);
    logger.info(`Loaded ${eventCount} events`);

    // Register slash commands with Discord
    await registerCommands(commands);

    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    logger.error("Failed to initialize bot:", error);
    process.exit(1);
  }
}

// Register slash commands with Discord API
async function registerCommands(commands: Command[]): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
  const commandData = commands.map((cmd) => cmd.data.toJSON());

  try {
    logger.info("Registering slash commands...");

    if (process.env.DISCORD_GUILD_ID) {
      // Register to specific guild (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID!,
          process.env.DISCORD_GUILD_ID
        ),
        { body: commandData }
      );
      logger.info(`Registered ${commandData.length} commands to guild`);
    } else {
      // Register globally (takes up to 1 hour to propagate)
      await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
        body: commandData,
      });
      logger.info(`Registered ${commandData.length} commands globally`);
    }
  } catch (error) {
    logger.error("Failed to register commands:", error);
    throw error;
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down...");
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Shutting down...");
  client.destroy();
  process.exit(0);
});

// Start the bot
init();
