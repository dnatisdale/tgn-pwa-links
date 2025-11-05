import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';

type LinkDoc = {
  id: string;
  url: string;
  title?: string;
  tags?: string[];
  createdAt?: { seconds: number; nanoseconds: number };
};

export default function LinkList() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'links'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const rows: LinkDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LinkDoc, 'id'>),
      }));
      setLinks(rows);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (!user) return <p className="text-center text-gray-500">Sign in to view links.</p>;
  if (loading) return <p className="text-center text-gray-500">Loading links…</p>;
  if (links.length === 0) return <p className="text-center text-gray-500">No links yet.</p>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      {links.map((l) => (
        <div key={l.id} className="border rounded p-3">
          <div className="font-semibold">{l.title || '(no title)'}</div>
          <a href={l.url} target="_blank" rel="noreferrer" className="underline break-all">
            {l.url}
          </a>
          {l.tags && l.tags.length > 0 && (
            <div className="text-sm mt-1 opacity-80">tags: {l.tags.join(', ')}</div>
          )}
        </div>
      ))}
    </div>
  );
}
