import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet as WalletIcon, Info, CircleDollarSign, HeartPulse, ShieldPlus, PiggyBank, Plus } from 'lucide-react';
import api from '../api/client';
import { formatINR } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const walletTypes = [
  {
    value: 'travelling_wallet',
    label: 'Travelling Wallet',
    note: 'Funds can be added and withdrawn anytime',
    icon: WalletIcon,
    pill: 'bg-sky-100 text-sky-700',
    border: 'border-sky-100',
    accent: 'from-sky-500 to-blue-500',
  },
  {
    value: 'medical_emergency_wallet',
    label: 'Medical Emergency Wallet',
    note: 'Emergency-focused wallet, withdraw anytime',
    icon: HeartPulse,
    pill: 'bg-rose-100 text-rose-700',
    border: 'border-rose-100',
    accent: 'from-rose-500 to-red-500',
  },
  {
    value: 'pocket_saver_wallet',
    label: 'Pocket Saver Wallet',
    note: 'Withdraw only once every 14 days',
    icon: PiggyBank,
    pill: 'bg-amber-100 text-amber-700',
    border: 'border-amber-100',
    accent: 'from-amber-500 to-orange-500',
  },
];

const typeMeta = Object.fromEntries(walletTypes.map((item) => [item.value, item]));
const maxWallets = 3;
const studentWalletType = 'pocket_saver_wallet';

