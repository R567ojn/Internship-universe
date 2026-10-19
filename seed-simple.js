/**
 * SIMPLIFIED SEED SCRIPT
 * Handles firebase-admin more carefully
 */

const admin = require('firebase-admin');
const dataset = require('./internships_datase.json');

// Check if serviceAccount file exists
const fs = require('fs');
if (!fs.existsSync('./serviceAccountKey.json')) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'internship-274f9'
  });
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.error('❌ Firebase init failed:', err.message);
  process.exit(1);
}

const db = admin.firestore();
const col = db.collection('internships');

// Schema mapping: dataset → Firestore
function mapRecord(record) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  return {
    title: record.title || '',
    company: record.company || '',
    image: record.imageUrl || '',
    field: '',
    category: record.category || '',
    opportunityType: record.opportunityType || 'advertised_internship',
    city: record.location || '',
    region: '',
    area: record.specificArea || '',
    workMode: record.workMode || '',
    duration: record.duration || '',
    stipend: '',
    description: record.description || '',
    requirements: Array.isArray(record.requirements) ? record.requirements.join('\n') : (record.requirements || ''),
    responsibilities: Array.isArray(record.responsibilities) ? record.responsibilities.join('\n') : (record.responsibilities || ''),
    additionalInfo: record.additionalInfo || '',
    applicationUrl: record.applicationUrl || '',
    sourceUrl: record.sourceUrl || '',
    deadline: record.deadline || null,
    contactEmail: record.contactEmail || '',
    contactPhone: record.contactPhone || '',
    verified: false,
    published: true,
    featured: false,
    status: 'published',
    views: 0,
    saves: 0,
    clicks: 0,
    createdBy: 'seed-script',
    sourceSuggestionId: '',
    createdAt: now,
    publishedAt: now,
    verifiedAt: null,
    updatedAt: now
  };
}

async function seed() {
  console.log(`\n🌱 Seeding ${dataset.length} internship records...\n`);
  
  const batch = db.batch();
  let inserted = 0;
  let skipped = 0;
  
  for (const record of dataset) {
    const docId = record.id;
    const docRef = col.doc(docId);
    
    // Check if exists
    const existing = await docRef.get();
    if (existing.exists) {
      console.log(`⏭️  Skip ${docId} (already exists)`);
      skipped++;
      continue;
    }
    
    const mapped = mapRecord(record);
    batch.set(docRef, mapped);
    inserted++;
    console.log(`✓ Queue ${docId}: ${record.title.substring(0, 50)}...`);
  }
  
  if (inserted > 0) {
    console.log(`\n💾 Committing ${inserted} records to Firestore...`);
    await batch.commit();
    console.log(`\n✅ Successfully inserted ${inserted} records!`);
  }
  
  if (skipped > 0) {
    console.log(`ℹ️  Skipped ${skipped} existing records`);
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${dataset.length}`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Advertised: ${dataset.filter(r => r.opportunityType === 'advertised_internship').length}`);
  console.log(`   Potential: ${dataset.filter(r => r.opportunityType === 'potential_placement').length}`);
  console.log(`\n✨ Done! Refresh your Browse page.\n`);
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
