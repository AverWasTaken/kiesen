export declare const log: import("convex/server").RegisteredMutation<"public", {
    messageCount?: number | undefined;
    reason?: string | undefined;
    duration?: number | undefined;
    guildId: string;
    moderatorId: string;
    targetId: string;
    targetUsername: string;
    moderatorUsername: string;
    action: "warn" | "clear" | "ban" | "kick" | "unban" | "mute" | "unmute";
}, Promise<{
    id: import("convex/values").GenericId<"modlogs">;
    caseNumber: number;
}>>;
export declare const getByGuild: import("convex/server").RegisteredQuery<"public", {
    limit?: number | undefined;
    guildId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"modlogs">;
    _creationTime: number;
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
}[]>>;
export declare const getCase: import("convex/server").RegisteredQuery<"public", {
    guildId: string;
    caseNumber: number;
}, Promise<{
    _id: import("convex/values").GenericId<"modlogs">;
    _creationTime: number;
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
} | null>>;
export declare const getByUser: import("convex/server").RegisteredQuery<"public", {
    guildId: string;
    targetId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"modlogs">;
    _creationTime: number;
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
}[]>>;
//# sourceMappingURL=modlogs.d.ts.map