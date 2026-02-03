import { Message } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { getQueue } from "../utils/musicPlayer.js";
import { AudioPlayerStatus } from "@discordjs/voice";

const command: Command = {
  name: "resume",
  description: "Resume the paused song",
  usage: "resume",
  aliases: ["unpause"],

  async execute(message: Message) {
    const queue = getQueue(message.guild!.id);
    
    if (!queue || !queue.currentSong) {
      await message.reply("❌ Nothing is playing right now");
      return;
    }

    if (queue.player.state.status !== AudioPlayerStatus.Paused) {
      await message.reply("▶️ Not paused");
      return;
    }

    queue.player.unpause();
    await message.reply("▶️ Resumed");
  },
};

export default command;
