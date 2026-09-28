import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const links = [
  { to: '/dashboard',    label: 'Dashboard',    icon: '▤', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
  { to: '/purchases',    label: 'Purchases',    icon: '＋', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
  { to: '/transfers',    label: 'Transfers',    icon: '⇄', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
  { to: '/assignments',  label: 'Assignments',  icon: '◈', roles: ['ADMIN', 'BASE_COMMANDER'] },
  { to: '/expenditures', label: 'Expenditures', icon: '✕', roles: ['ADMIN', 'BASE_COMMANDER'] },
  { to: '/users',        label: 'Users',        icon: '☰', roles: ['ADMIN'] },   // <-- new
  { to: '/audit',        label: 'Audit Logs',   icon: '⌘', roles: ['ADMIN'] },
];

export function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const visible = links.filter((l) => user && l.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="bg-military-900 text-white md:w-64 md:min-h-screen p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">MASS</h1>
          <button className="md:hidden btn btn-secondary" onClick={() => setOpen(!open)}>☰</button>
        </div>
        <nav className={`mt-6 space-y-1 ${open ? 'block' : 'hidden md:block'}`}>
          {visible.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded ${isActive ? 'bg-military-700' : 'hover:bg-military-800'}`
              }>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 text-sm text-military-300 border-t border-military-700 pt-4">
          <p className="font-semibold">{user?.username}</p>
          <p>{user?.role}</p>
          {user?.baseName && <p>{user.baseName}</p>}
          <button className="mt-3 btn btn-secondary text-sm"
            onClick={() => { logout(); nav('/login'); }}>
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-auto"><Outlet /></main>
    </div>
  );
}