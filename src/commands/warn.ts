import { Message, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { canModerate } from "../utils/permissions.js";
import { api } from "../../convex/_generated/api.js";

const command: Command = {
  name: "warn",
  description: "Warn a member",
  usage: "warn <@user> <reason>",
  aliases: ["w"],
  permissions: [PermissionFlagsBits.ModerateMembers],

  async execute(message: Message, args: string[]) {
    if (!message.guild) {
      await message.reply("❌ This command can only be used in a server.");
      return;
    }

    // Get target from mention or ID
    const targetId = args[0]?.replace(/[<@!>]/g, "");
    if (!targetId) {
      await message.reply("❌ Please mention a user to warn. Usage: `!warn @user <reason>`");
      return;
    }

    const target = await message.guild.members.fetch(targetId).catch(() => null);
    if (!target) {
      await message.reply("❌ Could not find that user.");
      return;
    }

    // Get reason (required for warnings)
    const reason = args.slice(1).join(" ");
    if (!reason) {
      await message.reply("❌ Please provide a reason for the warning. Usage: `!warn @user <reason>`");
      return;
    }

    const check = canModerate(message, target);
    if (!check.success) {
      await message.reply(`❌ ${check.reason}`);
      return;
    }

    // Log to Convex
    let caseNumber: number | null = null;
    if (message.client.convex) {
      try {
        const result = await message.client.convex.mutation(api.modlogs.log, {
          guildId: message.guild.id,
          targetId: target.id,
          targetUsername: target.user.tag,
          moderatorId: message.author.id,
          moderatorUsername: message.author.tag,
          action: "warn",
          reason: reason,
        });
        caseNumber = result.caseNumber;
      } catch (err) {
        console.error("Failed to log warn to Convex:", err);
      }
    }

    const caseText = caseNumber ? `Case #${caseNumber}` : "";

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("⚠️ Warning Issued")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Reason", value: reason }
      )
      .setFooter(caseText ? { text: caseText } : null)
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    // Try to DM the user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(`⚠️ You have been warned in ${message.guild.name}`)
        .addFields({ name: "Reason", value: reason })
        .setFooter(caseText ? { text: caseText } : null)
        .setTimestamp();

      await target.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs disabled, ignore
    }
  },
};

export default command;
