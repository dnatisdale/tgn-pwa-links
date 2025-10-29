import React from 'react';
import { useI18n } from './i18n-provider';

type Row = { id: string; name: string; language: string; url: string };

export default function ExportPage({ rows }: { rows: Row[] }) {
  const { t } = useI18n();

  const download = (filename: string, text: string, mime = 'text/plain') => {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toCSV = () => {
    const head = 'name,language,url\n';
    const body = rows
      .map((r) =>
        [r.name ?? '', r.language ?? '', r.url ?? '']
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    download('tgn-links.csv', head + body, 'text/csv');
  };
  const toJSON = () =>
    download('tgn-links.json', JSON.stringify(rows, null, 2), 'application/json');
  const doPrint = () => window.print();

  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-semibold mb-3">{t('export')}</h2>
      <div className="flex items-center gap-3 mb-3">
        <button className="btn btn-blue" onClick={toCSV}>
          {t('exportCsv')}
        </button>
        <button className="btn btn-blue" onClick={toJSON}>
          {t('exportJson')}
        </button>
        <button className="btn btn-red" onClick={doPrint}>
          {t('print')}
        </button>
      </div>
      <div className="text-sm" style={{ color: '#6b7280' }}>
        {t('tipExportsFiltered')}
      </div>
    </div>
  );
}
