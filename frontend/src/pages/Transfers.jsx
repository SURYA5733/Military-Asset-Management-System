import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export function Transfers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    fromBaseId: user?.baseId ?? '', toBaseId: '', equipmentTypeId: '', quantity: 1,
  });
  const [msg, setMsg] = useState('');

  const { data: bases } = useQuery({ queryKey: ['bases'], queryFn: async () => (await api.get('/api/bases')).data });
  const { data: types } = useQuery({ queryKey: ['types'], queryFn: async () => (await api.get('/api/equipment-types')).data });
  const { data: rows } = useQuery({ queryKey: ['transfers'], queryFn: async () => (await api.get('/api/transfers')).data });

  const create = useMutation({
    mutationFn: async () => (await api.post('/api/transfers', form)).data,
    onSuccess: () => {
      setMsg('Transfer recorded.');
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
    },
    onError: (e) => setMsg(e.response?.data?.error ?? 'Failed'),
  });

  const submit = (e) => { e.preventDefault(); setMsg(''); create.mutate(); };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Transfers</h1>
      <form onSubmit={submit} className="card grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <div>
          <label className="label">From Base</label>
          <select className="input" value={form.fromBaseId}
            onChange={(e) => setForm({ ...form, fromBaseId: e.target.value })}
            disabled={user?.role !== 'ADMIN'}>
            <option value="">Select…</option>
            {bases?.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">To Base</label>
          <select className="input" value={form.toBaseId}
            onChange={(e) => setForm({ ...form, toBaseId: e.target.value })}>
            <option value="">Select…</option>
            {bases?.filter((b) => b._id !== form.fromBaseId).map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
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
          <button className="btn btn-primary w-full"
            disabled={create.isPending || !form.fromBaseId || !form.toBaseId || !form.equipmentTypeId}>
            {create.isPending ? 'Saving…' : 'Transfer'}
          </button>
        </div>
        {msg && <p className="md:col-span-5 text-sm text-military-700">{msg}</p>}
      </form>

      <div className="card overflow-auto">
        <h2 className="font-semibold mb-3">Transfer History</h2>
        <table className="w-full text-sm">
          <thead className="bg-military-100">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Base</th>
              <th className="p-2 text-left">Counterparty</th>
              <th className="p-2 text-left">Equipment</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-left">By</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2">
                  <span className={r.type === 'TRANSFER_IN' ? 'text-emerald-700' : 'text-orange-700'}>
                    {r.type === 'TRANSFER_IN' ? '↓ In' : '↑ Out'}
                  </span>
                </td>
                <td className="p-2">{r.base?.name}</td>
                <td className="p-2">{r.counterpartyBase?.name ?? '—'}</td>
                <td className="p-2">{r.equipmentType?.name}</td>
                <td className="p-2 text-right font-mono">{r.quantity}</td>
                <td className="p-2">{r.createdBy?.username}</td>
              </tr>
            ))}
            {rows?.length === 0 && <tr><td className="p-4 text-military-500" colSpan={7}>No transfers.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}