import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Guild, TextChannel, VoiceChannel } from "discord.js";
import play from "play-dl";
import { logger } from "./logger.js";

export interface QueueItem {
  title: string;
  url: string;
  duration: string;
  requestedBy: string;
}

export interface GuildQueue {
  textChannel: TextChannel;
  voiceChannel: VoiceChannel;
  player: AudioPlayer;
  songs: QueueItem[];
  volume: number;
  playing: boolean;
  currentSong: QueueItem | null;
}

const queues = new Map<string, GuildQueue>();

export function getQueue(guildId: string): GuildQueue | undefined {
  return queues.get(guildId);
}

export function createQueue(
  guild: Guild,
  textChannel: TextChannel,
  voiceChannel: VoiceChannel
): GuildQueue {
  const player = createAudioPlayer();
  
  const queue: GuildQueue = {
    textChannel,
    voiceChannel,
    player,
    songs: [],
    volume: 100,
    playing: false,
    currentSong: null,
  };

  // Handle song end
  player.on(AudioPlayerStatus.Idle, () => {
    queue.currentSong = null;
    if (queue.songs.length > 0) {
      playNext(guild.id);
    } else {
      queue.playing = false;
      // Leave after 5 minutes of inactivity
      setTimeout(() => {
        const q = getQueue(guild.id);
        if (q && !q.playing && q.songs.length === 0) {
          destroyQueue(guild.id);
        }
      }, 5 * 60 * 1000);
    }
  });

  player.on("error", (error) => {
    logger.error("Audio player error:", error);
    queue.currentSong = null;
    if (queue.songs.length > 0) {
      playNext(guild.id);
    }
  });

  queues.set(guild.id, queue);
  return queue;
}

export function destroyQueue(guildId: string): void {
  const queue = queues.get(guildId);
  if (queue) {
    queue.player.stop();
    const connection = getVoiceConnection(guildId);
    if (connection) {
      connection.destroy();
    }
    queues.delete(guildId);
  }
}

export async function playSong(guildId: string, song: QueueItem): Promise<void> {
  const queue = getQueue(guildId);
  if (!queue) return;

  try {
    const stream = await play.stream(song.url);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });

    queue.player.play(resource);
    queue.currentSong = song;
    queue.playing = true;

    const connection = getVoiceConnection(guildId);
    if (connection) {
      connection.subscribe(queue.player);
    }

    await queue.textChannel.send(`🎵 Now playing: **${song.title}** [${song.duration}]\nRequested by: ${song.requestedBy}`);
  } catch (error) {
    logger.error("Error playing song:", error);
    await queue.textChannel.send(`❌ Error playing: **${song.title}**`);
    playNext(guildId);
  }
}

export function playNext(guildId: string): void {
  const queue = getQueue(guildId);
  if (!queue || queue.songs.length === 0) {
    if (queue) {
      queue.playing = false;
      queue.currentSong = null;
    }
    return;
  }

  const nextSong = queue.songs.shift()!;
  playSong(guildId, nextSong);
}

export async function addToQueue(
  guild: Guild,
  textChannel: TextChannel,
  voiceChannel: VoiceChannel,
  query: string,
  requestedBy: string
): Promise<{ success: boolean; message: string; song?: QueueItem }> {
  try {
    let queue = getQueue(guild.id);
    
    // Create queue if doesn't exist
    if (!queue) {
      queue = createQueue(guild, textChannel, voiceChannel);
      
      // Join voice channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      } catch {
        destroyQueue(guild.id);
        return { success: false, message: "Failed to join voice channel" };
      }
    }

    // Search or get video info
    let title: string;
    let url: string;
    let duration: string;

    if (play.yt_validate(query) === "video") {
      // Direct YouTube URL
      const info = await play.video_info(query);
      const videoDetails = info.video_details;
      title = videoDetails.title || "Unknown";
      url = videoDetails.url;
      duration = videoDetails.durationRaw || "0:00";
    } else {
      // Search query
      const searched = await play.search(query, { limit: 1 });
      if (searched.length === 0) {
        return { success: false, message: "No results found" };
      }
      const videoInfo = searched[0]!;
      title = videoInfo.title || "Unknown";
      url = videoInfo.url;
      duration = videoInfo.durationRaw || "0:00";
    }

    const song: QueueItem = {
      title,
      url,
      duration,
      requestedBy,
    };

    queue.songs.push(song);

    // If not playing, start playing
    if (!queue.playing) {
      playNext(guild.id);
      return { success: true, message: `🎵 Now playing: **${song.title}**`, song };
    }

    return { success: true, message: `✅ Added to queue: **${song.title}** [${song.duration}]`, song };
  } catch (error) {
    logger.error("Error adding to queue:", error);
    return { success: false, message: "Failed to process your request" };
  }
}

export function formatQueue(queue: GuildQueue): string {
  if (!queue.currentSong && queue.songs.length === 0) {
    return "Queue is empty";
  }

  let text = "";
  
  if (queue.currentSong) {
    text += `**Now Playing:** ${queue.currentSong.title} [${queue.currentSong.duration}]\n\n`;
  }

  if (queue.songs.length > 0) {
    text += "**Up Next:**\n";
    queue.songs.slice(0, 10).forEach((song, i) => {
      text += `${i + 1}. ${song.title} [${song.duration}]\n`;
    });
    
    if (queue.songs.length > 10) {
      text += `\n...and ${queue.songs.length - 10} more`;
    }
  }

  return text;
}
