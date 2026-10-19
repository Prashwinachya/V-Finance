import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, businessOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const interfaceRole = user?.portalRole || user?.role;

  const isAdmin = ['admin', 'super_admin'].includes(user?.role) || Boolean(user?.isSuperAdmin);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-500">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (businessOnly && !isAdmin && interfaceRole !== 'business_user') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
