// Quick URL verification script
const https = require('https');

const urls = [
  { id: 'R01', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=60' },
  { id: 'R02', url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=60' },
  { id: 'R03', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=60' },
  { id: 'R04', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=60' },
  { id: 'R05', url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=60' },
  { id: 'R06', url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=60' },
  { id: 'R07', url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=60' },
  { id: 'R08', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=60' },
  { id: 'R09', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=60' },
  { id: 'R10', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=60' },
  { id: 'R11', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=60' },
  { id: 'R12', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=60' },
  { id: 'R13', url: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=60' },
  { id: 'R14', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=60' },
  { id: 'R15', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=60' },
  { id: 'R16', url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=60' },
  { id: 'R17', url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=900&q=60' },
  { id: 'R18', url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=60' },
  { id: 'R19', url: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=900&q=60' },
  { id: 'R20', url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=60' },
  { id: 'R21', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=60' },
  { id: 'R22', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=60' },
  { id: 'R23', url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=60' },
  { id: 'R24', url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=60' },
  { id: 'R25', url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=60' },
  { id: 'R26', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=60' },
  { id: 'R27', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=60' }
];

let passed = 0;
let failed = 0;
const failures = [];

function checkUrl(item) {
  return new Promise((resolve) => {
    https.get(item.url, { method: 'HEAD' }, (res) => {
      const status = res.statusCode;
      const contentType = res.headers['content-type'] || '';
      
      if (status === 200 && contentType.startsWith('image/')) {
        passed++;
        console.log(`✓ ${item.id}: ${status} ${contentType}`);
      } else {
        failed++;
        failures.push(`${item.id}: ${status} ${contentType}`);
        console.log(`✗ ${item.id}: ${status} ${contentType}`);
      }
      resolve();
    }).on('error', (err) => {
      failed++;
      failures.push(`${item.id}: ERROR - ${err.message}`);
      console.log(`✗ ${item.id}: ERROR - ${err.message}`);
      resolve();
    });
  });
}

async function verifyAll() {
  console.log('Verifying 27 image URLs...\n');
  
  for (const item of urls) {
    await checkUrl(item);
  }
  
  console.log(`\n========================================`);
  console.log(`PASSED: ${passed}/27`);
  console.log(`FAILED: ${failed}/27`);
  
  if (failures.length > 0) {
    console.log(`\nFailures:`);
    failures.forEach(f => console.log(`  - ${f}`));
  }
}

verifyAll();
