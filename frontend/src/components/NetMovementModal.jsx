import { useEffect, useState } from 'react';
import { api } from '../api/axios';

const TABS = [
  { key: 'purchases',    label: 'Purchases',    tone: 'emerald' },
  { key: 'transfersIn',  label: 'Transfers In', tone: 'teal' },
  { key: 'transfersOut', label: 'Transfers Out',tone: 'orange' },
];

const toneClass = {
  emerald: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  teal:    'text-teal-300 border-teal-500/40 bg-teal-500/10',
  orange:  'text-orange-300 border-orange-500/40 bg-orange-500/10',
};

export function NetMovementModal({ open, onClose, filters }) {
  const [tab, setTab] = useState('purchases');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const params = {};
    if (filters.baseId) params.baseId = filters.baseId;
    if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    setLoading(true);
    api.get('/api/dashboard/net-movement-detail', { params })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [open, filters]);

  if (!open) return null;
  const rows = data?.[tab] ?? [];
  const active = TABS.find((t) => t.key === tab);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500">
              Movement Detail
            </div>
            <div className="text-slate-100 font-medium">Net Movement Components</div>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b border-slate-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm rounded-t-md border-b-2 transition
                ${tab === t.key
                  ? `border-current ${toneClass[t.tone]}`
                  : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              {t.label}
              {data && (
                <span className="ml-2 text-[10px] font-mono opacity-70">
                  {data[t.key]?.length ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="table-head sticky top-0">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Date</th>
                <th className="text-left px-5 py-2 font-medium">Base</th>
                <th className="text-left px-5 py-2 font-medium">Equipment</th>
                <th className="text-right px-5 py-2 font-medium">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading && (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="px-5 py-2.5 text-slate-400 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-2.5 text-slate-200">{r.base?.name}</td>
                  <td className="px-5 py-2.5 text-slate-300">{r.equipmentType?.name}</td>
                  <td className={`px-5 py-2.5 text-right font-mono ${toneClass[active.tone].split(' ')[0]}`}>
                    {r.quantity.toLocaleString()}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500" colSpan={4}>
                    No records for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}