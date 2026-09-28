import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export function Filters({ value, onChange }) {
  const { user } = useAuth();
  const [bases, setBases] = useState([]);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    api.get('/api/bases').then((r) => setBases(r.data));
    api.get('/api/equipment-types').then((r) => setTypes(r.data));
  }, []);

  return (
    <div className="card grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
      <div>
        <label className="label">Base</label>
        <select className="input" value={value.baseId ?? ''}
          onChange={(e) => onChange({ ...value, baseId: e.target.value || undefined })}
          disabled={user?.role !== 'ADMIN'}>
          <option value="">All</option>
          {bases.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Equipment</label>
        <select className="input" value={value.equipmentTypeId ?? ''}
          onChange={(e) => onChange({ ...value, equipmentTypeId: e.target.value || undefined })}>
          <option value="">All</option>
          {types.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">From</label>
        <input type="date" className="input" value={value.from?.slice(0, 10) ?? ''}
          onChange={(e) => onChange({ ...value, from: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
      </div>
      <div>
        <label className="label">To</label>
        <input type="date" className="input" value={value.to?.slice(0, 10) ?? ''}
          onChange={(e) => onChange({ ...value, to: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : undefined })} />
      </div>
    </div>
  );
}