// src/Export.tsx (Export-only page)
import React from "react";
import { strings, type Lang } from "./i18n";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Row = { name: string; language: string; url: string };
type Props = { lang: Lang; rows: Row[] };

export default function ExportPage({ lang, rows }: Props) {
  const t = strings[lang];

  function exportCSV() {
    const header = "name,language,url\n";
    const body = rows.map(r => [r.name, r.language, r.url].map(v => `"${(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tgn-export.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportPDF() {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Name", "Language", "URL"]],
      body: rows.map(r => [r.name, r.language, r.url]),
      styles: { fontSize: 10, cellWidth: "wrap" },
      columnStyles: { 2: { cellWidth: 90 } }
    });
    doc.save("tgn-export.pdf");
  }

  function doPrint() {
    window.print();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">{t.export}</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <button className="btn btn-white" onClick={exportCSV}>CSV</button>
        <button className="btn btn-white" onClick={exportPDF}>PDF</button>
        <button className="btn print-red" onClick={doPrint}>{t.print}</button>
      </div>

      <div className="border rounded-lg overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Language</th>
              <th className="text-left p-2">URL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.language}</td>
                <td className="p-2 break-all">{r.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
