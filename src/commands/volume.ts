import { Message } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { getQueue } from "../utils/musicPlayer.js";

const command: Command = {
  name: "volume",
  description: "Set the music volume (0-100)",
  usage: "volume <0-100>",
  aliases: ["vol"],

  async execute(message: Message, args: string[]) {
    const queue = getQueue(message.guild!.id);
    
    if (!queue) {
      await message.reply("❌ I'm not playing anything");
      return;
    }

    if (args.length === 0) {
      await message.reply(`🔊 Current volume: **${queue.volume}%**`);
      return;
    }

    const volume = parseInt(args[0] || "");
    if (isNaN(volume) || volume < 0 || volume > 100) {
      await message.reply("❌ Volume must be between 0 and 100");
      return;
    }

    queue.volume = volume;
    await message.reply(`🔊 Volume set to **${volume}%**`);
  },
};

export default command;
