import { Events, Client } from "discord.js";
import type { Event } from "../utils/eventLoader.js";
import { logger } from "../utils/logger.js";

const event: Event<typeof Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client<true>) {
    logger.info(`Bot is ready! Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s)`);
  },
};

export default event;
