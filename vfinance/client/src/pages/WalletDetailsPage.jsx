import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HeartPulse, PiggyBank, ShieldPlus, Wallet, Plus, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { formatDate, formatINR } from '../utils/format';
import { requestPaymentToken } from '../utils/paymentVerification';

const parseTransactionTitle = (title) => {
  const raw = String(title || '');
  const [primary, ...rest] = raw.split('•');
  return {
    primary: primary.trim() || 'Wallet Transaction',
    description: rest.join('•').trim(),
  };
};

const typeMeta = {
  travelling_wallet: {
    label: 'Travelling Wallet',
    icon: Wallet,
    chip: 'bg-sky-100 text-sky-700',
    accent: 'from-sky-500 to-blue-500',
  },
  personal_wallet: {
    label: 'Travelling Wallet',
    icon: Wallet,
    chip: 'bg-sky-100 text-sky-700',
    accent: 'from-sky-500 to-blue-500',
  },
  medical_emergency_wallet: {
    label: 'Medical Emergency Wallet',
    icon: HeartPulse,
    chip: 'bg-rose-100 text-rose-700',
    accent: 'from-rose-500 to-red-500',
  },
  pocket_saver_wallet: {
    label: 'Pocket Saver Wallet',
    icon: PiggyBank,
    chip: 'bg-amber-100 text-amber-700',
    accent: 'from-amber-500 to-orange-500',
  },
};

