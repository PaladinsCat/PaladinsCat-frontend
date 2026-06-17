const { spawn } = require('child_process');

const chromePath = 'C:\\Users\\nabi\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe';
const targetUrl = 'http://localhost:3000';

// Launch Chrome Canary and keep it open
const child = spawn(chromePath, [
  '--remote-debugging-port=19222',
  '--no-first-run',
  '--window-size=1280,800',
  targetUrl
]);

child.on('error', (e) => {
  console.log('Chrome launch error:', e.message);
  process.exit(1);
});

console.log('✅ Chrome Canary launched: ' + targetUrl);
console.log('CDP port: 19222');
console.log('PID:', child.pid);
