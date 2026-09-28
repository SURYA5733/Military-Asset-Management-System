import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Purchases } from './pages/Purchases';
import { Transfers } from './pages/Transfers';
import { Assignments } from './pages/Assignments';
import { Expenditures } from './pages/Expenditures';
import { AuditLogs } from './pages/AuditLogs';
import { Users } from './pages/Users';

const qc = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/transfers" element={<Transfers />} />
              <Route path="/assignments" element={
                <ProtectedRoute roles={['ADMIN', 'BASE_COMMANDER']}><Assignments /></ProtectedRoute>
              } />
              <Route path="/expenditures" element={
                <ProtectedRoute roles={['ADMIN', 'BASE_COMMANDER']}><Expenditures /></ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute roles={['ADMIN']}><Users /></ProtectedRoute>
              } />
              <Route path="/audit" element={
                <ProtectedRoute roles={['ADMIN']}><AuditLogs /></ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}