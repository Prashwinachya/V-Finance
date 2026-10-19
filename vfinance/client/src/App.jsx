import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Route-level code splitting for optimized bundle size & fast initial paint
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const WalletsPage = lazy(() => import('./pages/WalletsPage'));
const WalletDetailsPage = lazy(() => import('./pages/WalletDetailsPage'));
const TripPlannerPage = lazy(() => import('./pages/TripPlannerPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SubscriptionRadarPage = lazy(() => import('./pages/SubscriptionRadarPage'));
const LoanOptimizerPage = lazy(() => import('./pages/LoanOptimizerPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const BankSyncPage = lazy(() => import('./pages/BankSyncPage'));

const RouteLoadingFallback = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center" aria-label="Loading page">
    <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 text-white shadow-md shadow-pink-500/25">
      <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
    </div>
    <span className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Loading...</span>
  </div>
);

const AppRoutes = () => {
  const auth = useAuth();

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/login" element={auth.isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

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
            <ProtectedRoute businessOnly>
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
          path="/bank-sync"
          element={
            <ProtectedRoute>
              <Layout>
                <BankSyncPage />
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

        <Route path="*" element={<Navigate to={auth.isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  const base = typeof window !== 'undefined' && window.__BASE_URL__ 
    ? window.__BASE_URL__ 
    : (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL ? import.meta.env.BASE_URL : '/');

  return (
    <AuthProvider>
      <BrowserRouter basename={base}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
