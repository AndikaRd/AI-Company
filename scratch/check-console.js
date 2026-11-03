const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = process.env.TEMP + '\\chrome-debug-' + Date.now();
  const port = 9333;

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--enable-webgl',
    '--no-first-run',
    'about:blank'
  ]);

  // wait 1.5s for Chrome to bind port
  await new Promise(r => setTimeout(r, 1500));

  // Get websocket debugger URL
  const versionRes = await new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}/json/version`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  console.log('Chrome Browser:', versionRes.Browser);

  // Create new target/tab
  const newTab = await new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}/json/new?http://localhost:5173/office`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  console.log('Opened target:', newTab.id, newTab.url);

  // Connect via WebSocket to target
  const WebSocket = require('ws'); // let's check if ws is in node_modules
}

main().catch(console.error);

