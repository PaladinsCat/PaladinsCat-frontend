const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Users\\nabi\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\nabi\\AppData\\Local\\Google\\Chrome SxS\\BrowserCheck';
const cdpPort = 19222;
const targetUrl = 'http://localhost:3000';

// Ensure user data dir exists
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir, { recursive: true });
}

// Launch Chrome Canary
console.log('Launching Chrome Canary...');
const child = spawn(chromePath, [
  '--remote-debugging-port=' + cdpPort,
  '--user-data-dir=' + userDataDir,
  '--no-first-run',
  '--window-size=1280,800',
  targetUrl
]);

child.on('error', (e) => {
  console.log('Process error:', e.message);
  process.exit(1);
});

setTimeout(() => {
  http.get('http://localhost:' + cdpPort + '/json', {timeout: 10000}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const tabs = JSON.parse(data);
      const target = tabs.find(t => t.url.startsWith('http://localhost:3000'));
      
      console.log('=====================================');
      console.log('Chrome Canary - Browser Automation Check');
      console.log('=====================================');
      
      if (target) {
        console.log('✅ Page found!');
        console.log('  URL:', target.url);
        console.log('  Title:', target.title);
        console.log('  Status:', target.status);
      } else {
        console.log('❌ Page not found in tabs.');
        console.log('  Available tabs:', tabs.map(t => t.title + ' | ' + t.url).join('\n                  '));
      }
      
      // Also check the dev server directly
      http.get('http://localhost:3000', (res2) => {
        let html = '';
        res2.on('data', c => html += c);
        res2.on('end', () => {
          const title = (html.match(/<title>(.*?)<\/title>/) || [])[1] || 'Untitled';
          const desc = (html.match(/<meta name="description" content="(.*?)">/) || [])[1] || 'No description';
          const links = html.match(/<a class="pc-nav-link" href="(.*?)">/g) || [];
          
          console.log('\nDirect check:');
          console.log('  Status:', res2.statusCode);
          console.log('  Title:', title);
          console.log('  Description:', desc);
          console.log('  Nav links:', links.length);
          
          // Cleanup
          fs.rmSync(userDataDir, { recursive: true, force: true });
          child.kill();
          process.exit(0);
        });
      }).on('error', (e) => {
        console.log('Direct check error:', e.message);
        fs.rmSync(userDataDir, { recursive: true, force: true });
        child.kill();
        process.exit(1);
      });
    });
  }).on('error', (e) => {
    console.log('CDP check error:', e.message);
    fs.rmSync(userDataDir, { recursive: true, force: true });
    child.kill();
    process.exit(1);
  });
}, 3000);
