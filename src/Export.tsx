import React from "react";
import { t, Lang } from "./i18n";

export type Row = {
  id: string;
  url: string;
  name?: string;
  lang?: string;
};

type Props = {
  lang: Lang;
  rows: Row[];
};

export default function ExportPage({ lang, rows }: Props) {
  const L = t(lang);

  const exportCSV = () => {
    const head = ["id","name","lang","url"];
    const body = rows.map(r => [r.id, r.name ?? "", r.lang ?? "", r.url]);
    const csv  = [head, ...body].map(r => r.map(x => `"${(x??"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    downloadText("export.csv", csv);
  };

  const exportJSON = () => {
    downloadText("export.json", JSON.stringify(rows, null, 2));
  };

  const printPage = () => window.print();

  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">{L.exportJSON?.replace("JSON","") || "Export"}</h2>

      {/* Buttons (uniform height) */}
      <div className="toolbar-row" style={{marginTop:8}}>
        <button className="btn btn-blue" onClick={exportCSV}>Export CSV</button>
        <button className="btn btn-blue" onClick={exportJSON}>Export JSON</button>
        <button className="btn btn-red"  onClick={printPage}>Print</button>
      </div>

      <p className="hint-under" style={{marginTop:10}}>
        Tip: Exports include only what's currently in your list.
      </p>
    </section>
  );
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
