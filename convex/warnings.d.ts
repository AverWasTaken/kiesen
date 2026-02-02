export declare const create: import("convex/server").RegisteredMutation<"public", {
    guildId: string;
    userId: string;
    moderatorId: string;
    reason: string;
}, Promise<import("convex/values").GenericId<"warnings">>>;
export declare const getByUser: import("convex/server").RegisteredQuery<"public", {
    guildId: string;
    userId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"warnings">;
    _creationTime: number;
    createdAt: number;
    guildId: string;
    userId: string;
    moderatorId: string;
    reason: string;
}[]>>;
export declare const getCount: import("convex/server").RegisteredQuery<"public", {
    guildId: string;
    userId: string;
}, Promise<number>>;
export declare const remove: import("convex/server").RegisteredMutation<"public", {
    warningId: import("convex/values").GenericId<"warnings">;
}, Promise<void>>;
export declare const clearByUser: import("convex/server").RegisteredMutation<"public", {
    guildId: string;
    userId: string;
}, Promise<number>>;
//# sourceMappingURL=warnings.d.ts.map