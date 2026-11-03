const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP, 'chrome-debug-session-' + Date.now());
  const port = 9333;

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1440,900',
    '--no-first-run',
    'about:blank'
  ]);

  // Wait 1.5s for Chrome
  await new Promise(r => setTimeout(r, 1500));

  // Open new tab to /office using PUT
  const tab = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/json/new?http://localhost:5173/office',
      method: 'PUT'
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });

  const wsUrl = tab.webSocketDebuggerUrl;
  console.log('Connecting to WebSocket CDP:', wsUrl);

  const ws = new WebSocket(wsUrl);

  let id = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  await new Promise(resolve => ws.addEventListener('open', resolve));

  // Enable Console and Runtime
  await send('Console.enable');
  await send('Runtime.enable');
  await send('Page.enable');

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Console.messageAdded') {
      console.log('[BROWSER CONSOLE]', msg.params.message.level, msg.params.message.text);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = (msg.params.args || []).map(a => a.value || a.description).join(' ');
      console.log('[BROWSER LOG]', msg.params.type, args);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
    }
  });

  // Navigate and wait for loading
  console.log('Waiting 5s for React Three Fiber and 3D assets to render...');
  await new Promise(r => setTimeout(r, 5000));

  // Capture screenshot
  const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotRes.data, 'base64');

  const outputPath = 'C:\\Users\\AndikaRd\\.gemini\\antigravity\\brain\\350daa82-759f-48aa-b51b-248c04609bb4\\office-redesign.png';
  fs.writeFileSync(outputPath, buffer);
  console.log('Saved rendered screenshot to:', outputPath, 'Bytes:', buffer.length);

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
