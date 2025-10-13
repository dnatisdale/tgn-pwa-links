import React from "react";
import { t, Lang } from "../i18n";

export default function ImportPage({ lang }: { lang: Lang }) {
  const L = t(lang);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">{L.importOnly ?? "Import"}</h2>

      <div className="file-row" style={{marginTop:12}}>
        <label className="btn btn-red" htmlFor="file">{L.chooseFile ?? "Choose file"}</label>
        <input id="file" type="file" accept=".csv,.tsv,.json" style={{ display:"none" }}
          onChange={(e)=> {
            const file = e.target.files?.[0];
            if (!file) return;
            // call your existing import handler here:
            // importFromFile(file)
            alert(`Selected: ${file.name}`);
          }}
        />
        <span className="pill-red">(CSV / TSV / JSON)</span>
      </div>
    </section>
  );
}
