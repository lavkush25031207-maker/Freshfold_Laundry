import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function ProtectedRoute({ children, role = 'CUSTOMER' }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader">Checking your account...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/orders'} replace />;
  return children;
}
