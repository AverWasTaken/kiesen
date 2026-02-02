import { Message, PermissionFlagsBits } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { api } from "../../convex/_generated/api.js";

const command: Command = {
  name: "unmute",
  description: "Remove timeout from a member (unmute)",
  usage: "unmute <@user>",
  aliases: ["untimeout"],
  permissions: [PermissionFlagsBits.ModerateMembers],

  async execute(message: Message, args: string[]) {
    if (!message.guild) {
      await message.reply("❌ This command can only be used in a server.");
      return;
    }

    // Get target from mention or ID
    const targetId = args[0]?.replace(/[<@!>]/g, "");
    if (!targetId) {
      await message.reply("❌ Please mention a user to unmute. Usage: `!unmute @user`");
      return;
    }

    const target = await message.guild.members.fetch(targetId).catch(() => null);
    if (!target) {
      await message.reply("❌ Could not find that user.");
      return;
    }

    if (!target.isCommunicationDisabled()) {
      await message.reply("❌ This user is not muted.");
      return;
    }

    try {
      await target.timeout(null);

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
            action: "unmute",
          });
          caseNumber = result.caseNumber;
        } catch (err) {
          console.error("Failed to log unmute to Convex:", err);
        }
      }

      const caseText = caseNumber ? ` | Case #${caseNumber}` : "";
      await message.reply(`🔊 **${target.user.tag}** has been unmuted.${caseText}`);
    } catch {
      await message.reply("❌ Failed to unmute the user.");
    }
  },
};

export default command;
