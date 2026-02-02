import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
// Create a new warning
export const create = mutation({
    args: {
        guildId: v.string(),
        userId: v.string(),
        moderatorId: v.string(),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("warnings", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
// Get all warnings for a user in a guild
export const getByUser = query({
    args: {
        guildId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("warnings")
            .withIndex("by_guild_user", (q) => q.eq("guildId", args.guildId).eq("userId", args.userId))
            .collect();
    },
});
// Get warning count for a user
export const getCount = query({
    args: {
        guildId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const warnings = await ctx.db
            .query("warnings")
            .withIndex("by_guild_user", (q) => q.eq("guildId", args.guildId).eq("userId", args.userId))
            .collect();
        return warnings.length;
    },
});
// Delete a specific warning
export const remove = mutation({
    args: {
        warningId: v.id("warnings"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.warningId);
    },
});
// Clear all warnings for a user in a guild
export const clearByUser = mutation({
    args: {
        guildId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const warnings = await ctx.db
            .query("warnings")
            .withIndex("by_guild_user", (q) => q.eq("guildId", args.guildId).eq("userId", args.userId))
            .collect();
        for (const warning of warnings) {
            await ctx.db.delete(warning._id);
        }
        return warnings.length;
    },
});
//# sourceMappingURL=warnings.js.map