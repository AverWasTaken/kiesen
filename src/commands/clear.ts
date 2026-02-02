import { Message, PermissionFlagsBits, TextChannel } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { api } from "../../convex/_generated/api.js";

const command: Command = {
  name: "clear",
  description: "Delete multiple messages from a channel",
  usage: "clear <amount> [@user]",
  aliases: ["purge", "prune"],
  permissions: [PermissionFlagsBits.ManageMessages],

  async execute(message: Message, args: string[]) {
    if (!message.guild) {
      await message.reply("❌ This command can only be used in a server.");
      return;
    }

    const channel = message.channel as TextChannel;
    if (!channel.isTextBased() || channel.isDMBased()) {
      await message.reply("❌ This command cannot be used in this channel.");
      return;
    }

    // Get amount
    const amount = parseInt(args[0]!);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      await message.reply("❌ Please provide a valid number between 1 and 100. Usage: `!clear <amount> [@user]`");
      return;
    }

    // Get optional target user
    const targetId = args[1]?.replace(/[<@!>]/g, "");
    const targetUser = targetId ? await message.client.users.fetch(targetId).catch(() => null) : null;

    try {
      // Fetch messages (+1 to include the command message itself)
      let messages = await channel.messages.fetch({ limit: amount + 1 });

      // Filter by user if specified
      if (targetUser) {
        messages = messages.filter((msg) => msg.author.id === targetUser.id);
      }

      // Filter out messages older than 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter((msg) => msg.createdTimestamp > twoWeeksAgo);

      if (messages.size === 0) {
        await message.reply("❌ No messages found to delete.");
        return;
      }

      const deleted = await channel.bulkDelete(messages, true);
      const deletedCount = deleted.size - 1; // Exclude the command message

      // Log to Convex
      let caseNumber: number | null = null;
      if (message.client.convex) {
        try {
          const result = await message.client.convex.mutation(api.modlogs.log, {
            guildId: message.guild.id,
            targetId: targetUser?.id || "channel",
            targetUsername: targetUser?.tag || `#${channel.name}`,
            moderatorId: message.author.id,
            moderatorUsername: message.author.tag,
            action: "clear",
            reason: targetUser ? `Cleared ${deletedCount} messages from user` : `Cleared ${deletedCount} messages`,
            messageCount: deletedCount,
          });
          caseNumber = result.caseNumber;
        } catch (err) {
          console.error("Failed to log clear to Convex:", err);
        }
      }

      const caseText = caseNumber ? ` | Case #${caseNumber}` : "";
      const response = targetUser
        ? `🗑️ Deleted **${deletedCount}** message(s) from ${targetUser.tag}.${caseText}`
        : `🗑️ Deleted **${deletedCount}** message(s).${caseText}`;

      const reply = await (message.channel as TextChannel).send(response);
      
      // Delete the confirmation after 3 seconds
      setTimeout(() => reply.delete().catch(() => {}), 3000);
    } catch {
      await message.reply("❌ Failed to delete messages. Messages older than 14 days cannot be bulk deleted.");
    }
  },
};

export default command;
