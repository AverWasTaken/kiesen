import { Events, Message, PermissionsBitField } from "discord.js";
import type { Event } from "../utils/eventLoader.js";
import { logger } from "../utils/logger.js";

const event: Event<typeof Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    // Ignore bots and DMs
    if (message.author.bot) return;
    if (!message.guild) return;

    const prefix = message.client.config.prefix;

    // Check if message starts with prefix
    if (!message.content.startsWith(prefix)) return;

    // Parse command and arguments
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    // Get command from collection
    const command = message.client.commands.get(commandName);
    if (!command) return;

    // Check owner-only commands
    if (command.ownerOnly && message.author.id !== message.client.config.ownerId) {
      await message.reply("❌ This command can only be used by the bot owner.");
      return;
    }

    // Check permissions
    if (command.permissions && command.permissions.length > 0) {
      const memberPermissions = message.member?.permissions as PermissionsBitField;
      const missingPermissions = command.permissions.filter(
        (perm) => !memberPermissions.has(perm)
      );

      if (missingPermissions.length > 0) {
        await message.reply("❌ You don't have permission to use this command.");
        return;
      }
    }

    try {
      logger.debug(`Executing command: ${command.name} by ${message.author.tag}`);
      await command.execute(message, args);
    } catch (error) {
      logger.error(`Error executing command ${command.name}:`, error);
      await message.reply("❌ There was an error executing this command.");
    }
  },
};

export default event;
