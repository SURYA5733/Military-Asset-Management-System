import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { PageHeader } from '../components/PageHeader';

const ROLE_OPTIONS = [
  { value: 'ADMIN',             label: 'Admin' },
  { value: 'BASE_COMMANDER',    label: 'Base Commander' },
  { value: 'LOGISTICS_OFFICER', label: 'Logistics Officer' },
];

function roleBadge(role) {
  const map = {
    ADMIN: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
    BASE_COMMANDER: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
    LOGISTICS_OFFICER: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  };
  return map[role] ?? 'text-slate-300 border-slate-600 bg-slate-700/30';
}

export function Users() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [resetFor, setResetFor] = useState(null);

  const { data: bases } = useQuery({
    queryKey: ['bases'],
    queryFn: async () => (await api.get('/api/bases')).data,
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/api/users')).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const createUser = useMutation({
    mutationFn: async (payload) => (await api.post('/api/users', payload)).data,
    onSuccess: () => {
      setMsg({ type: 'ok', text: 'User created.' });
      setShowCreate(false);
      invalidate();
    },
    onError: (e) => setMsg({ type: 'err', text: e.response?.data?.error ?? 'Failed' }),
  });

  const patchUser = useMutation({
    mutationFn: async ({ id, payload }) => (await api.patch(`/api/users/${id}`, payload)).data,
    onSuccess: () => { setMsg({ type: 'ok', text: 'User updated.' }); invalidate(); },
    onError: (e) => setMsg({ type: 'err', text: e.response?.data?.error ?? 'Failed' }),
  });

  const resetPassword = useMutation({
    mutationFn: async ({ id, password }) => (await api.post(`/api/users/${id}/password`, { password })).data,
    onSuccess: () => { setMsg({ type: 'ok', text: 'Password reset.' }); setResetFor(null); },
    onError: (e) => setMsg({ type: 'err', text: e.response?.data?.error ?? 'Failed' }),
  });

  const deleteUser = useMutation({
    mutationFn: async (id) => (await api.delete(`/api/users/${id}`)).data,
    onSuccess: () => { setMsg({ type: 'ok', text: 'User deleted.' }); invalidate(); },
    onError: (e) => setMsg({ type: 'err', text: e.response?.data?.error ?? 'Failed' }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        subtitle="Create and manage platform accounts."
        actions={
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New user
          </button>
        }
      />

      {msg.text && (
        <div className={`text-sm rounded-md border px-3 py-2
          ${msg.type === 'ok'
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/40 bg-red-500/10 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Username</th>
              <th className="text-left px-5 py-3 font-medium">Role</th>
              <th className="text-left px-5 py-3 font-medium">Base</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Created</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {isLoading && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Loading…</td></tr>
            )}
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/30">
                <td className="px-5 py-2.5 text-slate-100 font-medium">{u.username}</td>
                <td className="px-5 py-2.5">
                  <span className={`badge ${roleBadge(u.role)}`}>{u.role}</span>
                </td>
                <td className="px-5 py-2.5 text-slate-300">{u.baseName ?? '—'}</td>
                <td className="px-5 py-2.5">
                  <span className={`badge ${u.isActive ? 'badge-in' : 'badge-out'}`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-secondary text-xs"
                      onClick={() => setResetFor(u)}
                    >
                      Reset password
                    </button>
                    <button
                      className="btn btn-secondary text-xs"
                      onClick={() =>
                        patchUser.mutate({ id: u.id, payload: { isActive: !u.isActive } })
                      }
                    >
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="btn btn-danger text-xs"
                      onClick={() => {
                        if (confirm(`Delete ${u.username}? This cannot be undone.`))
                          deleteUser.mutate(u.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && users?.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateUserModal
          bases={bases ?? []}
          onClose={() => setShowCreate(false)}
          onSubmit={(payload) => createUser.mutate(payload)}
          submitting={createUser.isPending}
        />
      )}

      {resetFor && (
        <ResetPasswordModal
          user={resetFor}
          onClose={() => setResetFor(null)}
          onSubmit={(password) => resetPassword.mutate({ id: resetFor.id, password })}
          submitting={resetPassword.isPending}
        />
      )}
    </div>
  );
}

/* ---------- Modals ---------- */

function CreateUserModal({ bases, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'BASE_COMMANDER',
    baseId: bases[0]?._id ?? '',
  });
  const [err, setErr] = useState('');

  const needsBase = form.role !== 'ADMIN';

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    if (form.username.trim().length < 3) return setErr('Username must be at least 3 characters');
    if (form.password.length < 8) return setErr('Password must be at least 8 characters');
    if (needsBase && !form.baseId) return setErr('Select a base');

    onSubmit({
      username: form.username.trim(),
      password: form.password,
      role: form.role,
      baseId: needsBase ? form.baseId : null,
    });
  };

  return (
    <ModalShell title="New user" onClose={onClose}>
      <form onSubmit={submit} className="p-5 space-y-4">
        {err && (
          <div className="text-sm rounded-md border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-2">
            {err}
          </div>
        )}

        <div>
          <label className="label">Username</label>
          <input
            className="input"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoFocus
            placeholder="e.g. cmd.charlie"
          />
        </div>

        <div>
          <label className="label">Password (min 8 chars)</label>
          <input
            type="text"
            className="input font-mono"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="temp password"
          />
        </div>

        <div>
          <label className="label">Role</label>
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {needsBase && (
          <div>
            <label className="label">Base</label>
            <select
              className="input"
              value={form.baseId}
              onChange={(e) => setForm({ ...form, baseId: e.target.value })}
            >
              <option value="">Select…</option>
              {bases.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 divider">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({ user, onClose, onSubmit, submitting }) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    if (password.length < 8) return setErr('Password must be at least 8 characters');
    onSubmit(password);
  };

  return (
    <ModalShell title={`Reset password — ${user.username}`} onClose={onClose}>
      <form onSubmit={submit} className="p-5 space-y-4">
        {err && (
          <div className="text-sm rounded-md border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-2">
            {err}
          </div>
        )}
        <div>
          <label className="label">New password</label>
          <input
            type="text"
            className="input font-mono"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 divider">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Set password'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="text-slate-100 font-medium">{title}</div>
          <button className="text-slate-500 hover:text-slate-300" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}