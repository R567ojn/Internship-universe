const dataset = require('./internships_datase.json');

console.log('=== DELETION VERIFICATION ===\n');
console.log(`Total records remaining: ${dataset.length}`);

const deleted = ['R17', 'R18', 'R19'];
const companies = ['CRTV (Cameroon Radio Television)', 'Equinoxe TV', 'Port Autonome de Douala (PAD)'];

console.log('\nChecking deleted records:');
deleted.forEach((id, i) => {
  const found = dataset.find(r => r.id === id);
  console.log(`  ${id} (${companies[i]}): ${found ? '❌ STILL EXISTS' : '✓ DELETED'}`);
});

console.log('\nRemaining record IDs:');
const ids = dataset.map(r => r.id).join(', ');
console.log(`  ${ids}`);