const WalletDetailsPage = () => {
  const { id } = useParams();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [addAmount, setAddAmount] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [actionError, setActionError] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadDetails = async () => {
    const response = await api.get(`/wallets/${id}`);
    setWallet(response.data.wallet);
    setTransactions(response.data.transactions);
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const validateAmount = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      return null;
    }
    return amount;
  };

  const addMoney = async (event) => {
    event.preventDefault();
    const amount = validateAmount(addAmount);
    if (!amount) {
      setActionError('Please enter a valid amount greater than zero.');
      return;
    }

    setActionError('');
    setProcessing(true);
    try {
      const pin = window.prompt('Enter your 4-digit payment PIN to add money:');
      const paymentToken = await requestPaymentToken(pin || '');

      await api.post(`/wallets/${id}/add-money`, {
        amount,
        description: addDescription,
        verificationToken: paymentToken,
      }, {
        headers: { 'x-payment-token': paymentToken },
      });

      setAddAmount('');
      setAddDescription('');
      await loadDetails();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || requestError.message || 'Unable to add money right now');
    } finally {
      setProcessing(false);
    }
  };

  const withdrawMoney = async (event) => {
    event.preventDefault();

    const amount = validateAmount(withdrawAmount);
    if (!amount) {
      setActionError('Please enter a valid amount greater than zero.');
      return;
    }

    if (wallet?.walletType === 'pocket_saver_wallet' && wallet?.canWithdrawNow === false) {
      const nextDate = wallet?.nextEligibleWithdrawalDate
        ? new Date(wallet.nextEligibleWithdrawalDate).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        })
        : 'later';
      setActionError(`Withdrawal not allowed. Next eligible withdrawal on ${nextDate}.`);
      return;
    }

    setActionError('');
    setProcessing(true);
    try {
      const pin = window.prompt('Enter your 4-digit payment PIN to withdraw money:');
      const paymentToken = await requestPaymentToken(pin || '');

      await api.post(`/wallets/${id}/withdraw-money`, {
        amount,
        description: withdrawDescription,
        verificationToken: paymentToken,
      }, {
        headers: { 'x-payment-token': paymentToken },
      });

      setWithdrawAmount('');
      setWithdrawDescription('');
      await loadDetails();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || requestError.message || 'Unable to withdraw right now');
    } finally {
      setProcessing(false);
    }
  };

  if (!wallet) {
    return <div className="card-soft">Loading wallet...</div>;
  }

  const meta = typeMeta[wallet.walletType] || typeMeta.travelling_wallet;
  const TypeIcon = meta.icon;
  const nextEligibleText = wallet.nextEligibleWithdrawalDate
    ? new Date(wallet.nextEligibleWithdrawalDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
    : null;
  const recentTransactions = transactions.slice(0, 14);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3">
              <span className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-r ${meta.accent} text-white shadow-md`}>
                <TypeIcon className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{wallet.name}</h1>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chip}`}>
                  {meta.label}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm text-white/75">Current Balance</p>
            <p className="text-4xl font-black">{formatINR(wallet.balance)}</p>

            {wallet.walletType === 'medical_emergency_wallet' && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100">
                <ShieldPlus className="h-4 w-4" />
                Emergency-focused wallet indicator active
              </p>
            )}

            {wallet.walletType === 'pocket_saver_wallet' && (
              <p className="mt-3 rounded-xl bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-100">
                Last withdrawal: {wallet.lastWithdrawalDate ? formatDate(wallet.lastWithdrawalDate) : '—'}
                {wallet.canWithdrawNow === false && nextEligibleText ? ` • Next eligible: ${nextEligibleText}` : ''}
              </p>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Total Credits</p>
              <p className="mt-1 text-2xl font-bold text-emerald-300">{formatINR(wallet.totalCredits || 0)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Total Debits</p>
              <p className="mt-1 text-2xl font-bold text-rose-300">{formatINR(wallet.totalDebits || 0)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={addMoney} className="group rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/70 via-white to-white p-6 shadow-soft backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 transition duration-300 group-hover:scale-105">
              <Plus className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Add Money</h3>
              <p className="text-xs text-slate-500">Instantly credit this wallet</p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-semibold text-slate-700">Amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">₹</span>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-base font-medium text-slate-900 outline-none ring-0 placeholder:text-slate-400 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="0.00"
              value={addAmount}
              onChange={(event) => setAddAmount(event.target.value)}
              required
            />
          </div>

          <label className="mb-2 mt-5 block text-sm font-semibold text-slate-700">Description (Optional)</label>
          <input
            type="text"
            maxLength={80}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            placeholder="e.g., Salary, Gift, etc."
            value={addDescription}
            onChange={(event) => setAddDescription(event.target.value)}
          />

          <button
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-lg font-semibold text-white shadow-sm transition duration-200 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.99] disabled:opacity-60"
            disabled={processing}
            type="submit"
          >
            {processing ? 'Processing...' : 'Add Money'}
          </button>
        </form>

        <form onSubmit={withdrawMoney} className="group rounded-3xl border border-rose-100 bg-gradient-to-b from-rose-50/70 via-white to-white p-6 shadow-soft backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-700 transition duration-300 group-hover:scale-105">
              <ArrowRight className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Withdraw Money</h3>
              <p className="text-xs text-slate-500">Debit from available wallet balance</p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-semibold text-slate-700">Amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">₹</span>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-base font-medium text-slate-900 outline-none ring-0 placeholder:text-slate-400 transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              required
            />
          </div>

          <label className="mb-2 mt-5 block text-sm font-semibold text-slate-700">Description (Optional)</label>
          <input
            type="text"
            maxLength={80}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            placeholder="e.g., Emergency, Shopping, etc."
            value={withdrawDescription}
            onChange={(event) => setWithdrawDescription(event.target.value)}
          />

          <button
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-3 text-lg font-semibold text-white shadow-sm transition duration-200 hover:from-rose-600 hover:to-red-600 active:scale-[0.99] disabled:opacity-60"
            type="submit"
            disabled={processing || (wallet.walletType === 'pocket_saver_wallet' && wallet.canWithdrawNow === false)}
          >
            {wallet.walletType === 'pocket_saver_wallet' && wallet.canWithdrawNow === false
              ? `Locked until ${nextEligibleText || 'eligible date'}`
              : processing
                ? 'Processing...'
                : 'Withdraw Money'}
          </button>
        </form>
      </div>

      {actionError && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">
          {actionError}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Transaction History</h3>
            <p className="text-xs text-slate-500">Latest wallet credits and debits</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {transactions.length} entries
          </span>
        </div>

        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No transactions yet for this wallet.
            </div>
          ) : (
            recentTransactions.map((item) => {
              const details = parseTransactionTitle(item.title);

              return (
                <div key={item._id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 transition duration-200 hover:-translate-y-px hover:bg-slate-100/80">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{details.primary}</p>
                    {details.description && <p className="truncate text-xs text-slate-500">{details.description}</p>}
                    <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.type === 'income' ? '+' : '-'} {formatINR(item.amount)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletDetailsPage;
