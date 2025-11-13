/**
 * ONE-TIME MIGRATION: add `langKey` to each link doc.
 * langKey is a stable, human-friendly key derived from langEn/langTh.
 * We DO NOT delete existing `language` or `iso3`; we just add `langKey`.
 *
 * HOW TO RUN:
 *   node scripts/migrate-add-langKey.cjs
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ==== EDIT ME (your admin uid + service account) ====
const ADMIN_UID = 'j0BVvzbBDOPXvJqW0UOTwCnh4952';
const serviceAccount = require('./serviceAccountKey.json');
// =====================================================

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function normalizeLangKey(en, th, fallback) {
  // Prefer English name as the base; fall back to Thai; else provided fallback; else 'unknown'
  const source = (en || th || fallback || 'unknown').toString().trim().toLowerCase();
  return (
    source
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9ก-๙]+/g, '-') // keep Thai letters; collapse others to '-'
      .replace(/^-+|-+$/g, '') || 'unknown'
  );
}

async function run() {
  const col = db.collection('users').doc(ADMIN_UID).collection('links');
  const snap = await col.get();
  console.log(`Found ${snap.size} docs to check...`);

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const langEn = data.langEn || '';
    const langTh = data.langTh || '';
    const iso3 = (data.iso3 || data.language || '').toString().trim();

    const langKey = data.langKey || normalizeLangKey(langEn, langTh, iso3);
    if (data.langKey === langKey) continue;

    await doc.ref.set({ langKey }, { merge: true });
    updated++;
  }

  console.log(`Done. Updated ${updated} doc(s) with langKey.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
