import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import WalletsPage from './pages/WalletsPage';
import WalletDetailsPage from './pages/WalletDetailsPage';
import TripPlannerPage from './pages/TripPlannerPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionRadarPage from './pages/SubscriptionRadarPage';
import LoanOptimizerPage from './pages/LoanOptimizerPage';
import PaymentsPage from './pages/PaymentsPage';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Layout>
              <TransactionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/wallets"
        element={
          <ProtectedRoute>
            <Layout>
              <WalletsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/wallets/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <WalletDetailsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trip-planner"
        element={
          <ProtectedRoute>
            <Layout>
              <TripPlannerPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/subscriptions/radar"
        element={
          <ProtectedRoute>
            <Layout>
              <SubscriptionRadarPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/loans/optimizer"
        element={
          <ProtectedRoute>
            <Layout>
              <LoanOptimizerPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Layout>
              <PaymentsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
