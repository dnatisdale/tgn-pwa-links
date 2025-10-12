// src/Export.tsx
import React, { useEffect, useState } from "react";
import { t, Lang } from "./i18n";
import { auth, db } from "./firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

type Row = { id: string; name?: string; language?: string; url?: string };

export default function ExportPage({ lang }: { lang: Lang }) {
  const i = t(lang);
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setMsg("");
      if (!auth.currentUser) { setMsg("Not signed in."); return; }
      try {
        const col = collection(db, "users", auth.currentUser.uid, "links");
        const qry = query(col, orderBy("name"));
        const snap = await getDocs(qry);
        const list: Row[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (mounted) setRows(list);
      } catch (e:any) {
        if (mounted) setMsg(e.message || String(e));
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  function exportCSV() {
    const head = ["name", "language", "url"];
    const body = rows.map(r =>
      [r.name || "", r.language || "", r.url || ""]
        .map(v => `"${(v || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [head.join(","), ...body].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "links.csv";
    a.click();
  }

  function exportJSON() {
    const data = rows.map(({ id, ...rest }) => rest);
    const a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    a.download = "links.json";
    a.click();
  }

  async function exportPDF() {
    try {
      const { jsPDF } = await import("jspdf");
      const auto = await import("jspdf-autotable");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const head = [["Name", "Language", "URL"]];
      const data = rows.map(r => [r.name || "", r.language || "", r.url || ""]);

      // @ts-ignore (types come from plugin)
      (auto as any).autoTable(doc, { head, body: data, styles: { fontSize: 9, cellPadding: 6 } });

      doc.save("links.pdf");
    } catch (e:any) {
      alert("PDF export failed: " + (e.message || String(e)));
    }
  }

  function doPrint() {
    // Simple print: render a minimal window
    const html = `
<html>
  <head><title>Links</title></head>
  <body>
    <h3>Links</h3>
    <table border="1" cellspacing="0" cellpadding="6">
      <thead>
        <tr><th align="left">Name</th><th align="left">Language</th><th align="left">URL</th></tr>
      </thead>
      <tbody>
        ${rows.map(r => `<tr>
          <td>${escapeHtml(r.name || "")}</td>
          <td>${escapeHtml(r.language || "")}</td>
          <td>${escapeHtml(r.url || "")}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </body>
</html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  function escapeHtml(s: string) {
    return s.replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c] as string));
  }

  return (
    <div className="max-w-3xl p-3">
      <h2 className="text-lg font-semibold mb-2">{i.importExport} — Export</h2>

      <div className="flex flex-wrap gap-10 mb-3">
        <button className="btn-blue" onClick={exportCSV}>Export CSV</button>
        <button className="btn-blue" onClick={exportJSON}>Export JSON</button>
        <button className="btn-blue" onClick={exportPDF}>Download PDF</button>
        <button className="btn-blue" onClick={doPrint}>Print</button>
      </div>

      {msg && <div className="text-sm">{msg}</div>}

      <div className="text-sm" style={{ color: "#6b7280" }}>
        {rows.length} item(s) loaded. Exports include all links under your account.
      </div>
    </div>
  );
}
