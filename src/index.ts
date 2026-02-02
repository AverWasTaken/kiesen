import "dotenv/config";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import { ConvexHttpClient } from "convex/browser";
import { loadCommands, type Command } from "./utils/commandLoader.js";
import { loadEvents } from "./utils/eventLoader.js";
import { logger } from "./utils/logger.js";

// Extend Discord.js Client type to include commands and config
declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
    convex: ConvexHttpClient;
    config: {
      prefix: string;
      ownerId: string;
    };
  }
}

// Validate required environment variables
const requiredEnvVars = ["DISCORD_TOKEN"] as const;
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

// Bot configuration
client.config = {
  prefix: process.env.PREFIX || "!",
  ownerId: process.env.OWNER_ID || "",
};

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
      client.commands.set(command.name, command);
      // Also register aliases
      if (command.aliases) {
        for (const alias of command.aliases) {
          client.commands.set(alias, command);
        }
      }
    }
    logger.info(`Loaded ${commands.length} commands`);

    // Load events
    const eventCount = await loadEvents(client);
    logger.info(`Loaded ${eventCount} events`);

    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Failed to initialize bot:", error.message);
      console.error(error.stack);
    } else {
      logger.error("Failed to initialize bot:", String(error));
    }
    process.exit(1);
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
