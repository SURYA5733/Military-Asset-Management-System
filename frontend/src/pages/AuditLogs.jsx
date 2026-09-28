import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';

export function AuditLogs() {
  const { data } = useQuery({ queryKey: ['audit'], queryFn: async () => (await api.get('/api/audit-logs')).data });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
      <div className="card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-military-100">
            <tr>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Method</th>
              <th className="p-2 text-left">Path</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">IP</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2">{r.user?.username ?? '—'}</td>
                <td className="p-2 font-mono">{r.method}</td>
                <td className="p-2 font-mono text-xs">{r.path}</td>
                <td className="p-2">{r.statusCode}</td>
                <td className="p-2 text-xs">{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}