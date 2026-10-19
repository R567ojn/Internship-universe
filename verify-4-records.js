const dataset = require('./internships_datase.json');

const targets = [
  'Port Autonome de Douala (PAD)',
  'CAMPOST (Cameroon Postal Services)',
  'Equinoxe TV',
  'CRTV (Cameroon Radio Television)'
];

console.log('=== READ-BACK PROOF FROM internships_datase.json ===\n');

targets.forEach(targetCompany => {
  const record = dataset.find(r => r.company === targetCompany);
  if (record) {
    console.log(`✓ ${record.company}`);
    console.log(`  imageUrl: ${record.imageUrl}`);
    console.log('');
  } else {
    console.log(`✗ ${targetCompany} - NOT FOUND`);
    console.log('');
  }
});

console.log('=== END READ-BACK PROOF ===');
