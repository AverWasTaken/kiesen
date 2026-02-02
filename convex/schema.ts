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

  // Store moderation logs with case numbers
  modlogs: defineTable({
    guildId: v.string(),
    caseNumber: v.number(), // Auto-incrementing per guild
    targetId: v.string(),
    targetUsername: v.string(),
    moderatorId: v.string(),
    moderatorUsername: v.string(),
    action: v.union(
      v.literal("kick"),
      v.literal("ban"),
      v.literal("unban"),
      v.literal("mute"),
      v.literal("unmute"),
      v.literal("warn"),
      v.literal("clear")
    ),
    reason: v.optional(v.string()),
    duration: v.optional(v.number()), // For mutes (in ms)
    messageCount: v.optional(v.number()), // For clear actions
    createdAt: v.number(),
  })
    .index("by_guild", ["guildId"])
    .index("by_guild_case", ["guildId", "caseNumber"])
    .index("by_target", ["guildId", "targetId"]),

  // Store guild configurations
  guildConfig: defineTable({
    guildId: v.string(),
    modLogChannelId: v.optional(v.string()),
    muteRoleId: v.optional(v.string()),
    autoModEnabled: v.boolean(),
  }).index("by_guild", ["guildId"]),
});
