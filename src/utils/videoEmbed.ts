import { Message, AttachmentBuilder } from "discord.js";
import { logger } from "./logger.js";
import { Readable } from "stream";
import { Buffer } from "buffer";

// Supported platforms regex patterns
const VIDEO_PATTERNS = [
  // TikTok
  /https?:\/\/(www\.|vm\.|m\.)?tiktok\.com\/@?[\w.-]+\/video\/\d+/i,
  /https?:\/\/(www\.|vm\.|m\.)?tiktok\.com\/[\w]+/i,
  // Instagram
  /https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[\w-]+/i,
  // Twitter/X
  /https?:\/\/(www\.)?(twitter|x)\.com\/\w+\/status\/\d+/i,
  // YouTube Shorts (bonus)
  /https?:\/\/(www\.|m\.)?youtube\.com\/shorts\/[\w-]+/i,
];

const DISCORD_FILE_LIMIT = 25 * 1024 * 1024; // 25MB for regular servers
const COBALT_API_URL = "https://api.cobalt.tools/api/json";

interface CobaltResponse {
  status: "stream" | "redirect" | "picker" | "error";
  url?: string;
  picker?: Array<{ url: string; type: string }>;
  text?: string;
}

/**
 * Check if a message contains a supported video link
 */
export function findVideoUrl(content: string): string | null {
  for (const pattern of VIDEO_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

/**
 * Extract video URL using Cobalt API
 */
async function extractVideoUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(COBALT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: url,
        vCodec: "h264",
        vQuality: "720",
        aFormat: "mp3",
        filenamePattern: "basic",
        isAudioOnly: false,
        isNoTTWatermark: true,
        isTTFullAudio: false,
        disableMetadata: false,
      }),
    });

    if (!response.ok) {
      logger.warn(`Cobalt API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as CobaltResponse;

    if (data.status === "stream" || data.status === "redirect") {
      return data.url ?? null;
    }

    if (data.status === "picker" && data.picker && data.picker.length > 0) {
      // For picker results (multiple videos), get the first video
      const videoItem = data.picker.find((item) => item.type === "video") || data.picker[0];
      return videoItem?.url ?? null;
    }

    if (data.status === "error") {
      logger.warn(`Cobalt API returned error: ${data.text}`);
    }

    return null;
  } catch (error) {
    logger.error("Failed to extract video URL:", error);
    return null;
  }
}

/**
 * Download video and return as buffer
 */
async function downloadVideo(
  url: string
): Promise<{ buffer: Buffer; size: number; contentType: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      logger.warn(`Failed to download video: ${response.status}`);
      return null;
    }

    const contentLength = response.headers.get("content-length");
    const contentType = response.headers.get("content-type") || "video/mp4";

    // Check file size before downloading
    if (contentLength && parseInt(contentLength) > DISCORD_FILE_LIMIT) {
      logger.info(`Video too large: ${parseInt(contentLength)} bytes`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Double check size after download
    if (buffer.length > DISCORD_FILE_LIMIT) {
      logger.info(`Downloaded video too large: ${buffer.length} bytes`);
      return null;
    }

    return { buffer, size: buffer.length, contentType };
  } catch (error) {
    logger.error("Failed to download video:", error);
    return null;
  }
}

/**
 * Get file extension from content type
 */
function getExtension(contentType: string): string {
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("quicktime")) return "mov";
  return "mp4";
}

/**
 * Get platform name from URL for display
 */
function getPlatformName(url: string): string {
  if (url.includes("tiktok.com")) return "TikTok";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter/X";
  if (url.includes("youtube.com")) return "YouTube";
  return "Video";
}

/**
 * Handle video embed for a message
 * Returns true if a video was processed, false otherwise
 */
export async function handleVideoEmbed(message: Message): Promise<boolean> {
  const videoUrl = findVideoUrl(message.content);
  if (!videoUrl) return false;

  const platform = getPlatformName(videoUrl);
  logger.info(`Detected ${platform} video link from ${message.author.tag}: ${videoUrl}`);

  // Add a reaction to show we're processing
  try {
    await message.react("⏳");
  } catch {
    // Ignore if we can't react
  }

  try {
    // Extract the direct video URL
    const directUrl = await extractVideoUrl(videoUrl);
    if (!directUrl) {
      await removeReaction(message, "⏳");
      return false;
    }

    // Download the video
    const videoData = await downloadVideo(directUrl);
    if (!videoData) {
      await removeReaction(message, "⏳");
      // Video too large - let the user know
      try {
        await message.reply({
          content: `⚠️ Video is too large to embed (>25MB). [Open in ${platform}](${videoUrl})`,
          allowedMentions: { repliedUser: false },
        });
      } catch {
        // Ignore if we can't reply
      }
      return true;
    }

    // Create attachment and send
    const extension = getExtension(videoData.contentType);
    const attachment = new AttachmentBuilder(videoData.buffer, {
      name: `${platform.toLowerCase()}_video.${extension}`,
    });

    await message.reply({
      files: [attachment],
      allowedMentions: { repliedUser: false },
    });

    // Remove processing reaction and add success
    await removeReaction(message, "⏳");

    // Suppress the original embed
    try {
      await message.suppressEmbeds(true);
    } catch {
      // Ignore if we can't suppress embeds
    }

    logger.info(
      `Successfully embedded ${platform} video (${(videoData.size / 1024 / 1024).toFixed(2)}MB)`
    );
    return true;
  } catch (error) {
    logger.error("Error handling video embed:", error);
    await removeReaction(message, "⏳");
    return false;
  }
}

async function removeReaction(message: Message, emoji: string): Promise<void> {
  try {
    const reaction = message.reactions.cache.get(emoji);
    if (reaction) {
      await reaction.users.remove(message.client.user?.id);
    }
  } catch {
    // Ignore errors removing reactions
  }
}
