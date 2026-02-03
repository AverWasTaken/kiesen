import { Message } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { getQueue } from "../utils/musicPlayer.js";

const command: Command = {
  name: "skip",
  description: "Skip the current song",
  usage: "skip",
  aliases: ["s", "next"],

  async execute(message: Message) {
    const queue = getQueue(message.guild!.id);
    
    if (!queue || !queue.currentSong) {
      await message.reply("❌ Nothing is playing right now");
      return;
    }

    const skipped = queue.currentSong.title;
    queue.player.stop();
    
    await message.reply(`⏭️ Skipped: **${skipped}**`);
  },
};

export default command;
