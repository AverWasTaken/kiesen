declare const _default: import("convex/server").SchemaDefinition<{
    warnings: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt: number;
        guildId: string;
        userId: string;
        moderatorId: string;
        reason: string;
    }, {
        guildId: import("convex/values").VString<string, "required">;
        userId: import("convex/values").VString<string, "required">;
        moderatorId: import("convex/values").VString<string, "required">;
        reason: import("convex/values").VString<string, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "guildId" | "userId" | "moderatorId" | "reason">, {
        by_guild_user: ["guildId", "userId", "_creationTime"];
        by_guild: ["guildId", "_creationTime"];
    }, {}, {}>;
    modlogs: import("convex/server").TableDefinition<import("convex/values").VObject<{
        messageCount?: number | undefined;
        reason?: string | undefined;
        duration?: number | undefined;
        createdAt: number;
        guildId: string;
        moderatorId: string;
        caseNumber: number;
        targetId: string;
        targetUsername: string;
        moderatorUsername: string;
        action: "warn" | "clear" | "ban" | "kick" | "unban" | "mute" | "unmute";
    }, {
        guildId: import("convex/values").VString<string, "required">;
        caseNumber: import("convex/values").VFloat64<number, "required">;
        targetId: import("convex/values").VString<string, "required">;
        targetUsername: import("convex/values").VString<string, "required">;
        moderatorId: import("convex/values").VString<string, "required">;
        moderatorUsername: import("convex/values").VString<string, "required">;
        action: import("convex/values").VUnion<"warn" | "clear" | "ban" | "kick" | "unban" | "mute" | "unmute", [import("convex/values").VLiteral<"kick", "required">, import("convex/values").VLiteral<"ban", "required">, import("convex/values").VLiteral<"unban", "required">, import("convex/values").VLiteral<"mute", "required">, import("convex/values").VLiteral<"unmute", "required">, import("convex/values").VLiteral<"warn", "required">, import("convex/values").VLiteral<"clear", "required">], "required", never>;
        reason: import("convex/values").VString<string | undefined, "optional">;
        duration: import("convex/values").VFloat64<number | undefined, "optional">;
        messageCount: import("convex/values").VFloat64<number | undefined, "optional">;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "messageCount" | "guildId" | "moderatorId" | "reason" | "caseNumber" | "targetId" | "targetUsername" | "moderatorUsername" | "action" | "duration">, {
        by_guild: ["guildId", "_creationTime"];
        by_guild_case: ["guildId", "caseNumber", "_creationTime"];
        by_target: ["guildId", "targetId", "_creationTime"];
    }, {}, {}>;
    guildConfig: import("convex/server").TableDefinition<import("convex/values").VObject<{
        modLogChannelId?: string | undefined;
        muteRoleId?: string | undefined;
        guildId: string;
        autoModEnabled: boolean;
    }, {
        guildId: import("convex/values").VString<string, "required">;
        modLogChannelId: import("convex/values").VString<string | undefined, "optional">;
        muteRoleId: import("convex/values").VString<string | undefined, "optional">;
        autoModEnabled: import("convex/values").VBoolean<boolean, "required">;
    }, "required", "guildId" | "modLogChannelId" | "muteRoleId" | "autoModEnabled">, {
        by_guild: ["guildId", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map