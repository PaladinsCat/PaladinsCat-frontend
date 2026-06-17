const { spawn } = require('child_process');
const http = require('http');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// Kill existing Edge instances on port 9222
spawn('taskkill', ['/F', '/FI', 'PID ne 4', '/IM', 'msedge.exe']).on('close', () => {
  // Launch new Edge
  const child = spawn(edgePath, [
    '--remote-debugging-port=9222',
    '--no-first-run',
    'http://localhost:3000'
  ], {
    detached: true,
    stdio: 'ignore'
  });

  setTimeout(() => {
    http.get('http://localhost:9222/json', {timeout: 10000}, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tabs = JSON.parse(data);
          const target = tabs.find(t => t.url.startsWith('http://localhost:3000'));
          if (target) {
            console.log('SUCCESS: Browser opened and tab loaded');
            console.log('URL:', target.url);
            console.log('Title:', target.title);
            console.log('Status:', target.status);
          } else {
            console.log('Tab not found. Available tabs:');
            tabs.forEach(t => console.log(' -', t.title, '|', t.url));
          }
        } catch(e) {
          console.log('Parse error:', e.message);
          console.log('Raw data:', data.substring(0, 200));
        }
        child.kill('SIGKILL');
        process.exit(0);
      });
    }).on('error', (e) => {
      console.log('Error:', e.message);
      child.kill('SIGKILL');
      process.exit(1);
    });
  }, 5000);
});
