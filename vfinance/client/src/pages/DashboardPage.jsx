import { useEffect, useMemo, useState } from 'react';
import {
  CircleDot,
  Clock3,
  CreditCard,
  Landmark,
  Layers3,
  Coins,
  Plus,
  QrCode,
  ReceiptIndianRupee,
  Settings,
  WalletCards,
  Radar,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

const apiOrigin = String(import.meta.env.VITE_API_URL || 'http://localhost:5050/api').replace(/\/api\/?$/, '');

const baseQuickActions = [
  {
    title: 'Add Transaction',
    subtitle: 'Record new income or expense',
    icon: Plus,
    path: '/transactions?create=1',
    badge: 'from-pink-500 to-rose-500',
  },
  {
    title: 'Wallets',
    subtitle: 'Manage all wallet balances',
    icon: WalletCards,
    path: '/wallets',
    badge: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Trip Planner',
    subtitle: 'Plan your adventures with precision',
    icon: Landmark,
    path: '/trip-planner',
    badge: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Smart Radar',
    subtitle: 'Detect subscription leaks yearly',
    icon: Radar,
    path: '/subscriptions/radar',
    badge: 'from-indigo-500 to-fuchsia-500',
  },
  {
    title: 'Loan Optimizer',
    subtitle: 'Plan EMI payoff intelligently',
    icon: Coins,
    path: '/loans/optimizer',
    badge: 'from-indigo-600 to-violet-600',
  },
  {
    title: 'Payments',
    subtitle: 'Manage subscriptions and repayments',
    icon: CreditCard,
    path: '/payments',
    badge: 'from-violet-600 to-fuchsia-600',
  },
  {
    title: 'Scan & Pay',
    subtitle: 'Real-time barcode payment',
    icon: QrCode,
    path: '/payments?scan=1',
    badge: 'from-fuchsia-600 to-pink-600',
  },
  {
    title: 'Settings',
    subtitle: 'Security and profile controls',
    icon: Settings,
    path: '/settings',
    badge: 'from-slate-600 to-slate-800',
  },
];

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const DashboardPage = () => {
  const { user } = useAuth();
  const [clock, setClock] = useState(new Date());
  const [dashboard, setDashboard] = useState(null);

  const avatarSrc = useMemo(() => {
    if (!user?.avatarUrl) return null;
    return user.avatarUrl.startsWith('http') ? user.avatarUrl : `${apiOrigin}${user.avatarUrl}`;
  }, [user?.avatarUrl]);

  const loadDashboard = async () => {
    const response = await api.get('/dashboard');
    setDashboard(response.data);
  };

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const trend = useMemo(() => {
    const value = dashboard?.trendPercentage || 0;
    return {
      text: `${value >= 0 ? '+' : ''}${value.toFixed(1)}% This month`,
      positive: value >= 0,
    };
  }, [dashboard]);

  const dateText = clock.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const timeText = clock.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const greeting = useMemo(() => {
    const hours = clock.getHours();
    if (hours >= 5 && hours < 12) return 'Good morning';
    if (hours >= 12 && hours < 17) return 'Good afternoon';
    if (hours >= 17 && hours < 21) return 'Good evening';
    return 'Good night';
  }, [clock]);

  const walletCount = useMemo(() => {
    const ids = new Set((dashboard?.recentTransactions || []).map((item) => String(item.wallet || 'main')));
    return ids.size;
  }, [dashboard]);

  const netThisMonth = useMemo(() => {
    if (!dashboard) return 0;
    return Number(dashboard.monthlyIncome || 0) - Number(dashboard.monthlyExpenses || 0);
  }, [dashboard]);

  const savingsRate = useMemo(() => {
    if (!dashboard || Number(dashboard.monthlyIncome || 0) <= 0) return 0;
    return (netThisMonth / Number(dashboard.monthlyIncome)) * 100;
  }, [dashboard, netThisMonth]);

  const spendRatio = useMemo(() => {
    const income = Number(dashboard?.monthlyIncome || 0);
    if (income <= 0) return 0;
    return (Number(dashboard?.monthlyExpenses || 0) / income) * 100;
  }, [dashboard]);

  const quickActions = useMemo(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return [
        ...baseQuickActions.slice(0, 7),
        {
          title: 'Admin Center',
          subtitle: 'Manage users and controls',
          icon: ReceiptIndianRupee,
          path: '/admin',
          badge: 'from-violet-600 to-indigo-700',
        },
      ];
    }

    return baseQuickActions.slice(0, 7);
  }, [user?.role]);

  if (!dashboard) {
    return <div className="card-soft">Loading dashboard...</div>;
  }

  return (
    <div className="animate-dashboard-in space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 p-6 text-white shadow-soft">
        <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              VFinance Intelligence
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-white shadow-md">
                <Layers3 size={22} />
              </span>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{greeting}, {user?.name || 'there'}!</h1>
                <p className="mt-1 text-sm text-white/80">{dateText}</p>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-3 py-2 backdrop-blur-sm">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="h-10 w-10 rounded-full border border-white/40 object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/25 text-sm font-semibold text-white">
                  {user?.name?.[0] || 'U'}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.name || 'User'}</p>
                <p className="truncate text-xs text-white/75">{user?.email || 'No email'}</p>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm text-white/85">
              Your current total balance is <span className="font-bold text-white">{formatMoney(dashboard.totalBalance)}</span> and
              your monthly momentum is trending {trend.positive ? 'upward' : 'downward'}.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/20 px-3 py-1 font-semibold text-white/90">
                {dashboard.recentTransactions.length} recent transactions
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 font-semibold text-white/90">
                {walletCount} active wallet{walletCount === 1 ? '' : 's'}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 font-semibold text-white/90">
                Spend ratio {Number.isFinite(spendRatio) ? `${spendRatio.toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-2 lg:min-w-[320px] lg:grid-cols-1">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Current Time</p>
              <p className="mt-1 text-2xl font-bold leading-tight text-white">{timeText}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">
              <p className="text-xs text-white/70">Monthly Trend</p>
              <p className={`mt-1 inline-flex items-center gap-1.5 text-sm font-bold ${trend.positive ? 'text-emerald-200' : 'text-orange-200'}`}>
                {trend.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {trend.text}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card-soft border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Monthly Income</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatMoney(dashboard.monthlyIncome)}</p>
          <p className="mt-1 text-xs text-slate-500">Total income: {formatMoney(dashboard.totalIncome)}</p>
        </div>

        <div className="card-soft border-rose-100 bg-gradient-to-br from-rose-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Monthly Expenses</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{formatMoney(dashboard.monthlyExpenses)}</p>
          <p className="mt-1 text-xs text-slate-500">Total expenses: {formatMoney(dashboard.totalExpenses)}</p>
        </div>

        <div className="card-soft border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Net This Month</p>
          <p className={`mt-2 text-2xl font-bold ${netThisMonth >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {netThisMonth >= 0 ? '+' : ''}{formatMoney(netThisMonth)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Savings rate: {Number.isFinite(savingsRate) ? `${savingsRate.toFixed(1)}%` : '0%'}</p>
        </div>

        <div className="card-soft border-sky-100 bg-gradient-to-br from-sky-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Wallet Savings</p>
          <p className="mt-2 text-2xl font-bold text-sky-700">{formatMoney(dashboard.walletSavings)}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
            <WalletCards size={12} className="text-sky-500" />
            {walletCount} wallet{walletCount === 1 ? '' : 's'}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-black px-5 py-5 text-white shadow-soft">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/70">Wallet Command Center</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{formatMoney(dashboard.walletSavings)}</p>
              <p className="mt-2 text-sm text-white/70">Total liquid balance across all wallets</p>
            </div>
            <Link
              to="/wallets"
              className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              View Wallets
            </Link>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="h-10 w-10 rounded-full border border-white/30 object-cover" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                    {user?.name?.[0] || 'V'}
                  </span>
                )}
                <div>
                  <p className="font-semibold text-white">{user?.name || 'User'}</p>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-slate-100">Primary profile</span>
                </div>
              </div>
              <p className="text-lg font-semibold text-white">{formatMoney(dashboard.walletSavings)}</p>
            </div>
          </div>
        </div>

        <div className="card-soft border-violet-100 bg-gradient-to-br from-violet-50 to-white">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-600">
                <Clock3 size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">This Month Snapshot</p>
                <p className="text-xs text-slate-500">{clock.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <p className={`text-xs font-bold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>{trend.text}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <p className="text-xs text-slate-500">Balance</p>
              <p className="mt-1 text-lg font-bold text-slate-800">{formatMoney(dashboard.totalBalance)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <p className="text-xs text-slate-500">Spend Ratio</p>
              <p className={`mt-1 text-lg font-bold ${spendRatio > 70 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {Number.isFinite(spendRatio) ? `${spendRatio.toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <p className="text-xs text-slate-500">Monthly Net</p>
              <p className={`mt-1 text-lg font-bold ${netThisMonth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netThisMonth >= 0 ? '+' : ''}{formatMoney(netThisMonth)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <p className="text-xs text-slate-500">Savings Rate</p>
              <p className="mt-1 text-lg font-bold text-indigo-600">{Number.isFinite(savingsRate) ? `${savingsRate.toFixed(1)}%` : '0%'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.path}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${action.badge} text-white shadow-md`}>
                <Icon size={20} />
              </div>
              <p className="text-xl font-semibold text-slate-800">{action.title}</p>
              <p className="mt-1 text-sm text-slate-500">{action.subtitle}</p>
              {action.title === 'Trip Planner' && (
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <CircleDot size={10} className="text-indigo-400" /> Smart Budgeting
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CircleDot size={10} className="text-emerald-400" /> Real-time Tracking
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-indigo-50/40 p-5 shadow-soft motion-safe:transition-all motion-safe:duration-300">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 text-white shadow-md shadow-cyan-200">
              <ReceiptIndianRupee size={20} />
            </span>
            <h2 className="text-2xl font-bold text-slate-800">Recent Transactions</h2>
          </div>
          <Link
            className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-pink-200"
            to="/transactions"
          >
            View All
          </Link>
        </div>

        {dashboard.recentTransactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <p className="text-base font-semibold text-slate-700">No recent transactions yet</p>
            <p className="mt-1 text-sm text-slate-500">Start by adding your first transaction to unlock insights.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="hidden grid-cols-[1.8fr_1fr_0.9fr_1.2fr] gap-3 rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <p>Transaction</p>
              <p>Category</p>
              <p>Date</p>
              <p className="text-right">Amount</p>
            </div>

            {dashboard.recentTransactions.map((item) => {
            const isIncome = item.type === 'income';

            return (
              <div key={item._id} className="rounded-xl border border-slate-100 bg-white/90 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md">
                <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.8fr_1fr_0.9fr_1.2fr] md:items-center md:gap-3">
                  <div className="inline-flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl text-white shadow-md ${
                        isIncome
                          ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-300'
                          : 'bg-gradient-to-br from-rose-600 to-rose-700 shadow-rose-300'
                      }`}
                    >
                      {isIncome ? <WalletCards size={16} /> : <ReceiptIndianRupee size={16} />}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-800">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{isIncome ? 'Income transaction' : 'Expense transaction'}</p>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isIncome ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-500 md:text-sm">{formatDate(item.date)}</p>

                  <div className="text-left md:text-right">
                    <p className={`text-lg font-bold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isIncome ? '+' : '-'}{formatMoney(item.amount)}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">{isIncome ? 'Income' : 'Expense'}</p>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
