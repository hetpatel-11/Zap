# zap ⚡

![Zap Banner](assets/banner.png)

Customize any running Electron desktop app live — no file editing, no restarts, no sudo.

Zap uses the Chrome DevTools Protocol (CDP) to inject CSS and JavaScript directly into the renderer process of any Electron app while it's running. Just describe what you want changed and it happens instantly.

## Works on any Electron app

Slack, Codex, VS Code, Discord, Notion, Cursor, Linear, and more.

## How it works

Every Electron app runs on Chromium. Launching it with `--remote-debugging-port=9222` opens a WebSocket API — the same one that powers browser DevTools. Zap connects to it and injects your changes live.

## Quick start

```bash
# Relaunch your app with the debug port open
pkill -x "Codex"
open -a Codex --args --remote-debugging-port=9222

# Install the ws package if you don't have it
npm install -g ws

# Ask your AI agent to customize it, or run a patch script directly
node patches/codex.js
```

## Skills

The `skills/` folder contains agent skill files that teach any coding agent (Claude Code, Codex, etc.) how to use Zap's CDP approach. Install a skill and your agent gains the ability to customize any Electron app on demand — just describe what you want.

### Install the skill (Claude Code)

```bash
npx skills add https://github.com/hetpatel-11/Zap --skill zap
```

Or copy `skills/zap/SKILL.md` into your agent's skills directory manually.

## patches/

Save your app customizations here as reusable patch scripts. Run them anytime to reapply.

## License

MIT
