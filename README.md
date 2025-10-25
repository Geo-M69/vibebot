# VibeBot

A modular and performant Discord bot built with Discord.js v14, featuring music playback, moderation tools, memes, utilities, and custom commands.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-v14.23.2-blue)](https://discord.js.org/)

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Discord Bot Setup](#discord-bot-setup)
- [Configuration](#configuration)
- [Running the Bot](#running-the-bot)
- [Deployment](#deployment)
- [Command Categories](#command-categories)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Music Bot** - Play music from YouTube with queue management, shuffle, loop, and more
  - Uses `play-dl` for fast streaming with automatic fallback to `yt-dlp`
  - Smart caching system for improved performance
  - Support for playlists and search queries
- **Moderation** - Kick, ban, mute, warn, purge messages, and slowmode controls
- **Memes** - Reddit integration and shitpost commands
- **Utility** - Server info, user info, ping, emoji management, countdown, and translation
- **Custom Commands** - Create and manage your own server-specific commands
- **Welcome/Goodbye** - Customizable welcome and goodbye messages for members
- **Slash Commands** - Modern Discord slash command support
- **Modular Design** - Easy to extend and customize

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **pnpm**
- **FFmpeg** (required for music playback)
- **yt-dlp** (required for music playback - fallback when play-dl fails)
- **Git** (for cloning the repository)

### Installing FFmpeg

#### Windows
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract the archive and add the `bin` folder to your system PATH
3. Verify installation: `ffmpeg -version`

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Linux (Fedora)
```bash
sudo dnf install ffmpeg
```

### Installing yt-dlp

yt-dlp is used as a fallback for music playback when play-dl fails. It's a command-line tool that needs to be installed on your system.

#### Windows
Download the latest release from [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases) and place `yt-dlp.exe` in a folder that's in your system PATH, or in the bot's directory.

#### macOS
```bash
brew install yt-dlp
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install yt-dlp
```

Or install via pip:
```bash
pip install yt-dlp
```

#### Linux (Fedora)
```bash
sudo dnf install yt-dlp
```

#### Verify Installation
```bash
yt-dlp --version
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Geo-M69/vibebot.git
cd vibebot
```

### 2. Install Dependencies

```bash
npm install
```

Or if you prefer pnpm:
```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

If `.env.example` doesn't exist, create a `.env` file manually with the following content:

```env
# Discord Bot Configuration

# Required - Discord bot token from https://discord.com/developers/applications
TOKEN=your_bot_token_here

# Required - Your Discord application ID
CLIENT_ID=your_client_id_here

# Optional - Reddit API credentials (required for meme commands)
# Get these from https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_SECRET=your_reddit_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password

# Optional - DeepL API key (required for translation command)
# Get your API key from https://www.deepl.com/pro#developer
DEEPL=your_deepl_api_key

# Optional - Bot status settings
BOT_STATUS=online
# Options: online, idle, dnd, invisible

# Optional - Activity settings
ACTIVITY_TYPE=PLAYING
# Options: PLAYING, WATCHING, LISTENING, STREAMING, COMPETING

ACTIVITY_NAME=Discord
# The activity name that will be displayed

# Optional - Environment settings
NODE_ENV=production
# Options: development, production
```

## Discord Bot Setup

### Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name
3. Navigate to the **"Bot"** section in the left sidebar
4. Click **"Add Bot"** and confirm
5. Copy the **Token** and paste it into your `.env` file as `TOKEN`

### Step 2: Enable Privileged Gateway Intents

In the Bot section, scroll down to **"Privileged Gateway Intents"** and enable:

- **Presence Intent** (optional, for member status)
- **Server Members Intent** (required for welcome/goodbye messages)
- **Message Content Intent** (required for the bot to read messages)

### Step 3: Get Your Client ID

1. Go to the **"OAuth2"** section
2. Copy your **Application ID** (Client ID)
3. Paste it into your `.env` file as `CLIENT_ID`

### Step 4: Generate Bot Invite URL

1. In the **"OAuth2"** → **"URL Generator"** section
2. Select the following scopes:
   - `bot`
   - `applications.commands`

3. Select the following bot permissions:
   - Read Messages/View Channels
   - Send Messages
   - Manage Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Add Reactions
   - Use Slash Commands
   - Connect (for voice)
   - Speak (for voice)
   - Manage Channels (for moderation)
   - Kick Members (for moderation)
   - Ban Members (for moderation)
   - Moderate Members (for timeout/mute)

4. Copy the generated URL at the bottom and open it in your browser to invite the bot to your server

### Step 5: Optional API Keys

#### Reddit API (for meme commands)

1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click **"create another app..."** at the bottom
3. Fill in the form:
   - **name**: Your bot name
   - **type**: Select "script"
   - **redirect uri**: `http://localhost:8080`
4. Click **"create app"**
5. Copy the **client ID** (under the app name) and **secret**
6. Add your Reddit username and password to `.env`

#### DeepL API (for translation command)

1. Sign up for a [DeepL API account](https://www.deepl.com/pro#developer)
2. Choose the free tier (500,000 characters/month)
3. Copy your **Authentication Key**
4. Paste it into your `.env` file as `DEEPL`

## Configuration

### Deploy Slash Commands

Before running the bot, you need to register the slash commands with Discord:

```bash
npm run deploy
```

This will register commands globally (may take up to an hour to appear).

For instant registration in a specific guild (for testing):
```bash
npm run deploy:guild
```

## Running the Bot

### Development Mode

```bash
npm run dev
```

This runs the bot with more verbose logging and error details.

### Production Mode

```bash
npm start
```

### Running Tests

```bash
npm test
```

## Deployment

### Option 1: Local Server / VPS

#### Using PM2 (Recommended for Production)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the bot with PM2:
```bash
pm2 start index.js --name vibebot
```

3. Set PM2 to start on system boot:
```bash
pm2 startup
pm2 save
```

4. Useful PM2 commands:
```bash
pm2 status          # Check bot status
pm2 logs vibebot    # View logs
pm2 restart vibebot # Restart bot
pm2 stop vibebot    # Stop bot
pm2 delete vibebot  # Remove from PM2
```

### Option 2: Cloud Platforms

#### Railway

1. Create an account at [Railway.app](https://railway.app/)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your forked repository
4. Add environment variables in the **"Variables"** tab
5. Railway will automatically deploy your bot

#### Heroku

1. Create a `Procfile` in the root directory:
```
worker: node index.js
```

2. Deploy to Heroku:
```bash
heroku create your-bot-name
heroku config:set TOKEN=your_token_here
heroku config:set CLIENT_ID=your_client_id_here
# Add other environment variables...
git push heroku main
heroku ps:scale worker=1
```

#### DigitalOcean / Linode / AWS

1. Create a VPS instance
2. SSH into your server
3. Install Node.js and FFmpeg
4. Clone your repository
5. Set up environment variables
6. Use PM2 or systemd to keep the bot running

### Docker (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg python3 py3-pip
RUN pip3 install --no-cache-dir yt-dlp
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "index.js"]
```

Build and run:
```bash
docker build -t vibebot .
docker run -d --env-file .env vibebot
```

## Command Categories

### Music Commands
- `/play` - Play a song from YouTube
- `/pause` - Pause the current song
- `/resume` - Resume playback
- `/skip` - Skip to the next song
- `/stop` - Stop playback and clear queue
- `/queue` - View the current queue
- `/nowplaying` - Show currently playing song
- `/volume` - Adjust volume (0-100)
- `/loop` - Toggle loop mode
- `/shuffle` - Shuffle the queue
- `/clearqueue` - Clear the entire queue
- `/remove` - Remove a specific song from queue

### Moderation Commands
- `/kick` - Kick a member from the server
- `/ban` - Ban a member from the server
- `/mute` - Timeout/mute a member
- `/warn` - Warn a member
- `/purge` - Delete multiple messages
- `/clear` - Clear messages in a channel
- `/slowmode` - Set channel slowmode

### Meme Commands
- `/reddit` - Fetch a random post from a subreddit
- `/shitpost` - Random shitpost meme

### Utility Commands
- `/help` - Display help information
- `/ping` - Check bot latency
- `/serverinfo` - Display server information
- `/userinfo` - Display user information
- `/info` - Bot information
- `/invite` - Get bot invite link
- `/emoji` - Emoji utilities
- `/countdown` - Create a countdown timer
- `/translatemessage` - Translate messages using DeepL

### Custom Commands
- `/commandcreator` - Create a custom command
- `/listcommands` - List all custom commands
- `/removecommand` - Remove a custom command
- `/removeallcommands` - Remove all custom commands
- `/setwelcome` - Set welcome message
- `/setgoodbye` - Set goodbye message

## Troubleshooting

### Bot doesn't respond to commands

- Verify the bot has **Message Content Intent** enabled in Discord Developer Portal
- Check that slash commands are deployed: `npm run deploy`
- Ensure the bot has proper permissions in your server
- Check bot logs for errors

### Music commands not working

- Ensure FFmpeg is installed: `ffmpeg -version`
- Ensure yt-dlp is installed: `yt-dlp --version`
- Verify the bot has **Connect** and **Speak** permissions in voice channels
- Check if YouTube videos are age-restricted or region-locked
- Try updating play-dl: `npm update play-dl`
- If play-dl fails, the bot will automatically fallback to yt-dlp

### Reddit commands not working

- Verify your Reddit API credentials in `.env`
- Ensure your Reddit account has API access
- Check if the subreddit exists and is public

### Translation command not working

- Verify your DeepL API key in `.env`
- Check if you've exceeded your API quota
- Ensure you're using a valid DeepL API key (not Auth Key)

### Bot crashes on startup

- Verify all required environment variables are set
- Check Node.js version: `node -v` (must be ≥18.0.0)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for syntax errors: `npm test`

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

1. Check if the issue already exists in [Issues](https://github.com/Geo-M69/vibebot/issues)
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Node.js version)
   - Relevant logs

### Suggesting Features

1. Open an issue with the tag `enhancement`
2. Describe the feature and its use case
3. Explain why it would be useful

### Submitting Code

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m "Add: feature description"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Comment complex logic
- Update documentation for new features
- Test your changes before submitting
- Keep commits atomic and well-described

### Code Structure

```
vibebot/
├── commands/          # Slash command definitions
│   ├── Moderation/   # Moderation commands
│   ├── musicBot/     # Music commands
│   ├── Utility/      # Utility commands
│   ├── Memes/        # Meme commands
│   └── customCommands/ # Custom command system
├── src/
│   ├── bot.js        # Main bot initialization
│   ├── config/       # Configuration files
│   ├── events/       # Discord event handlers
│   ├── handlers/     # Command and event loaders
│   ├── services/     # Business logic services
│   └── utils/        # Helper utilities
├── data/             # JSON storage files
└── tests/            # Test files
```

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Discord.js](https://discord.js.org/)
- Music powered by [@discordjs/voice](https://github.com/discordjs/voice), [play-dl](https://github.com/play-dl/play-dl), and [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- Translation by [DeepL API](https://www.deepl.com/)
- Memes from Reddit via [@snazzah/davey](https://github.com/Snazzah/davey)

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Geo-M69/vibebot/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/Geo-M69/vibebot/discussions)

---

Made by [Geo-M69](https://github.com/Geo-M69)