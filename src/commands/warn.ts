import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
  EmbedBuilder,
} from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { canModerate } from "../utils/permissions.js";
// import { api } from "../../convex/_generated/api.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to warn").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the warning").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const target = interaction.options.getMember("user") as GuildMember | null;
    const reason = interaction.options.getString("reason", true);

    if (!target) {
      await interaction.reply({ content: "Could not find that user.", ephemeral: true });
      return;
    }

    const check = canModerate(interaction, target);
    if (!check.success) {
      await interaction.reply({ content: check.reason!, ephemeral: true });
      return;
    }

    // TODO: Store warning in Convex database
    // Uncomment when Convex is set up:
    // if (interaction.client.convex) {
    //   await interaction.client.convex.mutation(api.warnings.create, {
    //     guildId: interaction.guild.id,
    //     userId: target.id,
    //     moderatorId: interaction.user.id,
    //     reason,
    //   });
    // }

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("⚠️ Warning Issued")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: interaction.user.tag, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Try to DM the user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(`⚠️ You have been warned in ${interaction.guild.name}`)
        .addFields({ name: "Reason", value: reason })
        .setTimestamp();

      await target.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs disabled, ignore
    }
  },
};

export default command;
