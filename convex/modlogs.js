import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
// Log a moderation action with auto-incrementing case number
export const log = mutation({
    args: {
        guildId: v.string(),
        targetId: v.string(),
        targetUsername: v.string(),
        moderatorId: v.string(),
        moderatorUsername: v.string(),
        action: v.union(v.literal("kick"), v.literal("ban"), v.literal("unban"), v.literal("mute"), v.literal("unmute"), v.literal("warn"), v.literal("clear")),
        reason: v.optional(v.string()),
        duration: v.optional(v.number()),
        messageCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Get the highest case number for this guild
        const lastCase = await ctx.db
            .query("modlogs")
            .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
            .order("desc")
            .first();
        const caseNumber = lastCase ? lastCase.caseNumber + 1 : 1;
        const id = await ctx.db.insert("modlogs", {
            ...args,
            caseNumber,
            createdAt: Date.now(),
        });
        return { id, caseNumber };
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
// Get a specific case by number
export const getCase = query({
    args: {
        guildId: v.string(),
        caseNumber: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("modlogs")
            .withIndex("by_guild_case", (q) => q.eq("guildId", args.guildId).eq("caseNumber", args.caseNumber))
            .first();
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
            .withIndex("by_target", (q) => q.eq("guildId", args.guildId).eq("targetId", args.targetId))
            .order("desc")
            .collect();
    },
});
//# sourceMappingURL=modlogs.js.map