# Discord Bot Template

A clean, reusable Discord bot template with TypeScript, pnpm, and optional Convex integration.

## Features

- **TypeScript** - Full type safety
- **Discord.js v14** - Latest Discord API features
- **Convex Integration** - Ready-to-use database schema (optional)
- **Modular Structure** - Commands, events, and utilities organized
- **Moderation Commands** - Kick, ban, mute, warn, clear
- **Permission Handling** - Role hierarchy checks built-in
- **Slash Commands** - Modern Discord interactions

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### Installation

```bash
# Clone the repository
git clone https://github.com/AverWasTaken/dbtemplate.git
cd dbtemplate

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
```

### Configuration

Edit `.env` with your credentials:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here  # Optional: for faster dev testing
CONVEX_URL=your_convex_url_here      # Optional: only if using Convex
```

### Running

```bash
# Development (with hot reload)
pnpm dev

# Production
pnpm build
pnpm start
```

## Project Structure

```
├── src/
│   ├── index.ts              # Entry point & initialization
│   ├── commands/             # Slash commands
│   │   ├── kick.ts
│   │   ├── ban.ts
│   │   ├── mute.ts
│   │   ├── unmute.ts
│   │   ├── warn.ts
│   │   └── clear.ts
│   ├── events/               # Discord event handlers
│   │   ├── ready.ts
│   │   └── interactionCreate.ts
│   └── utils/                # Utilities
│       ├── commandLoader.ts
│       ├── eventLoader.ts
│       ├── permissions.ts
│       └── logger.ts
├── convex/                   # Convex database (optional)
│   ├── schema.ts
│   ├── warnings.ts
│   └── modlogs.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## Adding Commands

Create a new file in `src/commands/`:

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../utils/commandLoader.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("Pong!");
  },
};

export default command;
```

Commands are auto-loaded on startup.

## Adding Events

Create a new file in `src/events/`:

```typescript
import { Events } from "discord.js";
import type { Event } from "../utils/eventLoader.js";

const event: Event<typeof Events.MessageCreate> = {
  name: Events.MessageCreate,
  execute(message) {
    console.log(`Message received: ${message.content}`);
  },
};

export default event;
```

## Convex Setup (Optional)

If you want to use Convex for database features:

1. Install Convex CLI: `pnpm add -g convex`
2. Initialize: `pnpm convex init`
3. Deploy schema: `pnpm convex deploy`
4. Add `CONVEX_URL` to your `.env`

The template includes schemas for:
- **Warnings** - Track user warnings
- **Mod Logs** - Log moderation actions
- **Guild Config** - Per-server settings

## Built-in Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/kick` | Kick a member | Kick Members |
| `/ban` | Ban a member | Ban Members |
| `/mute` | Timeout a member | Moderate Members |
| `/unmute` | Remove timeout | Moderate Members |
| `/warn` | Issue a warning | Moderate Members |
| `/clear` | Bulk delete messages | Manage Messages |

## Bot Permissions

Required bot permissions for full functionality:
- Kick Members
- Ban Members
- Moderate Members
- Manage Messages
- Send Messages
- Embed Links
- Read Message History

## License

MIT
