// src/ImportExport.tsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, auth } from "./firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { t, Lang } from "./i18n";

type Row = { id: string; name: string; language: string; url: string };

// Build-time constants (from vite.config.ts)
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIME__: string;

export default function ImportExport({ lang }: { lang: Lang }) {
  const i = t(lang);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    async function load() {
      const user = auth.currentUser;
      if (!user) return;
      const col = collection(db, "users", user.uid, "links");
      const qry = query(col, orderBy("name"));
      const snap = await getDocs(qry);
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      (r.name || "").toLowerCase().includes(needle) ||
      (r.language || "").toLowerCase().includes(needle) ||
      (r.url || "").toLowerCase().includes(needle)
    );
  }, [rows, q]);

  const exportCSV = () => {
    const header = ["name", "language", "url"];
    const lines = [header.join(",")].concat(
      filtered.map((r) =>
        [r.name ?? "", r.language ?? "", r.url ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "thai-good-news-links.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const title = "Thai Good News — Links";
      const meta = `${__APP_VERSION__} — ${__BUILD_DATE__} ${__BUILD_TIME__}`;
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(title, 40, 40);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(meta, 40, 57);
      const body = filtered.map(r => [r.name ?? "", r.language ?? "", r.url ?? ""]);
      (autoTable as any)(doc, {
        head: [["Name", "Language", "URL"]],
        body,
        startY: 74,
        styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
        headStyles: { fillColor: [15, 36, 84] },
        columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: 100 }, 2: { cellWidth: 250 } },
        margin: { left: 40, right: 40 },
        didDrawPage: () => {
          const pageW = doc.internal.pageSize.getWidth();
          const pageH = doc.internal.pageSize.getHeight();
          const page = doc.getNumberOfPages();
          doc.setFontSize(9);
          doc.text(`Page ${page}`, pageW - 80, pageH - 20);
        },
      });
      doc.save("thai-good-news-links.pdf");
    } catch (e) {
      console.error(e);
      alert("Sorry—couldn’t generate the PDF.");
    }
  };

  const printPage = () => window.print();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          className="border rounded px-2 py-1 min-w-[260px]"
          placeholder={i.searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="ml-auto flex items-center gap-3 text-sm">
          <button className="linklike" onClick={exportCSV}>Export CSV</button>
          <button className="linklike" onClick={downloadPDF}>Download PDF</button>
          <button className="linklike" onClick={printPage}>Print / PDF</button>
        </span>
      </div>

      {!filtered.length && (
        <div className="text-sm text-gray-600 mb-3">{i.empty}</div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Language</th>
            <th className="py-2">URL</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id} className="border-b">
              <td className="py-2 pr-3">{r.name}</td>
              <td className="py-2 pr-3">{r.language}</td>
              <td className="py-2">
                <a className="underline" href={r.url} target="_blank" rel="noreferrer">{r.url}</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
