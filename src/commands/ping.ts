import { Message } from "discord.js";
import type { Command } from "../utils/commandLoader.js";

const command: Command = {
  name: "ping",
  description: "Check the bot's latency",
  usage: "ping",
  aliases: ["pong", "latency"],

  async execute(message: Message) {
    const sent = await message.reply("🏓 Pinging...");
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(message.client.ws.ping);

    await sent.edit(`🏓 Pong!\n**Latency:** ${latency}ms\n**API Latency:** ${apiLatency}ms`);
  },
};

export default command;
