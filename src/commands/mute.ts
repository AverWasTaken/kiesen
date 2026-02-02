import { Message, PermissionFlagsBits } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { canModerate, parseDuration } from "../utils/permissions.js";
import { api } from "../../convex/_generated/api.js";

const command: Command = {
  name: "mute",
  description: "Timeout a member (mute)",
  usage: "mute <@user> <duration> [reason]",
  aliases: ["timeout", "to"],
  permissions: [PermissionFlagsBits.ModerateMembers],

  async execute(message: Message, args: string[]) {
    if (!message.guild) {
      await message.reply("❌ This command can only be used in a server.");
      return;
    }

    // Get target from mention or ID
    const targetId = args[0]?.replace(/[<@!>]/g, "");
    if (!targetId) {
      await message.reply("❌ Please mention a user to mute. Usage: `!mute @user <duration> [reason]`");
      return;
    }

    const target = await message.guild.members.fetch(targetId).catch(() => null);
    if (!target) {
      await message.reply("❌ Could not find that user.");
      return;
    }

    // Get duration
    const durationStr = args[1];
    if (!durationStr) {
      await message.reply("❌ Please specify a duration. Usage: `!mute @user <duration> [reason]`\nExample: `!mute @user 10m Spamming`");
      return;
    }

    const duration = parseDuration(durationStr);
    if (!duration) {
      await message.reply("❌ Invalid duration format. Use: 10s, 10m, 1h, 1d, 1w");
      return;
    }

    // Discord max timeout is 28 days
    const maxDuration = 28 * 24 * 60 * 60 * 1000;
    if (duration > maxDuration) {
      await message.reply("❌ Duration cannot exceed 28 days.");
      return;
    }

    // Get reason (everything after duration)
    const reason = args.slice(2).join(" ") || "No reason provided";

    const check = canModerate(message, target);
    if (!check.success) {
      await message.reply(`❌ ${check.reason}`);
      return;
    }

    try {
      await target.timeout(duration, `${reason} (by ${message.author.tag})`);

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
            action: "mute",
            reason: reason,
            duration: duration,
          });
          caseNumber = result.caseNumber;
        } catch (err) {
          console.error("Failed to log mute to Convex:", err);
        }
      }

      const caseText = caseNumber ? ` | Case #${caseNumber}` : "";
      await message.reply(`🔇 **${target.user.tag}** has been muted for ${durationStr}.${caseText}\nReason: ${reason}`);
    } catch {
      await message.reply("❌ Failed to mute the user.");
    }
  },
};

export default command;
