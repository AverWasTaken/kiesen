import { Message, PermissionFlagsBits, GuildMember } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { canModerate } from "../utils/permissions.js";
import { api } from "../../convex/_generated/api.js";

const command: Command = {
  name: "ban",
  description: "Ban a member from the server",
  usage: "ban <@user> [reason] [--delete <days>]",
  aliases: ["b"],
  permissions: [PermissionFlagsBits.BanMembers],

  async execute(message: Message, args: string[]) {
    if (!message.guild) {
      await message.reply("❌ This command can only be used in a server.");
      return;
    }

    // Get target from mention or ID
    const targetId = args[0]?.replace(/[<@!>]/g, "");
    if (!targetId) {
      await message.reply("❌ Please mention a user to ban. Usage: `!ban @user [reason]`");
      return;
    }

    const target = await message.guild.members.fetch(targetId).catch(() => null);
    if (!target) {
      await message.reply("❌ Could not find that user.");
      return;
    }

    // Parse delete days from --delete flag
    let deleteDays = 0;
    const deleteIndex = args.indexOf("--delete");
    if (deleteIndex !== -1 && args[deleteIndex + 1]) {
      deleteDays = Math.min(7, Math.max(0, parseInt(args[deleteIndex + 1]!) || 0));
      args.splice(deleteIndex, 2);
    }

    // Get reason (everything after the mention)
    const reason = args.slice(1).join(" ") || "No reason provided";

    const check = canModerate(message, target);
    if (!check.success) {
      await message.reply(`❌ ${check.reason}`);
      return;
    }

    if (!target.bannable) {
      await message.reply("❌ I cannot ban this user.");
      return;
    }

    try {
      await target.ban({
        reason: `${reason} (by ${message.author.tag})`,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

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
            action: "ban",
            reason: reason,
          });
          caseNumber = result.caseNumber;
        } catch (err) {
          console.error("Failed to log ban to Convex:", err);
        }
      }

      const caseText = caseNumber ? ` | Case #${caseNumber}` : "";
      await message.reply(`🔨 **${target.user.tag}** has been banned.${caseText}\nReason: ${reason}`);
    } catch {
      await message.reply("❌ Failed to ban the user.");
    }
  },
};

export default command;
