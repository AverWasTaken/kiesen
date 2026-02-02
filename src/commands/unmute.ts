import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";
import type { Command } from "../utils/commandLoader.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout from a member (unmute)")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to unmute").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const target = interaction.options.getMember("user") as GuildMember | null;

    if (!target) {
      await interaction.reply({ content: "Could not find that user.", ephemeral: true });
      return;
    }

    if (!target.isCommunicationDisabled()) {
      await interaction.reply({ content: "This user is not muted.", ephemeral: true });
      return;
    }

    try {
      await target.timeout(null);
      await interaction.reply({
        content: `🔊 **${target.user.tag}** has been unmuted.`,
      });
    } catch {
      await interaction.reply({ content: "Failed to unmute the user.", ephemeral: true });
    }
  },
};

export default command;
