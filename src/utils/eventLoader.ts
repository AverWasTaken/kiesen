import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Client, ClientEvents } from "discord.js";
import { logger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => void | Promise<void>;
}

export async function loadEvents(client: Client): Promise<number> {
  const eventsPath = join(__dirname, "..", "events");
  let eventCount = 0;

  try {
    const eventFiles = readdirSync(eventsPath).filter(
      (file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.endsWith(".d.ts")
    );

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      const event = (await import(filePath)) as { default: Event };

      if (event.default?.name && event.default?.execute) {
        if (event.default.once) {
          client.once(event.default.name, (...args) => event.default.execute(...args));
        } else {
          client.on(event.default.name, (...args) => event.default.execute(...args));
        }
        eventCount++;
        logger.debug(`Loaded event: ${event.default.name}`);
      } else {
        logger.warn(`Event file ${file} is missing required exports`);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      logger.warn("Events directory not found");
    } else {
      throw error;
    }
  }

  return eventCount;
}
