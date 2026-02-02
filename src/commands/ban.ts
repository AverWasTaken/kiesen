import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { canModerate } from "../utils/permissions.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to ban").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the ban").setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("delete_days")
        .setDescription("Days of messages to delete (0-7)")
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const target = interaction.options.getMember("user") as GuildMember | null;
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const deleteDays = interaction.options.getInteger("delete_days") ?? 0;

    if (!target) {
      await interaction.reply({ content: "Could not find that user.", ephemeral: true });
      return;
    }

    const check = canModerate(interaction, target);
    if (!check.success) {
      await interaction.reply({ content: check.reason!, ephemeral: true });
      return;
    }

    if (!target.bannable) {
      await interaction.reply({ content: "I cannot ban this user.", ephemeral: true });
      return;
    }

    try {
      await target.ban({
        reason: `${reason} (by ${interaction.user.tag})`,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });
      await interaction.reply({
        content: `🔨 **${target.user.tag}** has been banned.\nReason: ${reason}`,
      });
    } catch {
      await interaction.reply({ content: "Failed to ban the user.", ephemeral: true });
    }
  },
};

export default command;
