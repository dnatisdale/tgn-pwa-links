// src/AdminPanel.tsx

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './hooks/useAuth';
import { isAdminUser } from './adminConfig';

type AdminLink = {
  id: string;
  url: string;
  title?: string;
  language?: string;
  visible?: boolean;
};

export default function AdminPanel() {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user?.email || null);
  const [links, setLinks] = useState<AdminLink[]>([]);

  useEffect(() => {
    if (!user || !isAdmin) {
      setLinks([]);
      return;
    }

    const qy = query(collection(db, 'users', user.uid, 'links'), orderBy('createdAt', 'desc'));

    const off = onSnapshot(qy, (snap) => {
      const rows: AdminLink[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          url: data.url ?? '',
          title: data.title ?? '',
          language: data.language ?? '',
          visible: data.visible,
        };
      });
      setLinks(rows);
    });

    return () => off();
  }, [user, isAdmin]);

  if (!user || !isAdmin) {
    return <p className="text-center text-gray-500 mt-8">Admin access only.</p>;
  }

  if (!links.length) {
    return <p className="text-center text-gray-500 mt-8">No links found.</p>;
  }

  const toggleVisible = async (l: AdminLink) => {
    if (!user) return;
    const next = l.visible === false ? true : false;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'links', l.id), { visible: next });
    } catch (e) {
      console.error(e);
      alert('Failed to update visibility');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">Admin – Link Visibility</h1>
      <p className="text-sm text-gray-600 mb-4">
        Toggle which links appear on the Browse page. Hidden links stay in your account.
      </p>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left">Visible</th>
              <th className="px-2 py-2 text-left">Language</th>
              <th className="px-2 py-2 text-left">Title</th>
              <th className="px-2 py-2 text-left">URL</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="px-2 py-1">
                  <input
                    type="checkbox"
                    checked={l.visible !== false}
                    onChange={() => toggleVisible(l)}
                  />
                </td>
                <td className="px-2 py-1 whitespace-nowrap">{l.language || ''}</td>
                <td className="px-2 py-1 whitespace-nowrap">{l.title || ''}</td>
                <td className="px-2 py-1">
                  <a href={l.url} target="_blank" rel="noreferrer" className="underline break-all">
                    {l.url}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
