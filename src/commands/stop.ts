import { Message } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { getQueue, destroyQueue } from "../utils/musicPlayer.js";

const command: Command = {
  name: "stop",
  description: "Stop music and leave the voice channel",
  usage: "stop",
  aliases: ["leave", "disconnect", "dc"],

  async execute(message: Message) {
    const queue = getQueue(message.guild!.id);
    
    if (!queue) {
      await message.reply("❌ I'm not playing anything");
      return;
    }

    destroyQueue(message.guild!.id);
    await message.reply("⏹️ Stopped and left the channel");
  },
};

export default command;
