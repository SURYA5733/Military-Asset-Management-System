import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/axios';
import { Filters } from '../components/Filters';
import { NetMovementModal } from '../components/NetMovementModal';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

const KPI_META = {
  openingBalance: { label: 'Opening Balance', accent: 'text-slate-300',   bar: 'bg-slate-500' },
  closingBalance: { label: 'Closing Balance', accent: 'text-slate-100',   bar: 'bg-slate-300' },
  netMovement:    { label: 'Net Movement',    accent: 'text-cyan-300',    bar: 'bg-cyan-400', clickable: true },
  purchases:      { label: 'Purchases',       accent: 'text-emerald-300', bar: 'bg-emerald-400' },
  transfersIn:    { label: 'Transfers In',    accent: 'text-teal-300',    bar: 'bg-teal-400' },
  transfersOut:   { label: 'Transfers Out',   accent: 'text-orange-300',  bar: 'bg-orange-400' },
  assigned:       { label: 'Assigned',        accent: 'text-amber-300',   bar: 'bg-amber-400' },
  expended:       { label: 'Expended',        accent: 'text-red-300',     bar: 'bg-red-400' },
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const color = payload[0].payload.fill;
  return (
    <div className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      <div className="text-slate-100 text-sm font-medium tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(user?.baseId ? { baseId: user.baseId } : {});
  const [modalOpen, setModalOpen] = useState(false);

  const params = {};
  if (filters.baseId) params.baseId = filters.baseId;
  if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['metrics', params],
    queryFn: async () => (await api.get('/api/dashboard/metrics', { params })).data,
  });

  const chartData = data
    ? [
        { name: 'Purchases',     value: data.purchases,     fill: '#34d399' },
        { name: 'Transfers In',  value: data.transfersIn,   fill: '#2dd4bf' },
        { name: 'Transfers Out', value: data.transfersOut,  fill: '#fb923c' },
        { name: 'Assigned',      value: data.assigned,      fill: '#fbbf24' },
        { name: 'Expended',      value: data.expended,      fill: '#f87171' },
      ]
    : [];

  const totalActivity = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Command Dashboard"
        subtitle="Live asset flow across purchases, transfers, assignments, and expenditures."
        actions={
          isFetching && !isLoading ? (
            <div className="text-xs text-cyan-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              refreshing
            </div>
          ) : null
        }
      />

      <Filters value={filters} onChange={setFilters} />

      {/* KPI grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(KPI_META).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={meta.clickable ? () => setModalOpen(true) : undefined}
              className={`card text-left relative overflow-hidden min-h-[96px]
                ${meta.clickable ? 'cursor-pointer hover:border-cyan-500/40 transition-colors' : 'cursor-default'}`}
            >
              <div className={`absolute left-0 top-0 h-full w-1 ${meta.bar} opacity-70`} />
              <div className="pl-3">
                <div className="kpi-label">{meta.label}</div>
                <div className={`kpi-value mt-2 ${meta.accent}`}>
                  {data?.[key]?.toLocaleString() ?? 0}
                </div>
                {meta.clickable && (
                  <div className="text-[10px] text-cyan-400/80 mt-2 uppercase tracking-wider">
                    View detail →
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chart + stat strip */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500">Flow</div>
            <div className="text-slate-100 font-medium">Activity breakdown</div>
          </div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            Total · <span className="text-slate-200 font-mono tabular-nums">{totalActivity.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#334155"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={{ stroke: '#1e293b' }}
              />
              <YAxis
                stroke="#334155"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={{ stroke: '#1e293b' }}
                width={48}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'rgba(34,211,238,0.06)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stat strip — every value readable */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 pt-4 border-t border-slate-800">
          {chartData.map((d) => (
            <div
              key={d.name}
              className="text-center rounded-md border border-slate-800/60 bg-slate-950/40 px-2 py-3"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: d.fill }}
                />
                <span className="text-[10px] uppercase tracking-wider text-slate-500 truncate">
                  {d.name}
                </span>
              </div>
              <div className="text-sm font-mono tabular-nums text-slate-100">
                {d.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <NetMovementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        filters={filters}
      />
    </div>
  );
}