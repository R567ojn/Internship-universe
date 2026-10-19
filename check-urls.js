const https = require('https');

const urls = [
  { company: 'Port Autonome de Douala (PAD)', primary: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=900&q=60', fallback: null },
  { company: 'CAMPOST', primary: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=60', fallback: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=60' },
  { company: 'Equinoxe TV', primary: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=60', fallback: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=60' },
  { company: 'CRTV', primary: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=900&q=60', fallback: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=60' }
];

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { method: 'HEAD' }, (res) => {
      const status = res.statusCode;
      const contentType = res.headers['content-type'] || '';
      resolve({ status, contentType, ok: status === 200 && contentType.startsWith('image/') });
    }).on('error', () => resolve({ status: 0, contentType: '', ok: false }));
  });
}

async function verify() {
  for (const item of urls) {
    const result = await checkUrl(item.primary);
    console.log(`${item.company}: PRIMARY ${result.ok ? 'OK' : 'FAILED'} (${result.status} ${result.contentType})`);
    if (!result.ok && item.fallback) {
      const fb = await checkUrl(item.fallback);
      console.log(`  → FALLBACK ${fb.ok ? 'OK' : 'FAILED'} (${fb.status} ${fb.contentType})`);
    }
  }
}

verify();
