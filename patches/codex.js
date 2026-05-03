const WebSocket = require('ws');
const http = require('http');

const CSS = `
  /* Move sidebar to the right */
  .max-h-full.min-h-0.w-full.flex-1:has(> aside.pointer-events-auto) {
    flex-direction: row-reverse;
  }
`;

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
  const page = targets.find(t => t.type === 'page' && t.title === 'Codex');
  if (!page) return console.error('Codex page target not found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;

  ws.on('open', () => {
    console.log('Connected to Codex renderer');

    // Inject CSS via Runtime.evaluate
    ws.send(JSON.stringify({
      id: id++,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (function() {
            const existing = document.getElementById('__electron-patch__');
            if (existing) existing.remove();
            const style = document.createElement('style');
            style.id = '__electron-patch__';
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
      console.log('CSS injected into Codex!');
      ws.close();
    }
  });

  ws.on('error', (err) => console.error('WebSocket error:', err.message));
}

inject();
