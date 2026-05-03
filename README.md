# zap ⚡

![Zap Banner](assets/banner.png)

Customize any running Electron desktop app live — no file editing, no restarts, no sudo.

Zap uses the Chrome DevTools Protocol (CDP) to inject CSS and JavaScript directly into the renderer process of any Electron app while it's running. Just describe what you want changed and it happens instantly.

## Works on any Electron app

Slack, Codex, VS Code, Discord, Notion, Cursor, Linear, and more.

## How it works

Every Electron app runs on Chromium. Launching it with `--remote-debugging-port=9222` opens a WebSocket API — the same one that powers browser DevTools. Zap connects to it and injects your changes live.

### The tech behind it

**Chrome DevTools Protocol (CDP)** is the same protocol your browser uses internally when you open DevTools and edit CSS in the inspector. It's a WebSocket API that gives you programmatic access to the Chromium engine — running JS, injecting styles, inspecting the DOM, all of it.

Since every Electron app is just Chromium + Node.js bundled together, they all support CDP out of the box. The debug port is just hidden by default.

Here's what Zap does under the hood:

```
1. Relaunch the app with --remote-debugging-port=9222
2. Hit http://localhost:9222/json to discover renderer targets
3. Open a WebSocket connection to the page target
4. Call Runtime.evaluate() to inject a <style> tag into the live DOM
5. Chromium applies the CSS instantly — no reload, no restart
```

The injected style tag gets a unique ID (`__zap__`) so re-injections cleanly replace previous patches without stacking up.

This works on **every Electron app ever made** — Slack, VS Code, Discord, Notion, Cursor, Linear, Codex — because they all share the same Chromium foundation. The app has no idea it happened.

## Quick start

### Install the skill (Claude Code, Codex, OpenCode, etc)

```bash
npx skills add https://github.com/hetpatel-11/Zap --skill zap
```

Or copy `skills/zap/SKILL.md` into your agent's skills directory manually.

## Skills

The `skills/` folder contains agent skill files that teach any coding agent (Claude Code, Codex, etc.) how to use Zap's CDP approach. Install a skill and your agent gains the ability to customize any Electron app on demand — just describe what you want.


## patches/

Save your app customizations here as reusable patch scripts. Run them anytime to reapply.

## License

MIT
