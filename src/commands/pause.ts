import { Message } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { getQueue } from "../utils/musicPlayer.js";
import { AudioPlayerStatus } from "@discordjs/voice";

const command: Command = {
  name: "pause",
  description: "Pause the current song",
  usage: "pause",
  aliases: [],

  async execute(message: Message) {
    const queue = getQueue(message.guild!.id);
    
    if (!queue || !queue.currentSong) {
      await message.reply("❌ Nothing is playing right now");
      return;
    }

    if (queue.player.state.status === AudioPlayerStatus.Paused) {
      await message.reply("⏸️ Already paused");
      return;
    }

    queue.player.pause();
    await message.reply("⏸️ Paused");
  },
};

export default command;
