const https = require('https');
const { spawn } = require('child_process');

const req = https.request('https://learnfrompeers-m8ly.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', d => process.stdout.write(d));
  
  setTimeout(() => {
    const child = spawn('vercel', ['logs', 'learnfrompeers-m8ly.vercel.app'], { shell: true });
    
    child.stdout.on('data', (data) => {
      console.log(`LOGS: ${data}`);
      if (data.toString().includes('Error:')) {
        child.kill();
        process.exit();
      }
    });

    setTimeout(() => { child.kill(); process.exit(); }, 15000);
  }, 1000);
});

req.write(JSON.stringify({email: 'admin@lfp.com', password: 'admin123'}));
req.end();
