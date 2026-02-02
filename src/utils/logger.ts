type LogLevel = "debug" | "info" | "warn" | "error";

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
} as const;

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = `${colors.dim}${formatTimestamp()}${colors.reset}`;
  const levelColors: Record<LogLevel, string> = {
    debug: colors.cyan,
    info: colors.green,
    warn: colors.yellow,
    error: colors.red,
  };

  const levelStr = `${levelColors[level]}${level.toUpperCase().padEnd(5)}${colors.reset}`;
  const formattedArgs = args.length
    ? " " + args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ")
    : "";

  return `${timestamp} ${levelStr} ${message}${formattedArgs}`;
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === "development") {
      console.log(formatMessage("debug", message, ...args));
    }
  },

  info(message: string, ...args: unknown[]): void {
    console.log(formatMessage("info", message, ...args));
  },

  warn(message: string, ...args: unknown[]): void {
    console.warn(formatMessage("warn", message, ...args));
  },

  error(message: string, ...args: unknown[]): void {
    console.error(formatMessage("error", message, ...args));
  },
};
