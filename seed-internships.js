/**
 * SEED SCRIPT — Insert 27 researched internship records into Firestore
 * Run once: node seed-internships.js
 * Idempotent: uses record IDs as document IDs (R01–R27)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account key
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found!');
  console.error('Download it from Firebase Console and place it in the project root.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
const dataset = require('./internships_datase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'internship-274f9'
});

const db = admin.firestore();
const col = db.collection('internships');

// Schema mapping: dataset → Firestore
function mapRecord(record) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  return {
    // Core fields
    title: record.title || '',
    company: record.company || '',
    image: record.imageUrl || '', // dataset imageUrl → project image
    
    // Category & classification
    field: '', // Not in dataset; leave empty (Browse derives vocab from data)
    category: record.category || '', // NEW FIELD — add to schema
    opportunityType: record.opportunityType || 'advertised_internship', // NEW FIELD
    
    // Location
    city: record.location || '', // dataset location → project city
    region: '', // Not in dataset
    area: record.specificArea || '', // dataset specificArea → project area
    
    // Work details
    workMode: record.workMode || '',
    duration: record.duration || '',
    stipend: '', // Not in dataset
    
    // Content
    description: record.description || '',
    requirements: Array.isArray(record.requirements) ? record.requirements.join('\n') : (record.requirements || ''),
    responsibilities: Array.isArray(record.responsibilities) ? record.responsibilities.join('\n') : (record.responsibilities || ''),
    additionalInfo: record.additionalInfo || '', // NEW FIELD — for caution text
    
    // Links
    applicationUrl: record.applicationUrl || '',
    sourceUrl: record.sourceUrl || '',
    
    // Deadline & contact
    deadline: record.deadline || null,
    contactEmail: record.contactEmail || '',
    contactPhone: record.contactPhone || '',
    
    // Publishing status
    verified: false, // All records: verified=false (per truthfulness rules)
    published: true, // All records: published=true (make them visible)
    featured: false,
    status: 'published',
    
    // Metadata
    views: 0,
    saves: 0,
    clicks: 0,
    createdBy: 'seed-script',
    sourceSuggestionId: '',
    
    // Timestamps
    createdAt: now,
    publishedAt: now,
    verifiedAt: null,
    updatedAt: now
  };
}

async function seed() {
  console.log(`🌱 Seeding ${dataset.length} internship records...`);
  
  const batch = db.batch();
  let inserted = 0;
  let skipped = 0;
  
  for (const record of dataset) {
    const docId = record.id; // Use R01–R27 as document IDs (idempotent)
    const docRef = col.doc(docId);
    
    // Check if document already exists (idempotent check)
    const existing = await docRef.get();
    if (existing.exists) {
      console.log(`⏭️  Skipping ${docId} — already exists`);
      skipped++;
      continue;
    }
    
    const mapped = mapRecord(record);
    batch.set(docRef, mapped);
    inserted++;
    console.log(`✓ Queued ${docId}: ${record.title.substring(0, 60)}...`);
  }
  
  if (inserted > 0) {
    await batch.commit();
    console.log(`\n✅ Successfully inserted ${inserted} records`);
  }
  
  if (skipped > 0) {
    console.log(`ℹ️  Skipped ${skipped} existing records`);
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   - Total records: ${dataset.length}`);
  console.log(`   - Inserted: ${inserted}`);
  console.log(`   - Skipped (already exist): ${skipped}`);
  console.log(`   - Advertised internships: ${dataset.filter(r => r.opportunityType === 'advertised_internship').length}`);
  console.log(`   - Potential placements: ${dataset.filter(r => r.opportunityType === 'potential_placement').length}`);
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
