import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, Layers3, Plus, Fingerprint, KeyRound, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { startAuthentication } from '@simplewebauthn/browser';
import api from '../api/client';
import { formatDate, formatINR } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const donutColors = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const emptyForm = {
  title: '',
  category: '',
  type: 'expense',
  recurrence: 'none',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
};

const TransactionsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sort, setSort] = useState('desc');
  const [transactions, setTransactions] = useState([]);
  const [dashboard, setDashboard] = useState({ monthlyOverview: [], categoryData: [] });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [actionError, setActionError] = useState('');

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyPin, setVerifyPin] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [fingerprintAssertion, setFingerprintAssertion] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);
  const formCardRef = useRef(null);
  const formFirstInputRef = useRef(null);

  const loadData = async () => {
    try {
      const [txResponse, dashboardResponse] = await Promise.all([
        api.get(`/transactions?sort=${sort === 'asc' ? 'asc' : 'desc'}`),
        api.get('/dashboard'),
      ]);

      setTransactions(txResponse.data);
      setDashboard(dashboardResponse.data);
      setActionError('');
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to load transactions right now.');
    }
  };

  useEffect(() => {
    loadData();
  }, [sort]);

  useEffect(() => {
    if (editingId) setShowForm(true);
  }, [editingId]);

  useEffect(() => {
    if (!showForm) return;
    const frameId = window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formFirstInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [showForm]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === '1') {
      setEditingId(null);
      setShowCategoryPanel(false);
      setForm(emptyForm);
      setShowForm(true);
    }
  }, [location.search]);

  useEffect(() => {
    setVisibleCount(10);
  }, [query, typeFilter, sort]);

  const total = useMemo(() => transactions.length, [transactions]);

  const moneyStats = useMemo(() => {
    const totals = transactions.reduce(
      (acc, item) => {
        const amount = Math.abs(Number(item.amount || 0));
        if (item.type === 'income') acc.income += amount;
        else acc.expense += amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );

    return {
      income: totals.income,
      expense: totals.expense,
      net: totals.income - totals.expense,
    };
  }, [transactions]);

  const monthLabel = useMemo(() => {
    const last = dashboard?.monthlyOverview?.[dashboard.monthlyOverview.length - 1];
    return last?.month || '';
  }, [dashboard]);

  const availableCategories = useMemo(() => {
    const fromTransactions = transactions.map((item) => String(item.category || '').trim()).filter(Boolean);
    const fromCurrentForm = String(form.category || '').trim();
    const merged = [...fromTransactions, ...customCategories, fromCurrentForm].filter(Boolean);
    return Array.from(new Set(merged)).sort((a, b) => a.localeCompare(b));
  }, [transactions, customCategories, form.category]);

  const filteredTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transactions.filter((item) => {
      const matchesType = typeFilter === 'all' ? true : item.type === typeFilter;
      const matchesQuery =
        !normalized ||
        String(item.title || '').toLowerCase().includes(normalized) ||
        String(item.category || '').toLowerCase().includes(normalized);
      return matchesType && matchesQuery;
    });
  }, [transactions, query, typeFilter]);

  const visibleTransactions = useMemo(() => filteredTransactions.slice(0, visibleCount), [filteredTransactions, visibleCount]);

  const formatINRPrecise = (amount = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const badgeClass = (value) => {
    const key = String(value || 'General').toLowerCase();
    const palette = [
      'bg-purple-100 text-purple-700',
      'bg-sky-100 text-sky-700',
      'bg-emerald-100 text-emerald-700',
      'bg-rose-100 text-rose-700',
      'bg-amber-100 text-amber-700',
      'bg-indigo-100 text-indigo-700',
    ];

    let hash = 0;
    for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 997;
    return palette[hash % palette.length];
  };

  const submit = async (event) => {
    event.preventDefault();
    setActionError('');

    const payload = {
      ...form,
      amount: Number(form.amount),
      date: new Date(form.date),
    };

    const needsVerification =
      !editingId &&
      payload.type === 'expense' &&
      (user?.requirePaymentPin || user?.requirePaymentFingerprint);

    if (needsVerification) {
      setPendingPayload(payload);
      setVerifyOpen(true);
      setVerifyError('');
      setVerifyPin('');
      setFingerprintAssertion(null);
      return;
    }

    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to save transaction right now.');
    }
  };

  const verifyFingerprint = async () => {
    if (verifyBusy) return;
    setVerifyError('');
    setVerifyBusy(true);
    try {
      const optionsRes = await api.get('/security/webauthn/auth-options');
      const assertion = await startAuthentication(optionsRes.data);
      setFingerprintAssertion(assertion);
    } catch (requestError) {
      setVerifyError(requestError.response?.data?.message || requestError.message || 'Fingerprint verification failed');
    } finally {
      setVerifyBusy(false);
    }
  };

  const confirmPayment = async () => {
    if (verifyBusy || !pendingPayload) return;
    setVerifyError('');
    setVerifyBusy(true);
    try {
      if (user?.requirePaymentFingerprint && !fingerprintAssertion) {
        setVerifyError('Fingerprint verification required');
        return;
      }

      const res = await api.post('/security/verify-payment', {
        pin: verifyPin,
        assertion: fingerprintAssertion,
      });

      await api.post('/transactions', pendingPayload, {
        headers: {
          'x-payment-token': res.data.paymentToken,
        },
      });

      setVerifyOpen(false);
      setPendingPayload(null);
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (requestError) {
      setVerifyError(requestError.response?.data?.message || 'Payment verification failed');
    } finally {
      setVerifyBusy(false);
    }
  };

  const edit = (item) => {
    setEditingId(item._id);
    setShowCategoryPanel(false);
    setForm({
      title: item.title,
      category: item.category,
      type: item.type,
      recurrence: item.recurrence || (item.isRecurring ? 'monthly' : 'none'),
      amount: item.amount,
      date: new Date(item.date).toISOString().slice(0, 10),
    });
  };

  const remove = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      await loadData();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to delete transaction right now.');
    }
  };

  const addCategory = () => {
    const nextCategory = categoryDraft.trim();
    if (!nextCategory) return;
    if (availableCategories.some((category) => category.toLowerCase() === nextCategory.toLowerCase())) {
      setCategoryDraft('');
      return;
    }
    setCustomCategories((prev) => [...prev, nextCategory]);
    setForm((prev) => ({ ...prev, category: nextCategory }));
    setCategoryDraft('');
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <BarChart3 className="h-3.5 w-3.5" />
              Smart Transaction Hub
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Transactions</h1>
            <p className="mt-1.5 text-sm text-white/85">Track income and expenses with cleaner insights and faster control.</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Income</p>
              <p className="mt-1 text-lg font-bold">{formatINR(moneyStats.income)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Expense</p>
              <p className="mt-1 text-lg font-bold">{formatINR(moneyStats.expense)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Net Flow</p>
              <p className="mt-1 text-lg font-bold">{formatINR(moneyStats.net)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card-soft border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Records</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{total}</p>
        </div>
        <div className="card-soft border-sky-100 bg-gradient-to-br from-sky-50 to-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Month</p>
          <p className="mt-2 text-lg font-bold text-sky-700">{monthLabel || 'No data'}</p>
        </div>
        <div className="card-soft border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg / Transaction</p>
          <p className="mt-2 text-lg font-bold text-indigo-700">{formatINR(total ? (moneyStats.income + moneyStats.expense) / total : 0)}</p>
        </div>
        <div className="card-soft border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Balance Trend</p>
          <p className={`mt-2 text-lg font-bold ${moneyStats.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{moneyStats.net >= 0 ? 'Positive' : 'Watch Spend'}</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
          <div className="card-soft border border-slate-100 bg-gradient-to-br from-white via-white to-emerald-50/50">
            <p className="text-sm font-semibold text-slate-800">Quick Actions</p>

            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryPanel(false);
                  setShowForm((prev) => !prev);
                  if (!editingId && !showForm) setForm(emptyForm);
                }}
                className="group flex w-full items-start gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-3 py-3 text-left shadow-sm transition hover:shadow-md"
              >
                <span className="mt-0.5 rounded-xl bg-emerald-500/15 p-2 text-emerald-700">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">Add Transaction</span>
                  <span className="block text-xs text-slate-500">Record income or expense instantly</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setShowCategoryPanel((prev) => !prev);
                }}
                className="group flex w-full items-start gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white px-3 py-3 text-left shadow-sm transition hover:shadow-md"
              >
                <span className="mt-0.5 rounded-xl bg-violet-500/15 p-2 text-violet-700">
                  <Layers3 className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">Categories</span>
                  <span className="block text-xs text-slate-500">Structure your spending better</span>
                </span>
              </button>
            </div>
          </div>

          {showCategoryPanel && (
            <div className="card-soft space-y-3 border border-violet-100 bg-gradient-to-br from-white to-violet-50/40">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">Category Manager</p>
                <button type="button" onClick={() => setShowCategoryPanel(false)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200">
                  Close
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  placeholder="Add category"
                  value={categoryDraft}
                  onChange={(event) => setCategoryDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addCategory();
                    }
                  }}
                />
                <button type="button" onClick={addCategory} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500">
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableCategories.length === 0 ? (
                  <p className="text-xs text-slate-500">No categories yet.</p>
                ) : (
                  availableCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, category }));
                        setShowCategoryPanel(false);
                        setShowForm(true);
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${badgeClass(category)} hover:opacity-85`}
                    >
                      {category}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {showForm && (
            <form ref={formCardRef} className="card-soft space-y-3 border border-slate-100 bg-gradient-to-br from-white to-cyan-50/40" onSubmit={submit}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">{editingId ? 'Update Transaction' : 'Add Transaction'}</p>
                <button type="button" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(emptyForm);
                }} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200">
                  Close
                </button>
              </div>

              <input ref={formFirstInputRef} className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" placeholder="Transaction title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <input className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" list="transaction-categories" placeholder="Category" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} required />
              <datalist id="transaction-categories">
                {availableCategories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              <div className="grid grid-cols-2 gap-3">
                <select className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <input className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" type="number" min="0" placeholder="Amount" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} required />
              </div>
              <select
                className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                value={form.recurrence}
                onChange={(event) => setForm((prev) => ({ ...prev, recurrence: event.target.value }))}
              >
                <option value="none">One-time (No recurrence)</option>
                <option value="daily">Recurring Daily</option>
                <option value="weekly">Recurring Weekly</option>
                <option value="monthly">Recurring Monthly</option>
                <option value="yearly">Recurring Yearly</option>
              </select>
              <input className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} required />

              <button className="btn-gradient w-full rounded-xl" type="submit">
                {editingId ? 'Update Transaction' : 'Add Transaction'}
              </button>
            </form>
          )}
        </aside>

        <main className="space-y-6 lg:col-span-9">
          {verifyOpen && (
            <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/30 px-4">
              <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-pink-100 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-slate-900">Payment Verification</p>
                    <p className="mt-1 text-sm text-slate-500">Complete Fingerprint + PIN to pay</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyOpen(false);
                      setPendingPayload(null);
                    }}
                    className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  {user?.requirePaymentFingerprint && (
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-violet-600" />
                          <p className="text-sm font-semibold text-slate-800">Fingerprint</p>
                        </div>
                        {fingerprintAssertion ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Verified</span>
                        ) : (
                          <button
                            type="button"
                            onClick={verifyFingerprint}
                            disabled={verifyBusy}
                            className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-500 disabled:opacity-60"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Use your device biometric to continue.</p>
                    </div>
                  )}

                  {user?.requirePaymentPin && (
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-amber-700" />
                        <p className="text-sm font-semibold text-slate-800">Payment PIN</p>
                      </div>
                      <input
                        className="input-soft mt-3"
                        inputMode="numeric"
                        placeholder="Enter PIN"
                        value={verifyPin}
                        onChange={(e) => setVerifyPin(e.target.value)}
                      />
                      <p className="mt-2 text-xs text-slate-500">Enter your 4–6 digit PIN.</p>
                    </div>
                  )}

                  {verifyError && <p className="text-sm font-semibold text-rose-600">{verifyError}</p>}

                  <button
                    type="button"
                    onClick={confirmPayment}
                    disabled={verifyBusy}
                    className="btn-gradient w-full"
                  >
                    {verifyBusy ? 'Verifying…' : 'Verify & Pay'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-soft h-80 border border-slate-100 bg-gradient-to-br from-white to-emerald-50/40">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Monthly Overview</p>
              </div>

              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={dashboard.monthlyOverview} margin={{ top: 12, right: 6, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatINR(Number(value || 0))} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 2 }} />
                  <Bar name="Income" dataKey="income" fill="#22c55e" radius={[10, 10, 0, 0]} />
                  <Bar name="Expenses" dataKey="expense" fill="#ef4444" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card-soft h-80 border border-slate-100 bg-gradient-to-br from-white to-violet-50/40">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Expenses by Category</p>
                <p className="text-xs text-slate-400">{monthLabel}</p>
              </div>

              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={dashboard.categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={88}
                    stroke="transparent"
                  >
                    {dashboard.categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatINR(Number(value || 0))} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-soft overflow-hidden border border-slate-100 bg-gradient-to-br from-white via-white to-slate-50/70">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transactions</p>
              <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                <p className="text-xs text-slate-400">Showing {visibleTransactions.length} of {filteredTransactions.length}</p>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                  placeholder="Search title/category"
                />
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                >
                  <option value="desc">Recent</option>
                  <option value="asc">Oldest</option>
                </select>
              </div>
            </div>

            {actionError && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{actionError}</p>}

            {filteredTransactions.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">No matching transactions</p>
                <p className="mt-1 text-xs text-slate-500">Try changing search, type, or sort options.</p>
              </div>
            ) : (
              <>
                <div className="mt-4 hidden overflow-hidden md:block">
                <table className="w-full table-fixed border-separate [border-spacing:0_8px] text-left text-xs">
                  <thead className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="w-[33%] rounded-l-xl bg-slate-100/90 px-4 py-2.5">Transaction</th>
                    <th className="w-[14%] bg-slate-100/90 px-4 py-2.5">Category</th>
                    <th className="w-[13%] bg-slate-100/90 px-4 py-2.5">Type</th>
                    <th className="w-[16%] bg-slate-100/90 px-4 py-2.5">Amount</th>
                    <th className="w-[10%] bg-slate-100/90 px-4 py-2.5">Date</th>
                    <th className="w-[14%] rounded-r-xl bg-slate-100/90 px-4 py-2.5 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((item) => {
                    const isIncome = item.type === 'income';
                    const amount = Math.abs(Number(item.amount || 0));
                    const category = item.category || 'General';
                    const subtitle = item.wallet?.name || (isIncome ? 'Income record' : 'Expense record');
                    const recurringLabel = item.recurrence && item.recurrence !== 'none' ? ` • Recurs ${item.recurrence}` : '';

                    return (
                      <tr key={item._id} className="group bg-white/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <td className="rounded-l-2xl border border-r-0 border-slate-100 bg-gradient-to-r from-white to-slate-50/60 px-4 py-3.5 align-middle">
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <div className="min-w-0">
                              <p className="max-w-[300px] truncate text-lg font-semibold text-slate-800">{item.title}</p>
                              <p className="mt-1 max-w-[320px] truncate text-xs text-slate-500">{subtitle}{recurringLabel}</p>
                            </div>
                          </div>
                        </td>
                        <td className="border border-x-0 border-slate-100 px-4 py-3.5 align-middle">
                          <span className={`inline-flex max-w-[120px] truncate rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-white/60 ${badgeClass(category)}`}>
                            {category}
                          </span>
                        </td>
                        <td className="border border-x-0 border-slate-100 px-4 py-3.5 align-middle">
                          <span
                            className={
                              isIncome
                                ? 'inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80'
                                : 'inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200/80'
                            }
                          >
                            {isIncome ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {isIncome ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td className="border border-x-0 border-slate-100 px-4 py-3.5 align-middle">
                          <span className={isIncome ? 'inline-flex items-center gap-1 whitespace-nowrap text-base font-bold text-emerald-600' : 'inline-flex items-center gap-1 whitespace-nowrap text-base font-bold text-rose-600'}>
                            {isIncome ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                            {isIncome ? '+' : '-'}{formatINRPrecise(amount)}
                          </span>
                        </td>
                        <td className="border border-x-0 border-slate-100 px-4 py-3.5 align-middle text-slate-500 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="rounded-r-2xl border border-l-0 border-slate-100 px-4 py-3.5 align-middle text-left">
                          <div className="flex flex-wrap items-center gap-1.5">
                          <button onClick={() => edit(item)} className="w-fit rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                            Edit
                          </button>
                          <button onClick={() => remove(item._id)} className="w-fit rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">
                            Delete
                          </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
                </div>

                <div className="mt-4 space-y-3 md:hidden">
                  {visibleTransactions.map((item) => {
                    const isIncome = item.type === 'income';
                    const amount = Math.abs(Number(item.amount || 0));
                    const category = item.category || 'General';
                    const subtitle = item.wallet?.name || (isIncome ? 'Income record' : 'Expense record');
                    const recurringLabel = item.recurrence && item.recurrence !== 'none' ? ` • Recurs ${item.recurrence}` : '';

                    return (
                      <div key={item._id} className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/70 px-4 py-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-800">{item.title}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{subtitle}{recurringLabel}</p>
                          </div>
                          <p className={isIncome ? 'whitespace-nowrap text-sm font-bold text-emerald-600' : 'whitespace-nowrap text-sm font-bold text-rose-600'}>
                            {isIncome ? '+' : '-'}{formatINRPrecise(amount)}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-4 py-1.5 text-xs font-semibold ${badgeClass(category)}`}>
                            {category}
                          </span>
                          <span
                            className={
                              isIncome
                                ? 'inline-flex items-center gap-1 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700'
                                : 'inline-flex items-center gap-1 rounded-full bg-rose-100 px-4 py-1.5 text-xs font-semibold text-rose-700'
                            }
                          >
                            {isIncome ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {isIncome ? 'Income' : 'Expense'}
                          </span>
                          <span className="text-xs font-medium text-slate-500">{formatDate(item.date)}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button onClick={() => edit(item)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                            Edit
                          </button>
                          <button onClick={() => remove(item._id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {visibleTransactions.length < filteredTransactions.length && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                      Load 10 more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TransactionsPage;
