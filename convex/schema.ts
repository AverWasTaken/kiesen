import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Store warnings for users
  warnings: defineTable({
    guildId: v.string(),
    userId: v.string(),
    moderatorId: v.string(),
    reason: v.string(),
    createdAt: v.number(),
  })
    .index("by_guild_user", ["guildId", "userId"])
    .index("by_guild", ["guildId"]),

  // Store moderation logs
  modlogs: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_guild", ["guildId"])
    .index("by_target", ["guildId", "targetId"]),

  // Store guild configurations
  guildConfig: defineTable({
    guildId: v.string(),
    modLogChannelId: v.optional(v.string()),
    muteRoleId: v.optional(v.string()),
    autoModEnabled: v.boolean(),
  }).index("by_guild", ["guildId"]),
});