const WalletsPage = () => {
  const { user } = useAuth();
  const isAdmin = ['admin', 'super_admin'].includes(user?.role) || Boolean(user?.isSuperAdmin);
  const interfaceRole = user?.portalRole || user?.role;
  const isStudent = !isAdmin && ['student', 'user', 'super_admin_student'].includes(interfaceRole);
  const [wallets, setWallets] = useState([]);
  const [walletType, setWalletType] = useState(studentWalletType);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeWalletTypes = useMemo(() => {
    return new Set(wallets.map((w) => (w.walletType === 'personal_wallet' ? 'travelling_wallet' : w.walletType)));
  }, [wallets]);

  const availableWalletTypes = useMemo(() => {
    if (isStudent) {
      return walletTypes.filter((item) => item.value === studentWalletType);
    }

    return walletTypes;
  }, [isStudent]);

  useEffect(() => {
    if (isStudent) {
      if (walletType !== studentWalletType) {
        setWalletType(studentWalletType);
      }
    } else {
      if (activeWalletTypes.has(walletType)) {
        const nextAvailable = availableWalletTypes.find((item) => !activeWalletTypes.has(item.value));
        if (nextAvailable) {
          setWalletType(nextAvailable.value);
        }
      }
    }
  }, [isStudent, walletType, activeWalletTypes, availableWalletTypes]);

  const effectiveMaxWallets = isStudent ? 1 : maxWallets;

  const loadWallets = async () => {
    const response = await api.get('/wallets');
    setWallets(response.data);
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const totalSavings = useMemo(
    () => wallets.reduce((sum, wallet) => sum + wallet.balance, 0),
    [wallets]
  );

  const totalCredits = useMemo(
    () => wallets.reduce((sum, wallet) => sum + Number(wallet.totalCredits || 0), 0),
    [wallets]
  );

  const totalDebits = useMemo(
    () => wallets.reduce((sum, wallet) => sum + Number(wallet.totalDebits || 0), 0),
    [wallets]
  );

  const canCreateMore = wallets.length < effectiveMaxWallets && activeWalletTypes.size < effectiveMaxWallets;
  const selectedMeta = typeMeta[walletType] || typeMeta[studentWalletType];

  const formatINRPrecise = (amount = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      if (!canCreateMore) {
        setError(
          isStudent
            ? 'Student accounts can have only one Pocket Saver wallet.'
            : 'Business accounts can have a maximum of 3 wallets: Travel, Medical, and Pocket Saver.'
        );
        return;
      }
      if (activeWalletTypes.has(walletType)) {
        const label = typeMeta[walletType]?.label || 'wallet';
        setError(`You already have an active ${label}.`);
        return;
      }
      await api.post('/wallets', { walletType });
      await loadWallets();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save wallet right now');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateText = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-soft">
            <WalletIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Wallets</h1>
            <p className="mt-0.5 text-sm text-slate-500">Manage your digital savings and pocket money</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 sm:inline-flex">
          <Info className="h-4 w-4" />
          {wallets.length}/{effectiveMaxWallets} wallets active
        </div>
      </div>

      {isStudent && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Student wallet policy: only one Pocket Saver Wallet is allowed. Travelling and Medical Emergency wallets are unavailable.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white/90">Total Savings</p>
              <p className="mt-2 text-3xl font-bold text-white">{formatINRPrecise(totalSavings)}</p>
              <p className="mt-1 text-sm text-white/80">Across all wallets</p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-white">
              <CircleDollarSign className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="card-soft border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Credits</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatINR(totalCredits)}</p>
          <p className="mt-1 text-xs text-slate-500">All wallet top-ups combined</p>
        </div>

        <div className="card-soft border-rose-100 bg-gradient-to-br from-rose-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Debits</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{formatINR(totalDebits)}</p>
          <p className="mt-1 text-xs text-slate-500">All wallet withdrawals combined</p>
        </div>
      </div>

      {canCreateMore ? (
        <form onSubmit={submit} className="card-soft space-y-4 motion-safe:transition-all motion-safe:duration-300">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">Activate Wallets</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-9">
              <div className="grid gap-2 sm:grid-cols-3">
                {availableWalletTypes.map((item) => {
                  const Icon = item.icon;
                  const selected = walletType === item.value;
                  const isActive = activeWalletTypes.has(item.value);
                  return (
                    <button
                      key={item.value}
                      type="button"
                      disabled={isActive}
                      onClick={() => setWalletType(item.value)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        isActive
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-70'
                          : selected
                          ? `border-transparent bg-gradient-to-r ${item.accent} text-white shadow-md`
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="inline-flex items-center justify-between w-full text-xs font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {item.label.replace(' Wallet', '')}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-normal uppercase tracking-wider bg-slate-200/80 text-slate-500 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">{selectedMeta.note}</p>
            </div>

            <button
              className="btn-gradient inline-flex items-center justify-center gap-2 lg:col-span-3"
              type="submit"
              disabled={submitting || !canCreateMore || activeWalletTypes.has(walletType)}
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Activating...' : 'Activate Wallets'}
            </button>
          </div>

          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        </form>
      ) : (
        <div className="card-soft border-amber-100 bg-amber-50">
            <p className="text-sm font-semibold text-amber-800">
              {isStudent
                ? 'Student accounts can keep only one Pocket Saver Wallet active.'
                : 'Business accounts can have a maximum of 3 wallets: Travel, Medical, and Pocket Saver.'}
            </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {wallets.map((wallet) => {
          const normalizedType = wallet.walletType === 'personal_wallet' ? 'travelling_wallet' : wallet.walletType;
          const meta = typeMeta[normalizedType] || typeMeta.travelling_wallet;
          const Icon = meta.icon;

          return (
            <div key={wallet._id} className={`card-soft overflow-hidden p-0 border ${meta.border}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-r ${meta.accent} text-white shadow-md`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{wallet.name}</p>
                      <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${meta.pill}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{formatINRPrecise(wallet.balance)}</p>
                    <p className="text-xs text-slate-500">{wallet.transactionsCount} transactions</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
                    <p className="text-[10px] uppercase tracking-wide">Credits</p>
                    <p className="mt-0.5 font-semibold">{formatINR(wallet.totalCredits || 0)}</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 px-3 py-2 text-rose-700">
                    <p className="text-[10px] uppercase tracking-wide">Debits</p>
                    <p className="mt-0.5 font-semibold">{formatINR(wallet.totalDebits || 0)}</p>
                  </div>
                </div>

                {wallet.walletType === 'pocket_saver_wallet' && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                    Last withdrawal: {formatDateText(wallet.lastWithdrawalDate)}
                    {!wallet.canWithdrawNow && wallet.nextEligibleWithdrawalDate
                      ? ` • Next eligible: ${formatDateText(wallet.nextEligibleWithdrawalDate)}`
                      : ''}
                  </p>
                )}

                {wallet.walletType === 'medical_emergency_wallet' && (
                  <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 inline-flex items-center gap-1.5">
                    <ShieldPlus className="h-3.5 w-3.5" />
                    Emergency-ready wallet
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <Link
                    to={`/wallets/${wallet._id}`}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {!wallets.length && (
          <div className="card-soft border-dashed border-slate-200 text-center md:col-span-2 xl:col-span-3">
            <p className="text-base font-semibold text-slate-700">No wallets activated yet</p>
            <p className="mt-1 text-sm text-slate-500">Activate your first wallet by selecting a wallet type.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletsPage;
