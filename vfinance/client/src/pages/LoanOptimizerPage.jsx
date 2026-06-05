import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  BadgeIndianRupee,
  Coins,
  Gauge,
  Landmark,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import api from '../api/client';
import { formatINR } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { clearDraft, loadDraft, saveDraft } from '../utils/draftStorage';

const emptyLoanForm = {
  name: '',
  lender: '',
  annualRate: '',
  remainingPrincipal: '',
  emi: '',
  tenureMonths: '',
  startDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

const formatCompactINR = (value = 0) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const LoanOptimizerPage = () => {
  const { user } = useAuth();
  const draftScope = 'loan-optimizer-form-v1';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [extraMonthly, setExtraMonthly] = useState(2000);
  const [summary, setSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loanForm, setLoanForm] = useState(emptyLoanForm);
  const [saving, setSaving] = useState(false);
  const formCardRef = useRef(null);
  const formFirstInputRef = useRef(null);

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/loans/optimizer/summary?extra=${Number(extraMonthly) || 0}`);
      setSummary(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load loan optimizer right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [extraMonthly]);

  useEffect(() => {
    if (!showForm) return;
    const frameId = window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formFirstInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [showForm]);

  useEffect(() => {
    if (!showForm) return;
    if (!user) return;
    if (editingId) return;

    const draft = loadDraft(draftScope, user);
    if (!draft) return;

    const hasContent = Boolean(draft.name || draft.lender || draft.annualRate || draft.remainingPrincipal || draft.emi || draft.notes);
    if (!hasContent) return;

    setLoanForm((prev) => ({ ...prev, ...draft }));
  }, [showForm, user, editingId]);

  useEffect(() => {
    if (!showForm) return;
    if (!user) return;
    if (editingId) return;

    const hasContent = Boolean(loanForm.name || loanForm.lender || loanForm.annualRate || loanForm.remainingPrincipal || loanForm.emi || loanForm.notes);
    if (!hasContent) {
      clearDraft(draftScope, user);
      return;
    }

    saveDraft(draftScope, user, loanForm);
  }, [loanForm, user, editingId, showForm]);

  const loans = useMemo(() => summary?.loans || [], [summary]);
  const overview = summary?.overview || {
    totalLoans: 0,
    totalPrincipal: 0,
    weightedAverageRate: 0,
    baselineInterest: 0,
    baselineMonths: 0,
  };

  const recommendation = summary?.recommendation || {
    preferredMethod: 'avalanche',
    reasoning: '',
    interestSaved: 0,
    monthsSaved: 0,
  };

  const strategy = summary?.strategies || {
    baseline: { months: 0, totalInterest: 0, payoffOrder: [] },
    snowball: { months: 0, totalInterest: 0, payoffOrder: [] },
    avalanche: { months: 0, totalInterest: 0, payoffOrder: [] },
  };

  const openCreate = () => {
    setEditingId(null);
    setLoanForm(emptyLoanForm);
    setShowForm(true);
  };

  const openEdit = (loan) => {
    setEditingId(loan._id);
    setLoanForm({
      name: loan.name || '',
      lender: loan.lender || '',
      annualRate: String(loan.annualRate || ''),
      remainingPrincipal: String(loan.remainingPrincipal || ''),
      emi: String(loan.emi || ''),
      tenureMonths: loan.tenureMonths ? String(loan.tenureMonths) : '',
      startDate: loan.startDate ? new Date(loan.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: loan.notes || '',
    });
    setShowForm(true);
  };

  const saveLoan = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...loanForm,
        annualRate: Number(loanForm.annualRate),
        remainingPrincipal: Number(loanForm.remainingPrincipal),
        emi: Number(loanForm.emi),
        tenureMonths: loanForm.tenureMonths ? Number(loanForm.tenureMonths) : null,
      };

      if (editingId) {
        await api.put(`/loans/${editingId}`, payload);
      } else {
        await api.post('/loans', payload);
        clearDraft(draftScope, user);
      }

      setShowForm(false);
      setEditingId(null);
      setLoanForm(emptyLoanForm);
      await loadSummary();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save loan right now.');
    } finally {
      setSaving(false);
    }
  };

  const removeLoan = async (loanId) => {
    if (!window.confirm('Delete this loan from optimizer?')) return;
    try {
      await api.delete(`/loans/${loanId}`);
      await loadSummary();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete loan right now.');
    }
  };

  if (loading && !summary) {
    return <div className="card-soft">Loading Smart EMI & Loan Optimizer...</div>;
  }

  return (
    <div className="space-y-5 animate-dashboard-in">
      <section className="rounded-3xl bg-gradient-to-r from-slate-800 via-slate-700 to-blue-700 p-6 text-white shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/35 bg-slate-300/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
              <Sparkles className="h-3.5 w-3.5" />
              Smart EMI & Loan Optimizer
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Pay loans smarter, close debt faster</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Add all active loans, track projected interest burden, and compare Snowball vs Avalanche with a personalized
              prepayment plan.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm lg:min-w-[320px]">
            <p className="text-xs uppercase tracking-wide text-white/70">Recommended Method</p>
            <p className="mt-1 text-2xl font-black capitalize">{recommendation.preferredMethod}</p>
            <p className="mt-1 text-sm text-white/80">{recommendation.reasoning}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white/10 p-2">
                <p className="text-white/70">Interest Saved</p>
                <p className="mt-1 font-bold text-emerald-200">{formatCompactINR(recommendation.interestSaved)}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-2">
                <p className="text-white/70">Months Saved</p>
                <p className="mt-1 font-bold text-sky-200">{recommendation.monthsSaved}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card-soft border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Loans</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{overview.totalLoans}</p>
        </div>
        <div className="card-soft border-rose-100 bg-gradient-to-br from-rose-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Outstanding Principal</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{formatCompactINR(overview.totalPrincipal)}</p>
        </div>
        <div className="card-soft border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Weighted Avg Interest</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{Number(overview.weightedAverageRate || 0).toFixed(2)}%</p>
        </div>
        <div className="card-soft border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Projected Interest</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{formatCompactINR(overview.baselineInterest)}</p>
        </div>
      </section>

      <section className="card-soft border border-slate-200 bg-gradient-to-br from-white to-indigo-50/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Prepayment budget simulator</p>
            <p className="mt-1 text-xs text-slate-500">Set monthly extra payment and compare closure strategy outcomes instantly.</p>
          </div>

          <div className="w-full lg:w-[420px]">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Extra monthly prepayment</span>
              <span className="font-semibold text-slate-700">{formatCompactINR(extraMonthly)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="500"
              value={extraMonthly}
              onChange={(event) => setExtraMonthly(Number(event.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-700 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-300 hover:from-slate-600 hover:to-blue-600"
          >
            <Plus className="h-4 w-4" />
            Add Loan
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {showForm && (
        <section ref={formCardRef} className="card-soft border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Loan' : 'Add New Loan'}</h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Close
            </button>
          </div>

          <form onSubmit={saveLoan} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input ref={formFirstInputRef} className="input-soft" placeholder="Loan Name" value={loanForm.name} onChange={(event) => setLoanForm((prev) => ({ ...prev, name: event.target.value }))} required />
            <input className="input-soft" placeholder="Lender" value={loanForm.lender} onChange={(event) => setLoanForm((prev) => ({ ...prev, lender: event.target.value }))} />
            <input className="input-soft" type="number" min="0" step="0.01" placeholder="Annual Rate %" value={loanForm.annualRate} onChange={(event) => setLoanForm((prev) => ({ ...prev, annualRate: event.target.value }))} required />
            <input className="input-soft" type="number" min="1" step="0.01" placeholder="Remaining Principal" value={loanForm.remainingPrincipal} onChange={(event) => setLoanForm((prev) => ({ ...prev, remainingPrincipal: event.target.value }))} required />
            <input className="input-soft" type="number" min="1" step="0.01" placeholder="Monthly EMI" value={loanForm.emi} onChange={(event) => setLoanForm((prev) => ({ ...prev, emi: event.target.value }))} required />
            <input className="input-soft" type="number" min="1" step="1" placeholder="Tenure (months)" value={loanForm.tenureMonths} onChange={(event) => setLoanForm((prev) => ({ ...prev, tenureMonths: event.target.value }))} />
            <input className="input-soft" type="date" value={loanForm.startDate} onChange={(event) => setLoanForm((prev) => ({ ...prev, startDate: event.target.value }))} />
            <input className="input-soft md:col-span-2" placeholder="Notes (optional)" value={loanForm.notes} onChange={(event) => setLoanForm((prev) => ({ ...prev, notes: event.target.value }))} />
            <button className="btn-gradient" disabled={saving} type="submit">{saving ? 'Saving...' : editingId ? 'Update Loan' : 'Create Loan'}</button>
          </form>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card-soft border border-slate-100 bg-gradient-to-br from-white to-violet-50/50">
          <div className="mb-3 flex items-center gap-2">
            <BadgeIndianRupee className="h-4 w-4 text-violet-600" />
            <h3 className="text-base font-bold text-slate-900">Interest Burden by Loan</h3>
          </div>

          <div className="space-y-2">
            {(summary?.burden || []).map((item) => (
              <div key={item.loanId} className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">APR {Number(item.annualRate || 0).toFixed(2)}% • EMI {formatINR(item.emi || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Projected Interest</p>
                    <p className="font-bold text-rose-600">{formatCompactINR(item.projectedInterest)}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!summary?.burden || summary.burden.length === 0) && (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
                Add loans to view interest burden analytics.
              </p>
            )}
          </div>
        </div>

        <div className="card-soft border border-slate-100 bg-gradient-to-br from-white to-amber-50/50">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">Which Loan to Close First</h3>
          </div>

          <div className="space-y-2">
            {(summary?.closeFirst || []).map((item) => (
              <div key={item.loanId} className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">#{item.rank} {item.name}</p>
                    <p className="text-xs text-slate-500">APR {Number(item.annualRate || 0).toFixed(2)}% • {formatCompactINR(item.remainingPrincipal)} remaining</p>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.reason}</p>
              </div>
            ))}
            {(!summary?.closeFirst || summary.closeFirst.length === 0) && (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
                Close-priority order appears after you add loans.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="card-soft border border-slate-100 bg-gradient-to-br from-white to-slate-50">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <Gauge className="h-3.5 w-3.5" /> Baseline
          </div>
          <p className="text-sm text-slate-500">No extra prepayment</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{strategy.baseline.months} mo</p>
          <p className="mt-1 text-xs text-slate-500">Interest: {formatCompactINR(strategy.baseline.totalInterest)}</p>
        </div>

        <div className="card-soft border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <PiggyBank className="h-3.5 w-3.5" /> Debt Snowball
          </div>
          <p className="text-sm text-slate-500">Close smallest balance first</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{strategy.snowball.months} mo</p>
          <p className="mt-1 text-xs text-slate-500">Interest: {formatCompactINR(strategy.snowball.totalInterest)}</p>
        </div>

        <div className="card-soft border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            <ArrowUpDown className="h-3.5 w-3.5" /> Debt Avalanche
          </div>
          <p className="text-sm text-slate-500">Close highest interest first</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{strategy.avalanche.months} mo</p>
          <p className="mt-1 text-xs text-slate-500">Interest: {formatCompactINR(strategy.avalanche.totalInterest)}</p>
        </div>
      </section>

      <section className="card-soft border border-slate-200 bg-white">
        <div className="mb-3 flex items-center gap-2">
          <Landmark className="h-4 w-4 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Your Loans</h3>
        </div>

        <div className="space-y-2">
          {loans.map((loan) => (
            <div key={loan._id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-slate-800">{loan.name}</p>
                <p className="text-xs text-slate-500">{loan.lender || 'Lender not specified'} • APR {Number(loan.annualRate || 0).toFixed(2)}%</p>
                <p className="mt-1 text-xs text-slate-500">Remaining {formatCompactINR(loan.remainingPrincipal)} • EMI {formatINR(loan.emi || 0)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => openEdit(loan)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                  Edit
                </button>
                <button type="button" onClick={() => removeLoan(loan._id)} className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}

          {loans.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-base font-semibold text-slate-700">No loans added yet</p>
              <p className="mt-1 text-sm text-slate-500">Add your first loan to unlock optimization intelligence.</p>
            </div>
          )}
        </div>
      </section>

      <section className="card-soft border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <Coins className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-slate-800">Prepayment Plan Suggestion</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 capitalize">
            Best fit: {recommendation.preferredMethod}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          With extra monthly prepayment of <span className="font-semibold text-slate-800">{formatCompactINR(extraMonthly)}</span>, you can save
          approximately <span className="font-semibold text-emerald-700"> {formatCompactINR(recommendation.interestSaved)} </span>
          in interest and close your debt about <span className="font-semibold text-emerald-700">{recommendation.monthsSaved} months</span> earlier.
        </p>
      </section>
    </div>
  );
};

export default LoanOptimizerPage;
