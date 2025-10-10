
import React from "react";
import { t, Lang } from "./i18n";
import { db, auth } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

type LinkRow = { name:string; language:string; url:string };

export default function ImportExport({ lang }:{ lang:Lang }) {
  const i = t(lang);

  const importJSON = async (file:File) => {
    const text = await file.text();
    const rows:LinkRow[] = JSON.parse(text);
    await writeRows(rows);
  };

  const importCSV = async (file:File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows:LinkRow[] = [];
    for (const line of lines) {
      const [name, language, url] = line.split(",").map(s=>s.trim());
      if (name && language && url) rows.push({ name, language, url });
    }
    await writeRows(rows);
  };

  const writeRows = async (rows:LinkRow[]) => {
    if (!auth.currentUser) return;
    const col = collection(db, "users", auth.currentUser.uid, "links");
    for (const r of rows) {
      if (!r.url?.startsWith("https://")) continue;
      await addDoc(col, r);
    }
    alert("Imported " + rows.length + " rows.");
  };

  const exportJSON = async () => {
    if (!auth.currentUser) return;
    const col = collection(db, "users", auth.currentUser.uid, "links");
    const snap = await getDocs(col);
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "thai-good-news-links.json";
    a.click();
  };

  return (
    <div className="p-3 flex flex-col gap-3 text-sm">
      <div>
        <label className="underline cursor-pointer">
          {i.importJSON}
          <input type="file" accept="application/json" className="hidden" onChange={e=>e.target.files && importJSON(e.target.files[0])} />
        </label>
      </div>
      <div>
        <label className="underline cursor-pointer">
          {i.importCSV}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={e=>e.target.files && importCSV(e.target.files[0])} />
        </label>
      </div>
      <div>
        <button className="linklike" onClick={exportJSON}>{i.exportJSON}</button>
      </div>
    </div>
  );
}
