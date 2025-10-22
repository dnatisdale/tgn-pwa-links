// src/Export.tsx
import React from "react";
import { t, Lang } from "./i18n";

type Row = { id: string; name: string; language: string; url: string };

export default function ExportPage({
  lang,
  rows,
}: {
  lang: Lang;
  rows: Row[];
}) {
  const i = t(lang);

  const download = (filename: string, text: string, mime = "text/plain") => {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
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
    download(
      "tgn-links.json",
      JSON.stringify(rows, null, 2),
      "application/json"
    );
  };

  const doPrint = () => window.print();

  return (
    <div className="max-w-3xl">
      {/* ✅ Export only (no “Import / Export”) */}
      <h2 className="text-lg font-semibold mb-3">
        {lang === "th" ? "ส่งออก" : "Export"}
      </h2>

      <div className="flex items-center gap-3 mb-4">
        <button className="btn btn-blue" onClick={toCSV}>
          {lang === "th" ? "ส่งออก CSV" : "Export CSV"}
        </button>
        <button className="btn btn-blue" onClick={toJSON}>
          {lang === "th" ? "ส่งออก JSON" : "Export JSON"}
        </button>
        {/* ✅ Thai-red Print button */}
        <button className="btn btn-red" onClick={doPrint}>
          {lang === "th" ? "พิมพ์" : "Print"}
        </button>
      </div>

      <div className="text-sm" style={{ color: "#6b7280" }}>
        {lang === "th"
          ? "เคล็ดลับ: การส่งออกจะรวมเฉพาะรายการในรายการของคุณตอนนี้เท่านั้น"
          : "Tip: Exports include only what’s currently in your list."}
      </div>
    </div>
  );
}
