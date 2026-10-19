import { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import {
  ShieldCheck,
  Users,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  UserPlus,
  RotateCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate } from '../utils/format';
import UserAvatar from '../components/UserAvatar';

// Modular Admin Components
import AdminStatCard from '../components/admin/AdminStatCard';
import CreateUserCard from '../components/admin/CreateUserCard';
import UserManagementTable from '../components/admin/UserManagementTable';
import UserDetailsModal from '../components/admin/UserDetailsModal';
import EditUserModal from '../components/admin/EditUserModal';
import DeleteUserModal from '../components/admin/DeleteUserModal';
import TransactionsTable from '../components/admin/TransactionsTable';
import BudgetsTable from '../components/admin/BudgetsTable';
import ReportsAnalytics from '../components/admin/ReportsAnalytics';
import SystemSettingsView from '../components/admin/SystemSettingsView';

const tabs = [
  { key: 'dashboard', label: 'Command Center', icon: ShieldCheck },
  { key: 'users', label: 'User Directory', icon: Users, badgeKey: 'users' },
  { key: 'transactions', label: 'Transactions', icon: Receipt, badgeKey: 'transactions' },
  { key: 'budgets', label: 'Budgets', icon: Wallet, badgeKey: 'budgets' },
  { key: 'reports', label: 'Financial Intelligence', icon: BarChart3 },
  { key: 'settings', label: 'System Health', icon: Settings },
];

const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.isSuperAdmin;

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [busy, setBusy] = useState(false);

  // Modals state
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Load all admin data concurrently
  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, txRes, budgetsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/transactions'),
        api.get('/admin/budgets'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setTransactions(txRes.data || []);
      setBudgets(budgetsRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load administrative telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Action: Create User
  const handleCreateUser = async (newUserData) => {
    if (busy) return;
    setBusy(true);
    try {
      const payload = isSuperAdmin
        ? newUserData
        : { ...newUserData, role: 'user' };
      await api.post('/admin/users', payload);
      await loadData(false);
      setSuccessBanner(`User ${newUserData.name} provisioned successfully!`);
      setTimeout(() => setSuccessBanner(''), 5000);
    } finally {
      setBusy(false);
    }
  };

  // Quick Action: Save/Edit User
  const handleSaveUser = async (userId, updatePayload) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.patch(`/admin/users/${userId}`, updatePayload);
      await loadData(false);
      setSuccessBanner('User profile updated successfully.');
      setTimeout(() => setSuccessBanner(''), 5000);
    } finally {
      setBusy(false);
    }
  };

  // Quick Action: Toggle Role (User <-> Admin)
  const handleToggleRole = async (targetUser) => {
    if (!targetUser?.id && !targetUser?._id) return;
    if (!isSuperAdmin) return;
    if (targetUser.role === 'super_admin' || targetUser.isSuperAdmin) return;

    const targetId = targetUser.id || targetUser._id;
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';

    setBusy(true);
    try {
      await api.patch(`/admin/users/${targetId}`, { role: nextRole });
      await loadData(false);
      setSuccessBanner(`Role for ${targetUser.name} changed to ${nextRole === 'admin' ? 'Administrator' : 'Standard User'}.`);
      setTimeout(() => setSuccessBanner(''), 5000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to modify role.');
    } finally {
      setBusy(false);
    }
  };

  // Quick Action: Delete User
  const handleDeleteUser = async (userId) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      setDeletingUser(null);
      await loadData(false);
      setSuccessBanner('User and associated data permanently purged.');
      setTimeout(() => setSuccessBanner(''), 5000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete user.');
    } finally {
      setBusy(false);
    }
  };

  // Calculated totals
  const totalVolumeCalculated = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
  }, [transactions]);

  const recentUsers = useMemo(() => users.slice(0, 5), [users]);
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  // Loading Skeleton State
  if (loading && !stats) {
    return (
      <div className="space-y-6">
        {/* Skeleton Banner */}
        <div className="h-44 w-full rounded-3xl skeleton-shimmer" />

        {/* Skeleton Tabs */}
        <div className="h-14 w-full rounded-2xl skeleton-shimmer" />

        {/* Skeleton Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-36 rounded-3xl skeleton-shimmer" />
          <div className="h-36 rounded-3xl skeleton-shimmer" />
          <div className="h-36 rounded-3xl skeleton-shimmer" />
          <div className="h-36 rounded-3xl skeleton-shimmer" />
        </div>

        {/* Skeleton Tables */}
        <div className="h-72 rounded-3xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* 1. Emergent AI Inspired Command Center Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-700 p-6 sm:p-8 text-white shadow-[0_20px_50px_-15px_rgba(244,114,182,0.4)]">
        {/* Ambient glow particles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-purple-500/25 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span>ENTERPRISE OS • CLUSTER OPERATIONAL</span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              {isSuperAdmin ? 'Super Admin Command Center' : 'Administrator Console'}
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm font-medium text-pink-100/90 leading-relaxed">
              Real-time directory orchestration, ledger audits, and financial intelligence for{' '}
              <strong className="text-white font-bold">{currentUser?.name || 'Administrator'}</strong>.
            </p>

            {/* Quick Live Indicators */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 font-bold backdrop-blur-sm">
                <Users size={14} className="text-pink-200" />
                {users.length} Active Accounts
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 font-bold backdrop-blur-sm">
                <Receipt size={14} className="text-purple-200" />
                {transactions.length} Ledger Records
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 font-bold backdrop-blur-sm">
                <Sparkles size={14} className="text-emerald-200" />
                99.98% Latency SLA
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('users');
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95"
            >
              <UserPlus size={16} className="text-pink-600" />
              <span>Provision User</span>
            </button>

            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
            >
              <RotateCw size={16} className={busy ? 'animate-spin' : ''} />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Alerts / Toasts */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-semibold text-rose-700 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-xs font-bold text-rose-500 hover:text-rose-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {successBanner && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-700 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="shrink-0 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner('')}
            className="text-xs font-bold text-emerald-500 hover:text-emerald-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Refined Floating Segmented Tab Bar */}
      <div className="overflow-x-auto rounded-3xl border border-white/90 bg-white/90 p-2 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl custom-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const badgeCount =
              tab.badgeKey === 'users'
                ? users.length
                : tab.badgeKey === 'transactions'
                ? transactions.length
                : tab.badgeKey === 'budgets'
                ? budgets.length
                : null;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminTabIndicator"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 shadow-md shadow-pink-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-2">
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  {badgeCount !== null && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tab Content Panes with Framer Motion AnimatePresence */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 4 Animated Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminStatCard
                title="Total Accounts"
                value={stats?.totalUsers || users.length}
                subtitle={`${stats?.adminUsers || stats?.totalAdmins || 0} Admins & Super Admins`}
                badge="Directory"
                badgeColor="border-blue-200 bg-blue-50 text-blue-700"
                icon={Users}
                gradient="from-blue-600 to-indigo-600"
                glowColor="rgba(59,130,246,0.2)"
                onClick={() => setActiveTab('users')}
              />

              <AdminStatCard
                title="System Volume"
                value={stats?.transactions?.totalVolume || totalVolumeCalculated}
                isCurrency={true}
                prefix="₹"
                subtitle="Cumulative ledger throughput"
                badge="Live Flow"
                badgeColor="border-emerald-200 bg-emerald-50 text-emerald-700"
                icon={TrendingUp}
                gradient="from-emerald-500 to-teal-600"
                glowColor="rgba(16,185,129,0.2)"
                onClick={() => setActiveTab('reports')}
              />

              <AdminStatCard
                title="Transactions"
                value={stats?.totalTransactions || transactions.length}
                subtitle="Verified double-entry ledger"
                badge="Audited"
                badgeColor="border-pink-200 bg-pink-50 text-pink-700"
                icon={Receipt}
                gradient="from-pink-500 to-rose-600"
                glowColor="rgba(244,63,94,0.2)"
                onClick={() => setActiveTab('transactions')}
              />

              <AdminStatCard
                title="Active Budgets"
                value={stats?.totalBudgets || budgets.length}
                subtitle="Campus & commercial envelopes"
                badge="Envelopes"
                badgeColor="border-purple-200 bg-purple-50 text-purple-700"
                icon={Wallet}
                gradient="from-purple-600 to-violet-600"
                glowColor="rgba(168,85,247,0.2)"
                onClick={() => setActiveTab('budgets')}
              />
            </div>

            {/* Quick Action Navigation Tiles */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div
                onClick={() => setActiveTab('users')}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/90 bg-white/95 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-blue-600">
                    <Users size={20} />
                  </div>
                  <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Manage <ArrowRight size={14} />
                  </span>
                </div>
                <h4 className="mt-4 text-base font-extrabold text-slate-900">User Management</h4>
                <p className="mt-1 text-xs text-slate-500 font-medium">Provision users, configure roles, and inspect profiles.</p>
              </div>

              <div
                onClick={() => setActiveTab('transactions')}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/90 bg-white/95 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <Receipt size={20} />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Inspect <ArrowRight size={14} />
                  </span>
                </div>
                <h4 className="mt-4 text-base font-extrabold text-slate-900">Transaction Stream</h4>
                <p className="mt-1 text-xs text-slate-500 font-medium">Audit monetary flows, filter by income/expense, view ledger.</p>
              </div>

              <div
                onClick={() => setActiveTab('reports')}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/90 bg-white/95 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-100 text-purple-600">
                    <BarChart3 size={20} />
                  </div>
                  <span className="text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Analyze <ArrowRight size={14} />
                  </span>
                </div>
                <h4 className="mt-4 text-base font-extrabold text-slate-900">Financial Intelligence</h4>
                <p className="mt-1 text-xs text-slate-500 font-medium">Interactive flow charts, category distributions, velocity metrics.</p>
              </div>
            </div>

            {/* 2-Column Grid: Recent Users & Recent Transactions */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Users */}
              <div className="rounded-3xl border border-white/90 bg-white/95 p-6 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-blue-600">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">Recent Registrations</h4>
                      <p className="text-xs text-slate-400">Newly onboarded account holders</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="text-xs font-bold text-pink-600 hover:text-pink-700 hover:underline"
                  >
                    View All ({users.length})
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  {recentUsers.map((u) => (
                    <div
                      key={u.id || u._id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100/80 bg-slate-50/50 p-3 transition hover:bg-pink-50/40"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={u} size="h-9 w-9" textSize="text-xs" />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-800 text-sm">{u.name}</p>
                          <p className="truncate text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 border border-slate-100">
                          {u.portalRole || u.portal || 'student'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingUser(u)}
                          className="rounded-lg bg-white p-1.5 text-slate-500 shadow-2xs hover:bg-pink-50 hover:text-pink-700 transition"
                        >
                          <Activity size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="rounded-3xl border border-white/90 bg-white/95 p-6 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">Live Transaction Stream</h4>
                      <p className="text-xs text-slate-400">Latest debits and credits recorded</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('transactions')}
                    className="text-xs font-bold text-pink-600 hover:text-pink-700 hover:underline"
                  >
                    View All ({transactions.length})
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  {recentTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const userName = typeof tx.user === 'object' && tx.user?.name ? tx.user.name : 'User';

                    return (
                      <div
                        key={tx.id || tx._id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100/80 bg-slate-50/50 p-3 transition hover:bg-pink-50/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                              isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800 text-sm">{tx.title || 'Untitled'}</p>
                            <p className="truncate text-xs text-slate-400">
                              {userName} • {tx.category || 'General'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`font-extrabold text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'} {formatINR(tx.amount)}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                            <Clock size={10} />
                            {formatDate(tx.date || tx.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Create User Form Section */}
            <CreateUserCard
              onCreateUser={handleCreateUser}
              isSuperAdmin={isSuperAdmin}
              busy={busy}
            />

            {/* User Directory Table with Search, Filter, Sort, Pagination, and Modals */}
            <UserManagementTable
              users={users}
              onViewUser={(u) => setViewingUser(u)}
              onEditUser={(u) => setEditingUser(u)}
              onToggleRole={handleToggleRole}
              onDeleteUser={(u) => setDeletingUser(u)}
              isSuperAdmin={isSuperAdmin}
              currentUserId={currentUser?.id || currentUser?._id}
              busy={busy}
            />
          </motion.div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <TransactionsTable transactions={transactions} />
          </motion.div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <motion.div
            key="budgets"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <BudgetsTable budgets={budgets} />
          </motion.div>
        )}

        {/* Financial Intelligence / Reports Tab */}
        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <ReportsAnalytics transactions={transactions} stats={stats || {}} />
          </motion.div>
        )}

        {/* System Settings & Diagnostics Tab */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <SystemSettingsView
              stats={stats}
              usersCount={users.length}
              txCount={transactions.length}
              budgetsCount={budgets.length}
              onRefresh={() => loadData(false)}
              busy={busy}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Modals */}
      <UserDetailsModal
        user={viewingUser}
        isOpen={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
      />

      <EditUserModal
        user={editingUser}
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
        isSuperAdmin={isSuperAdmin}
        busy={busy}
      />

      <DeleteUserModal
        user={deletingUser}
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        busy={busy}
        currentUserId={currentUser?.id || currentUser?._id}
      />
    </div>
  );
};

export default AdminPage;
