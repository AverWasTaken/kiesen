import { Message, PermissionFlagsBits } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { canModerate } from "../utils/permissions.js";
import { api } from "../../convex/_generated/api.js";

const command: Command = {
  name: "kick",
  description: "Kick a member from the server",
  usage: "kick <@user> [reason]",
  aliases: ["k"],
  permissions: [PermissionFlagsBits.KickMembers],

  async execute(message: Message, args: string[]) {
    if (!message.guild) {
      await message.reply("❌ This command can only be used in a server.");
      return;
    }

    // Get target from mention or ID
    const targetId = args[0]?.replace(/[<@!>]/g, "");
    if (!targetId) {
      await message.reply("❌ Please mention a user to kick. Usage: `!kick @user [reason]`");
      return;
    }

    const target = await message.guild.members.fetch(targetId).catch(() => null);
    if (!target) {
      await message.reply("❌ Could not find that user.");
      return;
    }

    // Get reason (everything after the mention)
    const reason = args.slice(1).join(" ") || "No reason provided";

    const check = canModerate(message, target);
    if (!check.success) {
      await message.reply(`❌ ${check.reason}`);
      return;
    }

    if (!target.kickable) {
      await message.reply("❌ I cannot kick this user.");
      return;
    }

    try {
      await target.kick(`${reason} (by ${message.author.tag})`);

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
            action: "kick",
            reason: reason,
          });
          caseNumber = result.caseNumber;
        } catch (err) {
          console.error("Failed to log kick to Convex:", err);
        }
      }

      const caseText = caseNumber ? ` | Case #${caseNumber}` : "";
      await message.reply(`✅ **${target.user.tag}** has been kicked.${caseText}\nReason: ${reason}`);
    } catch {
      await message.reply("❌ Failed to kick the user.");
    }
  },
};

export default command;
