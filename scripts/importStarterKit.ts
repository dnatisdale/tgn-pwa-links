import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import starter from './starter-kit.json';

const ADMIN_UID = 'j0BVvzbBDOPXvJqW0UOTwCnh4952';

initializeApp({
  credential: cert(require('./serviceAccountKey.json'))
});

const db = getFirestore();

async function run() {
  const batch = db.batch();

  (starter as any[]).forEach((row: any, index: number) => {
    const { id, ...data } = row;
    const docId = id || `starter-${index}`;

    const ref = db
      .collection('users')
      .doc(ADMIN_UID)
      .collection('links')
      .doc(docId);

    batch.set(
      ref,
      {
        ...data,
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });

  await batch.commit();
  console.log('Starter kit imported.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
