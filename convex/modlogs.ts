import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

type ModAction = "kick" | "ban" | "unban" | "mute" | "unmute" | "warn";

// Log a moderation action
export const log = mutation({
  args: {
    guildId: v.string(),
    targetId: v.string(),
    moderatorId: v.string(),
    action: v.union(
      v.literal("kick"),
      v.literal("ban"),
      v.literal("unban"),
      v.literal("mute"),
      v.literal("unmute"),
      v.literal("warn")
    ),
    reason: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("modlogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Get moderation logs for a guild
export const getByGuild = query({
  args: {
    guildId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("modlogs")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .order("desc")
      .take(limit);
  },
});

// Get moderation logs for a specific user in a guild
export const getByUser = query({
  args: {
    guildId: v.string(),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("modlogs")
      .withIndex("by_target", (q) =>
        q.eq("guildId", args.guildId).eq("targetId", args.targetId)
      )
      .order("desc")
      .collect();
  },
});
