const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function captureUrl(url, outputPath, delayMs = 4000) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP, 'chrome-debug-session-' + Date.now());
  const port = 9335;

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
      path: `/json/new?${encodeURIComponent(url)}`,
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
  console.log(`Connecting to ${url}...`);
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

  await send('Page.enable');
  await send('Runtime.enable');

  console.log(`Waiting ${delayMs}ms for rendering...`);
  await new Promise(r => setTimeout(r, delayMs));

  const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotRes.data, 'base64');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved screenshot to: ${outputPath} (${buffer.length} bytes)`);

  ws.close();
  chromeProc.kill();
}

async function main() {
  const artifactDir = 'C:\\Users\\AndikaRd\\.gemini\\antigravity\\brain\\350daa82-759f-48aa-b51b-248c04609bb4';

  // 1. Capture 2D Map layout with Right Sidebar Feed & CEO Input
  console.log('\n--- 1. Capturing 2D Map Three-Area Layout ---');
  await captureUrl(
    'http://localhost:5173/office?view=2d',
    path.join(artifactDir, 'sprint-6-7-office-feed-2d.png'),
    3500
  );

  // 2. Capture 3D Living Office layout with Right Sidebar Feed & CEO Input
  console.log('\n--- 2. Capturing 3D Low-Poly Office Three-Area Layout ---');
  await captureUrl(
    'http://localhost:5173/office?view=3d&camera=overview',
    path.join(artifactDir, 'sprint-6-7-office-feed-3d.png'),
    5000
  );

  // 3. Capture 3D Living Office with employee selection and live wellbeing & feed
  console.log('\n--- 3. Capturing 3D Office with Alex Selected & Feed ---');
  await captureUrl(
    'http://localhost:5173/office?view=3d&employee=alex',
    path.join(artifactDir, 'sprint-6-7-office-alex-selected.png'),
    5000
  );

  console.log('\nAll captures successfully created!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

