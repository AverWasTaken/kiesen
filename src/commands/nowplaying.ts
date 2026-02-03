import { Message, EmbedBuilder } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { getQueue } from "../utils/musicPlayer.js";

const command: Command = {
  name: "nowplaying",
  description: "Show the currently playing song",
  usage: "nowplaying",
  aliases: ["np", "current"],

  async execute(message: Message) {
    const queue = getQueue(message.guild!.id);
    
    if (!queue || !queue.currentSong) {
      await message.reply("❌ Nothing is playing right now");
      return;
    }

    const song = queue.currentSong;
    const embed = new EmbedBuilder()
      .setTitle("🎵 Now Playing")
      .setDescription(`**${song.title}**\nDuration: ${song.duration}\nRequested by: ${song.requestedBy}`)
      .setColor(0x7289da)
      .setURL(song.url);

    await message.reply({ embeds: [embed] });
  },
};

export default command;
