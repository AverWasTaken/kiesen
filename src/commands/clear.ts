import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import type { Command } from "../utils/commandLoader.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete multiple messages from a channel")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Only delete messages from this user")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const channel = interaction.channel as TextChannel;
    if (!channel.isTextBased() || channel.isDMBased()) {
      await interaction.reply({ content: "This command cannot be used in this channel.", ephemeral: true });
      return;
    }

    const amount = interaction.options.getInteger("amount", true);
    const targetUser = interaction.options.getUser("user");

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await channel.messages.fetch({ limit: amount });

      // Filter by user if specified
      if (targetUser) {
        messages = messages.filter((msg) => msg.author.id === targetUser.id);
      }

      // Filter out messages older than 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter((msg) => msg.createdTimestamp > twoWeeksAgo);

      if (messages.size === 0) {
        await interaction.editReply("No messages found to delete.");
        return;
      }

      const deleted = await channel.bulkDelete(messages, true);

      const response = targetUser
        ? `🗑️ Deleted **${deleted.size}** message(s) from ${targetUser.tag}.`
        : `🗑️ Deleted **${deleted.size}** message(s).`;

      await interaction.editReply(response);
    } catch {
      await interaction.editReply("Failed to delete messages. Messages older than 14 days cannot be bulk deleted.");
    }
  },
};

export default command;
