import {
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
} from "discord.js";

/**
 * Check if a member has moderator permissions
 */
export function isModerator(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.ModerateMembers);
}

/**
 * Check if a member has administrator permissions
 */
export function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Check if the bot can moderate a target member
 */
export function canModerate(
  interaction: ChatInputCommandInteraction,
  target: GuildMember
): { success: boolean; reason?: string } {
  const bot = interaction.guild?.members.me;
  const executor = interaction.member as GuildMember;

  if (!bot || !interaction.guild) {
    return { success: false, reason: "Could not verify permissions" };
  }

  // Can't moderate the server owner
  if (target.id === interaction.guild.ownerId) {
    return { success: false, reason: "Cannot moderate the server owner" };
  }

  // Can't moderate yourself
  if (target.id === executor.id) {
    return { success: false, reason: "You cannot moderate yourself" };
  }

  // Can't moderate the bot itself
  if (target.id === bot.id) {
    return { success: false, reason: "I cannot moderate myself" };
  }

  // Check role hierarchy (executor)
  if (executor.roles.highest.position <= target.roles.highest.position) {
    return {
      success: false,
      reason: "Target has equal or higher role than you",
    };
  }

  // Check role hierarchy (bot)
  if (bot.roles.highest.position <= target.roles.highest.position) {
    return {
      success: false,
      reason: "Target has equal or higher role than me",
    };
  }

  return { success: true };
}

/**
 * Format a duration string (e.g., "1h", "30m", "1d") to milliseconds
 */
export function parseDuration(duration: string): number | null {
  const match = duration.match(/^(\d+)(s|m|h|d|w)$/);
  if (!match) return null;

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit!] ?? 0);
}
