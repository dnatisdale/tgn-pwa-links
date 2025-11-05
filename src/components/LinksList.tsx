import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';

type LinkDoc = {
  id: string;
  url: string;
  title?: string;
  tags?: string[];
  createdAt?: Timestamp | null; // handle missing while pending
};

export default function LinksList() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no user: clear list and stop
    if (!user) {
      setLinks([]);
      setLoading(false);
      return;
    }

    // newest first by createdAt
    const q = query(collection(db, 'users', user.uid, 'links'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: LinkDoc[] = snap.docs.map((d) => {
          const data = d.data() as Omit<LinkDoc, 'id'>;
          return {
            id: d.id,
            url: data.url,
            title: data.title ?? '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            createdAt: (data as any).createdAt ?? null,
          };
        });
        setLinks(rows);
        setLoading(false);
      },
      (err) => {
        console.error('onSnapshot error:', err);
        setLinks([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  if (!user) return <p className="text-center text-gray-500">Sign in to view links.</p>;
  if (loading) return <p className="text-center text-gray-500">Loading links…</p>;
  if (links.length === 0) return <p className="text-center text-gray-500">No links yet.</p>;

  const fmt = (ts?: Timestamp | null) => (ts ? new Date(ts.seconds * 1000).toLocaleString() : '');

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      {links.map((l) => (
        <div key={l.id} className="border rounded p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold truncate">{l.title || '(no title)'}</div>
            <div className="text-xs opacity-60 whitespace-nowrap">{fmt(l.createdAt)}</div>
          </div>

          <a href={l.url} target="_blank" rel="noreferrer" className="underline break-all">
            {l.url}
          </a>

          {l.tags && l.tags.length > 0 && (
            <div className="text-sm mt-2 flex flex-wrap gap-1">
              {l.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full border text-xs opacity-80">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
