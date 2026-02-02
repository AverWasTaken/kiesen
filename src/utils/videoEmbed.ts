import { Message, AttachmentBuilder } from "discord.js";
import { logger } from "./logger.js";
import { Buffer } from "buffer";

// Supported platforms regex patterns
const VIDEO_PATTERNS = {
  tiktok: [
    /https?:\/\/(www\.|vm\.|m\.)?tiktok\.com\/@?[\w.-]+\/video\/\d+/i,
    /https?:\/\/(www\.|vm\.|m\.)?tiktok\.com\/[\w]+/i,
  ],
  instagram: [/https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[\w-]+/i],
  twitter: [/https?:\/\/(www\.)?(twitter|x)\.com\/\w+\/status\/\d+/i],
  youtube: [/https?:\/\/(www\.|m\.)?youtube\.com\/shorts\/[\w-]+/i],
};

const DISCORD_FILE_LIMIT = 25 * 1024 * 1024; // 25MB for regular servers

interface TikWMResponse {
  code: number;
  msg: string;
  data?: {
    play: string;
    hdplay?: string;
    title?: string;
  };
}

/**
 * Check if a message contains a supported video link and return platform + url
 */
export function findVideoUrl(content: string): { platform: string; url: string } | null {
  for (const [platform, patterns] of Object.entries(VIDEO_PATTERNS)) {
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return { platform, url: match[0] };
      }
    }
  }
  return null;
}

/**
 * Extract video URL for TikTok using TikWM API
 */
async function extractTikTokVideo(url: string): Promise<string | null> {
  try {
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      logger.warn(`TikWM API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as TikWMResponse;

    if (data.code === 0 && data.data) {
      // Prefer HD play if available
      return data.data.hdplay || data.data.play || null;
    }

    logger.warn(`TikWM API returned error: ${data.msg}`);
    return null;
  } catch (error) {
    logger.error("Failed to extract TikTok video:", error);
    return null;
  }
}

interface FxTwitterResponse {
  tweet?: {
    media?: {
      videos?: Array<{ url: string }>;
    };
    video?: {
      url: string;
    };
  };
}

/**
 * Extract video URL for Twitter/X using fxtwitter
 */
async function extractTwitterVideo(url: string): Promise<string | null> {
  try {
    // Convert twitter.com or x.com to api.fxtwitter.com
    const fxUrl = url
      .replace("twitter.com", "api.fxtwitter.com")
      .replace("x.com", "api.fxtwitter.com");

    const response = await fetch(fxUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      logger.warn(`FxTwitter API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as FxTwitterResponse;

    if (data.tweet?.media?.videos?.[0]?.url) {
      return data.tweet.media.videos[0].url;
    }

    // Try alternate structure
    if (data.tweet?.video?.url) {
      return data.tweet.video.url;
    }

    logger.warn("No video found in Twitter response");
    return null;
  } catch (error) {
    logger.error("Failed to extract Twitter video:", error);
    return null;
  }
}

/**
 * Extract video URL based on platform
 */
async function extractVideoUrl(platform: string, url: string): Promise<string | null> {
  switch (platform) {
    case "tiktok":
      return extractTikTokVideo(url);
    case "twitter":
      return extractTwitterVideo(url);
    case "instagram":
      // Instagram is tricky without auth - for now just log that it's not supported
      logger.info("Instagram video extraction not yet implemented");
      return null;
    case "youtube":
      // YouTube shorts would need yt-dlp or similar
      logger.info("YouTube Shorts extraction not yet implemented");
      return null;
    default:
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
        Referer: "https://www.tiktok.com/",
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
 * Get display name for platform
 */
function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    tiktok: "TikTok",
    instagram: "Instagram",
    twitter: "Twitter/X",
    youtube: "YouTube",
  };
  return names[platform] || "Video";
}

/**
 * Handle video embed for a message
 * Returns true if a video was processed, false otherwise
 */
export async function handleVideoEmbed(message: Message): Promise<boolean> {
  const result = findVideoUrl(message.content);
  if (!result) return false;

  const { platform, url } = result;
  const displayName = getPlatformDisplayName(platform);

  logger.info(`Detected ${displayName} video link from ${message.author.tag}: ${url}`);

  // Add a reaction to show we're processing
  try {
    await message.react("⏳");
  } catch {
    // Ignore if we can't react
  }

  try {
    // Extract the direct video URL
    const directUrl = await extractVideoUrl(platform, url);
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
          content: `⚠️ Video is too large to embed (>25MB). [Open in ${displayName}](${url})`,
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
      name: `${platform}_video.${extension}`,
    });

    await message.reply({
      files: [attachment],
      allowedMentions: { repliedUser: false },
    });

    // Remove processing reaction
    await removeReaction(message, "⏳");

    // Suppress the original embed
    try {
      await message.suppressEmbeds(true);
    } catch {
      // Ignore if we can't suppress embeds
    }

    logger.info(
      `Successfully embedded ${displayName} video (${(videoData.size / 1024 / 1024).toFixed(2)}MB)`
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
