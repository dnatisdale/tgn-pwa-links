// src/Export.tsx
import React from "react";
import { t, Lang } from "./i18n";

type Row = { id: string; name: string; language: string; url: string };

export default function ExportPage({ lang, rows }: { lang: Lang; rows: Row[] }) {
  const i = t(lang);

  const download = (filename: string, text: string, mime = "text/plain") => {
    const blob = new Blob([text], { type: mime + ";charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toCSV = () => {
    const head = "name,language,url\n";
    const body = rows
      .map((r) =>
        [r.name ?? "", r.language ?? "", r.url ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    download("tgn-links.csv", head + body, "text/csv");
  };

  const toJSON = () => {
    download("tgn-links.json", JSON.stringify(rows, null, 2), "application/json");
  };

  const doPrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl">
      {/* Title removed on purpose: App.tsx already renders the page title */}

      <div className="flex items-center gap-8 mb-4">
        <button className="btn btn-blue" onClick={toCSV}>
          {lang === "th" ? "ส่งออก CSV" : "Export CSV"}
        </button>

        <button className="btn btn-blue" onClick={toJSON}>
          {/* use i18n if you have it; fallback to English/Thai */}
          {i.exportJSON ?? (lang === "th" ? "ส่งออก JSON" : "Export JSON")}
        </button>

        <button className="btn btn-red" onClick={doPrint}>
          {lang === "th" ? "พิมพ์" : "Print"}
        </button>
      </div>

      <div className="text-sm" style={{ color: "#6b7280" }}>
        {lang === "th"
          ? "เคล็ดลับ: การส่งออกจะรวมเฉพาะสิ่งที่อยู่ในรายการของคุณตอนนี้"
          : "Tip: Exports include only what’s currently in your list."}
      </div>
    </div>
  );
}
