import { Events, Interaction } from "discord.js";
import type { Event } from "../utils/eventLoader.js";
import { logger } from "../utils/logger.js";

const event: Event<typeof Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      logger.debug(
        `Executing command: ${interaction.commandName} by ${interaction.user.tag}`
      );
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}:`, error);

      const errorMessage = "There was an error executing this command.";

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  },
};

export default event;
