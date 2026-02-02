import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export async function loadCommands(): Promise<Command[]> {
  const commands: Command[] = [];
  const commandsPath = join(__dirname, "..", "commands");

  try {
    const commandFiles = readdirSync(commandsPath).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    );

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const command = (await import(filePath)) as { default: Command };

      if (command.default?.data && command.default?.execute) {
        commands.push(command.default);
        logger.debug(`Loaded command: ${command.default.data.name}`);
      } else {
        logger.warn(`Command file ${file} is missing required exports`);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      logger.warn("Commands directory not found");
    } else {
      throw error;
    }
  }

  return commands;
}
