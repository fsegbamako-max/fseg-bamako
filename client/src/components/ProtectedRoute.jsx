import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, useAdminStore } from '../store/authStore';

export function StudentRoute() {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  return isLoggedIn ? <Outlet /> : <Navigate to="/etudiants/connexion" replace />;
}

export function AdminRoute() {
  const isLoggedIn = useAdminStore(s => s.isLoggedIn);
  return isLoggedIn ? <Outlet /> : <Navigate to="/admin/connexion" replace />;
}
