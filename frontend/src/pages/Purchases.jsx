import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { Filters } from '../components/Filters';
import { useAuth } from '../context/AuthContext';

export function Purchases() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filters, setFilters] = useState(user?.baseId ? { baseId: user.baseId } : {});
  const [form, setForm] = useState({ baseId: user?.baseId ?? '', equipmentTypeId: '', quantity: 1 });
  const [msg, setMsg] = useState('');

  const { data: bases } = useQuery({ queryKey: ['bases'], queryFn: async () => (await api.get('/api/bases')).data });
  const { data: types } = useQuery({ queryKey: ['types'], queryFn: async () => (await api.get('/api/equipment-types')).data });

  const params = {};
  if (filters.baseId) params.baseId = filters.baseId;
  if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;

  const { data: rows } = useQuery({
    queryKey: ['purchases', params],
    queryFn: async () => (await api.get('/api/purchases', { params })).data,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post('/api/purchases', form)).data,
    onSuccess: () => {
      setMsg('Purchase recorded.');
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
    },
    onError: (e) => setMsg(e.response?.data?.error ?? 'Failed'),
  });

  const submit = (e) => { e.preventDefault(); setMsg(''); create.mutate(); };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Purchases</h1>
      <form onSubmit={submit} className="card grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div>
          <label className="label">Base</label>
          <select className="input" value={form.baseId}
            onChange={(e) => setForm({ ...form, baseId: e.target.value })}
            disabled={user?.role !== 'ADMIN'}>
            <option value="">Select…</option>
            {bases?.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Equipment</label>
          <select className="input" value={form.equipmentTypeId}
            onChange={(e) => setForm({ ...form, equipmentTypeId: e.target.value })}>
            <option value="">Select…</option>
            {types?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Quantity</label>
          <input type="number" min={1} className="input" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        </div>
        <div className="flex items-end">
          <button className="btn btn-primary w-full" disabled={create.isPending || !form.baseId || !form.equipmentTypeId}>
            {create.isPending ? 'Saving…' : 'Record Purchase'}
          </button>
        </div>
        {msg && <p className="md:col-span-4 text-sm text-military-700">{msg}</p>}
      </form>
      <Filters value={filters} onChange={setFilters} />
      <div className="card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-military-100">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Base</th>
              <th className="p-2 text-left">Equipment</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-left">By</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2">{r.base?.name}</td>
                <td className="p-2">{r.equipmentType?.name}</td>
                <td className="p-2 text-right font-mono">{r.quantity}</td>
                <td className="p-2">{r.createdBy?.username}</td>
              </tr>
            ))}
            {rows?.length === 0 && <tr><td className="p-4 text-military-500" colSpan={5}>No purchases.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}