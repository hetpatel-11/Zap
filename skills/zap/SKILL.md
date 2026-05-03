---
name: zap
description: Customize any running Electron desktop app (Slack, Codex, VS Code, Discord, Notion, etc.) live without modifying app files. Use when the user wants to change how an Electron app looks or behaves — move panels, change fonts, hide elements, inject features, restyle UI — all applied instantly via Chrome DevTools Protocol (CDP) while the app is running.
---

# Electron Live Patcher

Customize any Electron desktop app live using the Chrome DevTools Protocol (CDP). No file modification, no restarts, no sudo. Changes appear instantly in the running app.

## How It Works

Every Electron app is built on Chromium. When launched with `--remote-debugging-port=9222`, it exposes a WebSocket API that lets you run JavaScript inside its renderer process — the same way browser DevTools work, but programmatically from outside the app.

## Step-by-Step Process

### 1. Check if the app is running with CDP enabled

```bash
curl -s http://localhost:9222/json 2>/dev/null
```

If empty or connection refused, the app needs to be relaunched with the debug port.

### 2. Relaunch with CDP enabled (if needed)

```bash
pkill -x "AppName"
sleep 1
open -a "AppName" --args --remote-debugging-port=9222
sleep 3
```

### 3. Find the main page target

```bash
curl -s http://localhost:9222/json
```

Look for the target where `"type": "page"` and `"title"` matches the app name. Note its `webSocketDebuggerUrl`.

### 4. Inject CSS or JS via Node.js WebSocket

Create and run a temporary inject script:

```js
const WebSocket = require('ws');
const http = require('http');

const CSS = `/* your CSS here */`;

function getTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function inject() {
  const targets = await getTargets();
  const page = targets.find(t => t.type === 'page');
  if (!page) return console.error('No page target found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;

  ws.on('open', () => {
    ws.send(JSON.stringify({
      id: id++,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            const existing = document.getElementById('__zap__');
            if (existing) existing.remove();
            const style = document.createElement('style');
            style.id = '__zap__';
            style.textContent = ${JSON.stringify(CSS)};
            document.head.appendChild(style);
            return 'injected';
          })()
        `
      }
    }));
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.result?.result?.value === 'injected') {
      console.log('Zap applied!');
      ws.close();
    }
  });
}

inject();
```

Run: `node /tmp/zap.js` (install `ws` first if needed: `npm install -g ws`)

## Discovering the DOM Structure

Before writing CSS, inspect the app's live DOM:

```js
// Dump top-level structure
expression: `document.body.innerHTML.substring(0, 3000)`

// Find sidebar/panel elements
expression: `
  Array.from(document.querySelectorAll('[class*="sidebar"],[class*="panel"],[class*="nav"]'))
    .map(el => el.tagName + ' ' + el.className.substring(0, 80))
    .slice(0, 20).join('\\n')
`
```

## Common Customizations

### Move left sidebar to the right
```css
.max-h-full.min-h-0.w-full.flex-1:has(> aside) {
  flex-direction: row-reverse;
}
```

### Hide an element
```css
[data-testid="element-name"] { display: none !important; }
```

### Change fonts globally
```css
* { font-family: "Your Font", sans-serif !important; }
```

### Custom theme colors
```css
:root {
  --background-color: #1a1a2e;
  --text-color: #eee;
}
```

### Inject a floating widget
```js
const div = document.createElement('div');
div.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;background:#000;color:#fff;padding:10px;border-radius:8px;';
div.textContent = 'Hello from Zap!';
document.body.appendChild(div);
```

## Persisting Patches Across Restarts

CDP injection is in-memory — it disappears when the app restarts.

**Option A: Save a patch file**
```bash
node /path/to/your/patch.js
```

**Option B: Shell alias that reopens + re-injects**
```bash
# Add to ~/.zshrc
alias codex='pkill -x Codex; sleep 0.5; open -a Codex --args --remote-debugging-port=9222; sleep 3; node /path/to/your/patch.js'
```

## App-Specific Notes

| App | Process Name | Notes |
|-----|-------------|-------|
| Slack | Slack | Legacy CSS class names, easy to target |
| Codex | Codex | Tailwind utility classes, use `:has()` selectors |
| VS Code | Electron | Has built-in DevTools; debug port may conflict on 9222 — try 9223 |
| Discord | Discord | May need `--ignore-gpu-blacklist` flag too |
| Notion | Notion | React-based, inspect DOM first |
| Cursor | Cursor | VS Code fork, same notes as VS Code |

## Guidelines

- Always inspect the DOM before writing CSS — class names vary per app
- Use `__zap__` as the style tag ID so re-injections replace cleanly
- Prefer CSS over JS for visual changes — safer and easier to revert
- Test with a tiny change first (e.g., `body { outline: 2px solid red }`) to confirm injection works
- The debug port (9222) is local-only — no security exposure

## Examples

- "Move Codex sidebar to the right" → flex-direction row-reverse on the layout container
- "Hide Slack's sidebar" → `aside { display: none }`
- "Make VS Code font 16px" → `* { font-size: 16px !important }`
- "Add dark overlay to Notion" → inject a fixed div with rgba background
- "Move Discord member list to the left" → reorder flex children with `order` property
