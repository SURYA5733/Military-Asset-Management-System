import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(username, password);
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-slate-950 text-slate-200">
      {/* Left brand panel */}
      <div className="hidden md:flex flex-col justify-between p-10 relative overflow-hidden border-r border-slate-800">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-cyan-500/20 border border-cyan-500/40 grid place-items-center text-cyan-300 font-bold">M</div>
            <div>
              <div className="font-semibold tracking-wide text-slate-100 text-lg">MASS</div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500">Military Asset Management</div>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold text-slate-100 leading-tight">
            Command-grade visibility for every asset, every base.
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Track purchases, transfers, assignments, and expenditures with a ledger that never lies.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-xs">
            {[['Ledger', 'Immutable'], ['RBAC', 'Role-scoped'], ['Audit', 'Every write']].map(([k, v]) => (
              <div key={k} className="border border-slate-800 rounded-md p-3 bg-slate-900/40">
                <div className="text-slate-500 uppercase tracking-wider text-[10px]">{k}</div>
                <div className="text-slate-200 mt-1">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[11px] text-slate-600 tracking-wider uppercase">
          Restricted system · Authorized personnel only
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded bg-cyan-500/20 border border-cyan-500/40 grid place-items-center text-cyan-300 font-bold">M</div>
            <div>
              <div className="font-semibold text-slate-100">MASS</div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500">Military Asset Mgmt</div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-slate-100">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Use your command credentials to continue.</p>

          {error && (
            <div className="mb-4 text-sm rounded-md border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-2">
              {error}
            </div>
          )}

          <label className="label">Username</label>
          <input
            className="input mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />

          <label className="label">Password</label>
          <input
            type="password"
            className="input mb-6"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Authenticating…' : 'Sign in'}
          </button>

          <div className="mt-8 pt-6 divider">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">
              Demo accounts · password: Password123!
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['admin', 'ADMIN'],
                ['cmd.alpha', 'BASE COMMANDER'],
                ['log.alpha', 'LOGISTICS'],
                ['cmd.bravo', 'BASE COMMANDER'],
              ].map(([u, r]) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => { setUsername(u); setPassword('Password123!'); }}
                  className="text-left border border-slate-800 rounded-md p-2 hover:border-cyan-500/40 hover:bg-slate-900/60 transition"
                >
                  <div className="font-mono text-slate-200">{u}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{r}</div>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}