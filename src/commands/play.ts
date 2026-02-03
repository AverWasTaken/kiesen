import { Message, ChannelType } from "discord.js";
import type { Command } from "../utils/commandLoader.js";
import { addToQueue } from "../utils/musicPlayer.js";

const command: Command = {
  name: "play",
  description: "Play a song from YouTube",
  usage: "play <search query or URL>",
  aliases: ["p"],

  async execute(message: Message, args: string[]) {
    if (args.length === 0) {
      await message.reply("❌ Please provide a search query or YouTube URL");
      return;
    }

    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      await message.reply("❌ You need to be in a voice channel to play music");
      return;
    }

    const textChannel = message.channel;
    if (textChannel.type !== ChannelType.GuildText) {
      await message.reply("❌ This command can only be used in a server text channel");
      return;
    }

    const query = args.join(" ");
    await message.react("🔍");

    const result = await addToQueue(
      message.guild!,
      textChannel,
      voiceChannel,
      query,
      message.author.tag
    );

    await message.reactions.removeAll().catch(() => {});
    await message.reply(result.message);
  },
};

export default command;
