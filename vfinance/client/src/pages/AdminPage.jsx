import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  Eye,
  Pencil,
  Shield,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';
import { formatDate, formatINR } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const roleLabel = (role) => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return 'User';
};

const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [view, setView] = useState('dashboard');
  const [busy, setBusy] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUser, setEditUser] = useState({ name: '', email: '', role: 'user' });

  const loadData = async () => {
    try {
      const [statsRes, usersRes, txRes, budgetsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/transactions'),
        api.get('/admin/budgets'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setTransactions(txRes.data);
      setBudgets(budgetsRes.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load admin dashboard data right now.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createUser = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const payload = isSuperAdmin ? newUser : { ...newUser, role: 'user' };
      await api.post('/admin/users', payload);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create user right now.');
    } finally {
      setBusy(false);
    }
  };

  const openEditUser = (user) => {
    setEditingUserId(user._id);
    setEditUser({ name: user.name || '', email: user.email || '', role: user.role || 'user' });
  };

  const saveUser = async (event) => {
    event.preventDefault();
    if (!editingUserId || busy) return;
    setBusy(true);
    try {
      await api.patch(`/admin/users/${editingUserId}`, editUser);
      setEditingUserId(null);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update user right now.');
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (id) => {
    if (busy) return;
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Delete this user? This will also remove their transactions and budgets.');
    if (!ok) return;

    setBusy(true);
    try {
      await api.delete(`/admin/users/${id}`);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete user right now.');
    } finally {
      setBusy(false);
    }
  };

  const toggleRole = async (user) => {
    if (!user?._id || busy) return;
    if (!isSuperAdmin) return;
    if (user.role === 'super_admin') return;
    setBusy(true);
    try {
      const nextRole = user.role === 'admin' ? 'user' : 'admin';
      await api.patch(`/admin/users/${user._id}`, { role: nextRole });
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to change role right now.');
    } finally {
      setBusy(false);
    }
  };

  const sections = [
    { key: 'dashboard', label: 'Dashboard', icon: ShieldCheck },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'transactions', label: 'Transactions', icon: Receipt },
    { key: 'budgets', label: 'Budgets', icon: Wallet },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const recentUsers = useMemo(() => users.slice(0, 5), [users]);
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const reports = useMemo(() => {
    const totals = transactions.reduce(
      (acc, tx) => {
        const amount = Number(tx.amount || 0);
        if (tx.type === 'income') acc.income += amount;
        else acc.expense += amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );

    const net = totals.income - totals.expense;
    return { ...totals, net };
  }, [transactions]);

  const StatCard = ({ title, value, icon: Icon, gradient, softIcon }) => (
    <div className={`rounded-2xl p-5 text-white shadow-soft ${gradient}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${softIcon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );

  const Tile = ({ title, subtitle, icon: Icon, iconBg, buttonLabel, buttonBg, onClick }) => (
    <div className="card-soft">
      <div className="flex items-start gap-3">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 ${buttonBg}`}
      >
        {buttonLabel}
      </button>
    </div>
  );

  if (!stats) {
    return <div className="card-soft">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-soft">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-pink-600">Admin Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Welcome to the administrative control panel. Manage users, transactions, and system settings.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = view === section.key;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setView(section.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${active ? 'bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-soft' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">{error}</p>}

      {view === 'dashboard' && (
        <div className="animate-dashboard-in space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              gradient="bg-gradient-to-r from-sky-500 to-blue-600"
              softIcon="bg-white/15"
            />
            <StatCard
              title="Admin Users"
              value={stats.adminUsers}
              icon={Shield}
              gradient="bg-gradient-to-r from-rose-500 to-pink-600"
              softIcon="bg-white/15"
            />
            <StatCard
              title="Total Transactions"
              value={stats.totalTransactions}
              icon={Receipt}
              gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
              softIcon="bg-white/15"
            />
            <StatCard
              title="Total Budgets"
              value={stats.totalBudgets}
              icon={Wallet}
              gradient="bg-gradient-to-r from-violet-500 to-indigo-600"
              softIcon="bg-white/15"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Tile
              title="User Management"
              subtitle="Manage all users and their accounts"
              icon={Users}
              iconBg="bg-blue-500/15 text-blue-600"
              buttonLabel="View All Users"
              buttonBg="bg-gradient-to-r from-sky-500 to-blue-600"
              onClick={() => setView('users')}
            />
            <Tile
              title="Transaction Management"
              subtitle="Monitor all user transactions"
              icon={Receipt}
              iconBg="bg-emerald-500/15 text-emerald-600"
              buttonLabel="View All Transactions"
              buttonBg="bg-gradient-to-r from-emerald-500 to-teal-500"
              onClick={() => setView('transactions')}
            />
            <Tile
              title="Budget Management"
              subtitle="Monitor all user budgets"
              icon={Wallet}
              iconBg="bg-violet-500/15 text-violet-600"
              buttonLabel="View All Budgets"
              buttonBg="bg-gradient-to-r from-violet-500 to-indigo-600"
              onClick={() => setView('budgets')}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Tile
              title="System Reports"
              subtitle="View comprehensive analytics and insights"
              icon={BarChart3}
              iconBg="bg-sky-500/15 text-sky-600"
              buttonLabel="View Reports"
              buttonBg="bg-gradient-to-r from-sky-500 to-blue-600"
              onClick={() => setView('reports')}
            />
            <Tile
              title="System Settings"
              subtitle="View system information and configuration"
              icon={Settings}
              iconBg="bg-slate-500/15 text-slate-600"
              buttonLabel="View Settings"
              buttonBg="bg-gradient-to-r from-slate-500 to-slate-700"
              onClick={() => setView('settings')}
            />
            <div className="hidden lg:block" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500/15 text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="text-base font-semibold text-slate-800">Recent Users</p>
                </div>
                <button type="button" onClick={() => setView('users')} className="text-sm font-semibold text-blue-600 hover:underline">
                  View All
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                        {(user.name || 'U')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <span
                      className={
                        user.role === 'super_admin'
                          ? 'rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700'
                          : user.role === 'admin'
                          ? 'rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700'
                          : 'rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700'
                      }
                    >
                      {roleLabel(user.role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <p className="text-base font-semibold text-slate-800">Recent Transactions</p>
                </div>
                <button type="button" onClick={() => setView('transactions')} className="text-sm font-semibold text-emerald-600 hover:underline">
                  View All
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <div key={tx._id} className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            isIncome
                              ? 'grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700'
                              : 'grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-700'
                          }
                        >
                          {isIncome ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{tx.title}</p>
                          <p className="truncate text-xs text-slate-500">
                            {tx.user?.name || 'N/A'} • {tx.category}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={isIncome ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
                          {isIncome ? '+' : '-'} {formatINR(tx.amount)}
                        </p>
                        <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {view === 'users' && (
        <div className="animate-dashboard-in space-y-4">
          <div className="card-soft border border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-violet-50/80">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/15 text-blue-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">Create New User</p>
                <p className="text-sm text-slate-500">Add a user account inside User Management</p>
              </div>
            </div>

            <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={createUser}>
              <input className="input-soft" placeholder="Name" value={newUser.name} onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))} required />
              <input className="input-soft" placeholder="Email" type="email" value={newUser.email} onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))} required />
              <input className="input-soft" placeholder="Password" type="password" value={newUser.password} onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))} required />
              <div className="flex gap-2">
                <select className="input-soft" value={newUser.role} onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}>
                  <option value="user">User</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                </select>
                <button className="btn-gradient" type="submit" disabled={busy}>
                  Create
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Manage all users and their accounts</p>
              <p className="mt-1 text-xs text-slate-500">All Users ({users.length})</p>
            </div>

            <button type="button" onClick={() => setView('dashboard')} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              Back to Dashboard
            </button>
          </div>

          {editingUserId && (
            <form onSubmit={saveUser} className="card-soft">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Edit User</p>
                <button type="button" onClick={() => setEditingUserId(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <input className="input-soft" placeholder="Name" value={editUser.name} onChange={(event) => setEditUser((prev) => ({ ...prev, name: event.target.value }))} />
                <input className="input-soft" placeholder="Email" type="email" value={editUser.email} onChange={(event) => setEditUser((prev) => ({ ...prev, email: event.target.value }))} />
                <select
                  className="input-soft"
                  value={editUser.role}
                  onChange={(event) => setEditUser((prev) => ({ ...prev, role: event.target.value }))}
                  disabled={!isSuperAdmin || editUser.role === 'super_admin'}
                >
                  <option value="user">User</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                </select>
                <button className="btn-gradient" type="submit" disabled={busy}>
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="card-soft overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Transactions</th>
                  <th className="pb-3">Budgets</th>
                  <th className="pb-3">Last Login</th>
                  <th className="pb-3">Joined</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                          {(user.name || 'U')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{user.name}</p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          user.role === 'super_admin'
                            ? 'inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700'
                            : user.role === 'admin'
                              ? 'inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700'
                              : 'inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700'
                        }
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="text-slate-700">{user.transactionsCount ?? 0}</td>
                    <td className="text-slate-700">{user.budgetsCount ?? 0}</td>
                    <td className="text-slate-500">{formatDate(user.lastLoginAt)}</td>
                    <td className="text-slate-500">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="View"
                          onClick={() => openEditUser(user)}
                          className="rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEditUser(user)}
                          className="rounded-lg bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Toggle Role"
                          onClick={() => toggleRole(user)}
                          disabled={!isSuperAdmin || user.role === 'super_admin'}
                          className={`rounded-lg p-2 transition ${
                            !isSuperAdmin || user.role === 'super_admin'
                              ? 'cursor-not-allowed bg-slate-50 text-slate-300'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => deleteUser(user._id)}
                          disabled={user.role === 'super_admin'}
                          className={`rounded-lg p-2 transition ${
                            user.role === 'super_admin'
                              ? 'cursor-not-allowed bg-slate-50 text-slate-300'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'transactions' && (
        <div className="animate-dashboard-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Monitor all user transactions</p>
              <p className="mt-1 text-xs text-slate-500">All Transactions ({transactions.length})</p>
            </div>

            <button type="button" onClick={() => setView('dashboard')} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              Back to Dashboard
            </button>
          </div>

          <div className="card-soft overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-3">Transaction</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx._id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                      <td className="py-4">
                        <p className="font-semibold text-slate-800">{tx.title}</p>
                        <p className="text-xs text-slate-500">{tx.category}</p>
                      </td>
                      <td className="text-slate-700">{tx.user?.name || 'N/A'}</td>
                      <td>
                        <span
                          className={
                            isIncome
                              ? 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
                              : 'inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700'
                          }
                        >
                          {isIncome ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className={isIncome ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
                        {isIncome ? '+' : '-'} {formatINR(tx.amount)}
                      </td>
                      <td className="text-slate-500">{formatDate(tx.date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'budgets' && (
        <div className="animate-dashboard-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Monitor all user budgets</p>
              <p className="mt-1 text-xs text-slate-500">All Budgets ({budgets.length})</p>
            </div>

            <button type="button" onClick={() => setView('dashboard')} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              Back to Dashboard
            </button>
          </div>

          <div className="card-soft overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-3">Budget</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Period</th>
                  <th className="pb-3">Dates</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => (
                  <tr key={b._id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                    <td className="py-4">
                      <p className="font-semibold text-slate-800">{b.budgetName}</p>
                      <p className="text-xs text-slate-500">{b.destination}</p>
                    </td>
                    <td className="text-slate-700">{b.user?.name || 'N/A'}</td>
                    <td className="font-semibold text-slate-800">{formatINR(b.amount)}</td>
                    <td>
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {b.period}
                      </span>
                    </td>
                    <td className="text-slate-500">
                      {formatDate(b.startDate)} - {formatDate(b.endDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'reports' && (
        <div className="animate-dashboard-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">View comprehensive analytics and insights</p>
              <p className="mt-1 text-xs text-slate-500">System Reports</p>
            </div>

            <button type="button" onClick={() => setView('dashboard')} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              Back to Dashboard
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Income</p>
              <p className="mt-2 text-xl font-bold text-emerald-600">{formatINR(reports.income)}</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Expenses</p>
              <p className="mt-2 text-xl font-bold text-rose-600">{formatINR(reports.expense)}</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net</p>
              <p className={reports.net >= 0 ? 'mt-2 text-xl font-bold text-emerald-600' : 'mt-2 text-xl font-bold text-rose-600'}>
                {formatINR(reports.net)}
              </p>
            </div>
          </div>
        </div>
      )}

      {view === 'settings' && (
        <div className="animate-dashboard-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">View system information and configuration</p>
              <p className="mt-1 text-xs text-slate-500">System Settings</p>
            </div>

            <button type="button" onClick={() => setView('dashboard')} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              Back to Dashboard
            </button>
          </div>

          <div className="card-soft">
            <p className="text-sm font-semibold text-slate-700">System</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">API Status</p>
                <p className="mt-1 font-semibold text-emerald-600">Online</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data</p>
                <p className="mt-1 text-sm text-slate-700">Users: {stats.totalUsers} • Transactions: {stats.totalTransactions} • Budgets: {stats.totalBudgets}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
