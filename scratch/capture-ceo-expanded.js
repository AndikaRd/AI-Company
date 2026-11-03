const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP, 'chrome-debug-session-' + Date.now());
  const port = 9338;

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1600,950',
    '--no-first-run',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1800));

  const tab = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: `/json/new?${encodeURIComponent('http://localhost:5173/office?view=3d')}`,
      method: 'PUT'
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
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
  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Waiting 4.5s for initial load...');
  await new Promise(r => setTimeout(r, 4500));

  // Click the history button: title="View directive history"
  console.log('Clicking history toggle button...');
  await send('Runtime.evaluate', {
    expression: `
      const historyBtn = document.querySelector('button[title="View directive history"]');
      if (historyBtn) historyBtn.click();
    `
  });

  await new Promise(r => setTimeout(r, 1200));

  const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotRes.data, 'base64');
  const outputPath = 'C:\\Users\\AndikaRd\\.gemini\\antigravity\\brain\\350daa82-759f-48aa-b51b-248c04609bb4\\sprint-6-7-ceo-history.png';
  fs.writeFileSync(outputPath, buffer);
  console.log('Saved screenshot to:', outputPath, buffer.length);

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);

