import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { canModerate, parseDuration } from "../utils/permissions.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout a member (mute)")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to mute").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration (e.g., 10m, 1h, 1d, 1w)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the mute").setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const target = interaction.options.getMember("user") as GuildMember | null;
    const durationStr = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!target) {
      await interaction.reply({ content: "Could not find that user.", ephemeral: true });
      return;
    }

    const check = canModerate(interaction, target);
    if (!check.success) {
      await interaction.reply({ content: check.reason!, ephemeral: true });
      return;
    }

    const duration = parseDuration(durationStr);
    if (!duration) {
      await interaction.reply({
        content: "Invalid duration format. Use: 10s, 10m, 1h, 1d, 1w",
        ephemeral: true,
      });
      return;
    }

    // Discord max timeout is 28 days
    const maxDuration = 28 * 24 * 60 * 60 * 1000;
    if (duration > maxDuration) {
      await interaction.reply({
        content: "Duration cannot exceed 28 days.",
        ephemeral: true,
      });
      return;
    }

    try {
      await target.timeout(duration, `${reason} (by ${interaction.user.tag})`);
      await interaction.reply({
        content: `🔇 **${target.user.tag}** has been muted for ${durationStr}.\nReason: ${reason}`,
      });
    } catch {
      await interaction.reply({ content: "Failed to mute the user.", ephemeral: true });
    }
  },
};

export default command;
