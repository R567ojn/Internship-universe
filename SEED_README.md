# Internship Data Seeding

## Overview
This script inserts 27 researched internship records (R01–R27) into the Firestore `internships` collection.

## Prerequisites

1. **Node.js** installed (v14+ recommended)
2. **Firebase Admin SDK** service account key

## Setup

### 1. Install dependencies
```bash
npm install firebase-admin
```

### 2. Get Firebase service account key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **internship-274f9**
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Save the downloaded JSON file as `serviceAccountKey.json` in the project root
6. **NEVER commit this file to git** (it's in .gitignore)

### 3. Verify files are in place
- `seed-internships.js` — seed script
- `internships_datase.json` — 27 records dataset
- `serviceAccountKey.json` — Firebase admin credentials (YOU must download this)

## Running the Seed

```bash
node seed-internships.js
```

The script is **idempotent** — it will skip records that already exist (by document ID R01–R27).

## What Gets Inserted

- **27 records total**
  - 12 advertised internships (R01–R12)
  - 15 potential placements (R13–R27)
- **New fields added to schema:**
  - `category` — research classification (e.g., "Telecommunications", "Banking & Finance")
  - `opportunityType` — "advertised_internship" | "potential_placement"
  - `additionalInfo` — caution text for potential placements
- **All records:**
  - `verified: false` (truthfulness requirement)
  - `published: true` (visible to students)
  - `featured: false`

## Schema Mapping

| Dataset Field | Firestore Field | Notes |
|---------------|-----------------|-------|
| `location` | `city` | City name |
| `specificArea` | `area` | Neighbourhood/area |
| `imageUrl` | `image` | Public Unsplash CDN URL |
| `requirements[]` | `requirements` | Array converted to newline-separated string |
| `responsibilities[]` | `responsibilities` | Array converted to newline-separated string |
| `category` | `category` | NEW FIELD |
| `opportunityType` | `opportunityType` | NEW FIELD |
| `additionalInfo` | `additionalInfo` | NEW FIELD |

## Post-Seed Verification

After seeding, verify in the app:

1. Browse page shows all 27 cards with images
2. Details page displays opportunityType badge (Advertised/Potential)
3. Potential placements show "Important notice" section with caution text
4. Search works by title/company/category/location
5. Category and location filters include new values
6. No console errors

## Rollback

To remove seeded records:

```bash
# Firebase Console → Firestore → internships collection
# Delete documents: R01, R02, ..., R27
```

Or use Firebase CLI:
```bash
firebase firestore:delete /internships/R01 --project internship-274f9
# Repeat for R02–R27
```

## Files Modified

- `assets/js/services/internships.js` — Added 3 fields to normalize()
- `assets/js/lib/rows.js` — Added opportunityType badge rendering
- `internship.html` — Added additionalInfo display section
- `assets/css/ui.css` — Added .bdg-info badge style
- `seed-internships.js` — NEW seed script
- `internships_datase.json` — Dataset (already exists)
