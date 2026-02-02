import { Message, EmbedBuilder } from "discord.js";
import type { Command } from "../utils/commandLoader.js";

const command: Command = {
  name: "help",
  description: "Shows all available commands",
  usage: "help [command]",
  aliases: ["h", "commands"],

  async execute(message: Message, args: string[]) {
    const prefix = message.client.config.prefix;

    // Get unique commands (filter out aliases)
    const commands = [...new Set(message.client.commands.values())];

    // If asking for specific command help
    if (args[0]) {
      const cmd = message.client.commands.get(args[0].toLowerCase());
      if (!cmd) {
        await message.reply(`❌ Command \`${args[0]}\` not found.`);
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`📖 Command: ${prefix}${cmd.name}`)
        .setDescription(cmd.description)
        .addFields(
          { name: "Usage", value: `\`${prefix}${cmd.usage || cmd.name}\``, inline: true }
        );

      if (cmd.aliases && cmd.aliases.length > 0) {
        embed.addFields({ 
          name: "Aliases", 
          value: cmd.aliases.map(a => `\`${prefix}${a}\``).join(", "), 
          inline: true 
        });
      }

      await message.reply({ embeds: [embed] });
      return;
    }

    // Show all commands
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📚 Kiesen Commands")
      .setDescription(`Use \`${prefix}help <command>\` for more info on a specific command.`)
      .setFooter({ text: `Prefix: ${prefix}` });

    // Group commands by category (for now just list them all)
    const modCommands = commands
      .filter(c => ["ban", "kick", "mute", "unmute", "warn", "clear"].includes(c.name))
      .map(c => `\`${c.name}\``)
      .join(", ");

    const utilityCommands = commands
      .filter(c => ["help", "ping"].includes(c.name))
      .map(c => `\`${c.name}\``)
      .join(", ");

    if (modCommands) {
      embed.addFields({ name: "🛡️ Moderation", value: modCommands });
    }
    if (utilityCommands) {
      embed.addFields({ name: "🔧 Utility", value: utilityCommands });
    }

    await message.reply({ embeds: [embed] });
  },
};

export default command;
