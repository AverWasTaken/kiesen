import { Message, EmbedBuilder } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { getQueue, formatQueue } from "../utils/musicPlayer.js";

const command: Command = {
  name: "queue",
  description: "Show the current music queue",
  usage: "queue",
  aliases: ["q"],

  async execute(message: Message) {
    const queue = getQueue(message.guild!.id);
    
    if (!queue || (!queue.currentSong && queue.songs.length === 0)) {
      await message.reply("📭 Queue is empty");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🎵 Music Queue")
      .setDescription(formatQueue(queue))
      .setColor(0x7289da)
      .setFooter({ text: `${queue.songs.length} song(s) in queue` });

    await message.reply({ embeds: [embed] });
  },
};

export default command;
