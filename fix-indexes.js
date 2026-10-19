/**
 * FIX SCRIPT - Create Firestore composite index programmatically
 * This creates the missing index that's blocking data from showing
 */

const { execSync } = require('child_process');

console.log('🔧 Creating Firestore composite index...\n');

try {
  // Deploy the indexes defined in firestore.indexes.json
  console.log('Deploying indexes to Firebase...');
  const output = execSync('firebase deploy --only firestore:indexes --project internship-274f9', {
    encoding: 'utf-8',
    stdio: 'inherit'
  });
  
  console.log('\n✅ Index deployment started!');
  console.log('⏳ Index is building... this takes 2-5 minutes.');
  console.log('\n📋 Next steps:');
  console.log('   1. Wait 2-5 minutes for index to build');
  console.log('   2. Refresh your Browse page');
  console.log('   3. All 27 internships should now appear!\n');
  
} catch (error) {
  console.error('\n❌ Deployment failed. Trying manual method...\n');
  console.log('MANUAL FIX (do this now):');
  console.log('1. Go to: https://console.firebase.google.com/project/internship-274f9/firestore/indexes');
  console.log('2. Click "Add Index"');
  console.log('3. Collection: internships');
  console.log('4. Add fields:');
  console.log('   - Field: published → Ascending');
  console.log('   - Field: createdAt → Descending');
  console.log('5. Click "Create"');
  console.log('6. Wait 2-5 minutes, then refresh your site\n');
}
