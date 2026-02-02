import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Message, PermissionResolvable } from "discord.js";
import { logger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  usage?: string;
  permissions?: PermissionResolvable[];
  ownerOnly?: boolean;
  execute: (message: Message, args: string[]) => Promise<void>;
}

export async function loadCommands(): Promise<Command[]> {
  const commands: Command[] = [];
  const commandsPath = join(__dirname, "..", "commands");

  try {
    const commandFiles = readdirSync(commandsPath).filter(
      (file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.endsWith(".d.ts")
    );

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const command = (await import(filePath)) as { default: Command };

      if (command.default?.name && typeof command.default?.execute === 'function') {
        commands.push(command.default);
        logger.debug(`Loaded command: ${command.default.name}`);
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
