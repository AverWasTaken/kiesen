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
    .setName("kick")
    .setDescription("Kick a member from the server")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to kick").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the kick").setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const target = interaction.options.getMember("user") as GuildMember | null;
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

    if (!target.kickable) {
      await interaction.reply({ content: "I cannot kick this user.", ephemeral: true });
      return;
    }

    try {
      await target.kick(`${reason} (by ${interaction.user.tag})`);
      await interaction.reply({
        content: `✅ **${target.user.tag}** has been kicked.\nReason: ${reason}`,
      });
    } catch {
      await interaction.reply({ content: "Failed to kick the user.", ephemeral: true });
    }
  },
};

export default command;
