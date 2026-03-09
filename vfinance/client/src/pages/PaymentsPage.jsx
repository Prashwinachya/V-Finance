import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  BellRing,
  Camera,
  CircleDot,
  CreditCard,
  Landmark,
  Plus,
  QrCode,
  RefreshCw,
  ScanLine,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react';
import api from '../api/client';
import { formatDate, formatINR } from '../utils/format';

const kindOptions = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'loan_repayment', label: 'Loan Repayment' },
  { value: 'bill', label: 'Bill Payment' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  title: '',
  payee: '',
  kind: 'subscription',
  amount: '',
  dueDay: '',
  alertDaysBefore: 3,
  notes: '',
  isActive: true,
};

const formatCompactINR = (amount = 0) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(amount || 0));

const statusMeta = {
  paid: 'bg-emerald-100 text-emerald-700',
  upcoming: 'bg-indigo-100 text-indigo-700',
  overdue: 'bg-rose-100 text-rose-700',
};

const PaymentsPage = () => {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [overview, setOverview] = useState({ summary: {}, payments: [], leftoverBalance: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [scanAmount, setScanAmount] = useState('');
  const [scanBusy, setScanBusy] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const formCardRef = useRef(null);
  const formFirstInputRef = useRef(null);

  const loadOverview = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/payments/overview');
      setOverview(response.data || { summary: {}, payments: [], leftoverBalance: 0 });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load payments data.');
    } finally {
      setLoading(false);
    }
  };

  const stopScanner = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const detectLoop = async () => {
    if (!videoRef.current || !detectorRef.current) return;

    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes && barcodes.length > 0) {
        const value = String(barcodes[0].rawValue || '').trim();
        if (value) {
          setScanCode(value);
          stopScanner();
          return;
        }
      }
    } catch (_error) {
      // Ignore per-frame detection errors and keep loop running.
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  };

  const startScanner = async () => {
    if (!('mediaDevices' in navigator)) {
      setError('Camera access is not supported on this device/browser.');
      return;
    }

    if (!('BarcodeDetector' in window)) {
      setError('Real-time barcode scanning is not supported in this browser. Use manual code input.');
      return;
    }

    try {
      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'upc_a'] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      rafRef.current = requestAnimationFrame(detectLoop);
    } catch (_error) {
      setError('Unable to start camera scanner. Please allow camera permission or use manual code input.');
    }
  };

  useEffect(() => {
    loadOverview();
    return () => stopScanner();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('scan') === '1') {
      setScannerOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (scannerOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      if (!scannerOpen) stopScanner();
    };
  }, [scannerOpen]);

  useEffect(() => {
    if (!showForm) return;
    const frameId = window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formFirstInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [showForm]);

  const grouped = useMemo(() => {
    const items = overview.payments || [];
    return {
      alerts: items.filter((item) => item.alert),
      active: items.filter((item) => item.isActive),
    };
  }, [overview]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || '',
      payee: item.payee || '',
      kind: item.kind || 'subscription',
      amount: String(item.amount || ''),
      dueDay: String(item.dueDay || ''),
      alertDaysBefore: Number(item.alertDaysBefore ?? 3),
      notes: item.notes || '',
      isActive: item.isActive !== false,
    });
    setShowForm(true);
  };

  const savePayment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        dueDay: Number(form.dueDay),
        alertDaysBefore: Number(form.alertDaysBefore),
      };

      if (editingId) {
        await api.put(`/payments/${editingId}`, payload);
      } else {
        await api.post('/payments', payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadOverview();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save payment.');
    } finally {
      setSaving(false);
    }
  };

  const removePayment = async (id) => {
    if (!window.confirm('Delete this scheduled payment?')) return;

    try {
      await api.delete(`/payments/${id}`);
      await loadOverview();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete scheduled payment.');
    }
  };

  const payNow = async (id, amount) => {
    try {
      await api.post(`/payments/${id}/pay-now`, { amount });
      await loadOverview();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to complete payment.');
    }
  };

  const scanAndPay = async () => {
    setScanBusy(true);
    setError('');

    try {
      await api.post('/payments/scan-pay', {
        code: scanCode,
        amount: Number(scanAmount),
      });
      setScanCode('');
      setScanAmount('');
      await loadOverview();
      setScannerOpen(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to process scan payment.');
    } finally {
      setScanBusy(false);
    }
  };

  if (loading) {
    return <div className="card-soft">Loading Payment Hub...</div>;
  }

  return (
    <div className="space-y-5 animate-dashboard-in">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 p-6 text-white shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              Payment Hub
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Subscriptions, repayments & instant scan pay</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              Add recurring monthly commitments, get due alerts early, and pay instantly from leftover account balance.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/70">Available Leftover Balance</p>
            <p className="mt-1 text-4xl font-black">{formatCompactINR(overview.leftoverBalance || 0)}</p>
            <p className="mt-1 text-sm text-white/80">Used automatically for Pay Now and Scan & Pay</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card-soft border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Scheduled Payments</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{overview.summary?.totalScheduled || 0}</p>
        </div>
        <div className="card-soft border-rose-100 bg-gradient-to-br from-rose-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Alerts</p>
          <p className="mt-2 text-3xl font-black text-rose-600">{overview.summary?.alertCount || 0}</p>
        </div>
        <div className="card-soft border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Overdue</p>
          <p className="mt-2 text-3xl font-black text-amber-600">{overview.summary?.overdueCount || 0}</p>
        </div>
        <div className="card-soft border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Monthly Outflow</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{formatCompactINR(overview.summary?.monthlyOutflow || 0)}</p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {showForm && (
        <section ref={formCardRef} className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-fuchsia-50/40 p-4 shadow-soft sm:p-5">
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-fuchsia-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-indigo-200/30 blur-3xl" />

          <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" />
                Smart Payment Setup
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">{editingId ? 'Edit Scheduled Payment' : 'Add Scheduled Payment'}</h2>
              <p className="mt-1 text-xs text-slate-600">Create monthly reminders with alert timing and one-tap pay support.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Close
            </button>
          </div>

          <form onSubmit={savePayment} className="relative grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input ref={formFirstInputRef} className="input-soft rounded-2xl border-slate-200 bg-white/85 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" placeholder="Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
            <input className="input-soft rounded-2xl border-slate-200 bg-white/85 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" placeholder="Payee" value={form.payee} onChange={(event) => setForm((prev) => ({ ...prev, payee: event.target.value }))} />
            <select className="input-soft rounded-2xl border-slate-200 bg-white/85 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={form.kind} onChange={(event) => setForm((prev) => ({ ...prev, kind: event.target.value }))}>
              {kindOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input className="input-soft rounded-2xl border-slate-200 bg-white/85 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" type="number" min="1" step="0.01" placeholder="Amount" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} required />
            <input className="input-soft rounded-2xl border-slate-200 bg-white/85 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" type="number" min="1" max="31" step="1" placeholder="Due Day (1-31)" value={form.dueDay} onChange={(event) => setForm((prev) => ({ ...prev, dueDay: event.target.value }))} required />
            <input className="input-soft rounded-2xl border-slate-200 bg-white/85 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" type="number" min="0" max="15" step="1" placeholder="Alert Days Before" value={form.alertDaysBefore} onChange={(event) => setForm((prev) => ({ ...prev, alertDaysBefore: event.target.value }))} required />
            <input className="input-soft rounded-2xl border-slate-200 bg-white/85 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 md:col-span-2" placeholder="Notes (optional)" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            <button className="btn-gradient rounded-2xl px-4" disabled={saving} type="submit">{saving ? 'Saving...' : editingId ? 'Update Payment' : 'Create Payment'}</button>
          </form>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3 space-y-4">
          <div className="card-soft border border-slate-200 bg-white">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <BellRing className="h-4 w-4 text-violet-600" />
                <p className="text-sm font-semibold text-slate-800">Due Alerts</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadOverview}
                  className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Payment
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {grouped.alerts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No urgent alerts currently.
                </div>
              ) : grouped.alerts.map((item) => (
                <div key={item._id} className="rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {item.kind.replace('_', ' ')} • Due {formatDate(item.dueDate)} • {item.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => payNow(item._id, item.amount)}
                      className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Pay Now {formatINR(item.amount)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-soft border border-slate-200 bg-white">
            <div className="mb-3 inline-flex items-center gap-2">
              <Landmark className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-semibold text-slate-800">All Scheduled Payments</p>
            </div>

            <div className="space-y-2">
              {grouped.active.map((item) => (
                <div key={item._id} className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800">{item.title}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta[item.status] || statusMeta.upcoming}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {item.payee || 'Payee not set'} • Due every month on day {item.dueDay} • Alert {item.alertDaysBefore} day(s) early
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Last paid: {item.lastPaidAt ? formatDate(item.lastPaidAt) : 'Not paid yet'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700">{formatINR(item.amount)}</span>
                      <button type="button" onClick={() => payNow(item._id, item.amount)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500">
                        Pay Now
                      </button>
                      <button type="button" onClick={() => openEdit(item)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                        Edit
                      </button>
                      <button type="button" onClick={() => removePayment(item._id)} className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {grouped.active.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No scheduled payments yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="card-soft border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60">
            <div className="mb-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <QrCode className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-slate-800">Scan & Pay</p>
              </div>
              <button
                type="button"
                onClick={() => setScannerOpen((prev) => !prev)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${scannerOpen ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}
              >
                {scannerOpen ? 'Stop Scanner' : 'Start Scanner'}
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black/90">
              <video ref={videoRef} className="h-52 w-full object-cover" muted playsInline />
              {!scannerOpen && (
                <div className="absolute inset-0 grid place-items-center text-center text-white/80">
                  <div>
                    <ScanLine className="mx-auto h-6 w-6" />
                    <p className="mt-2 text-xs">Camera scanner is off</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scanned Code / QR Data</label>
              <textarea
                className="input-soft min-h-[88px]"
                value={scanCode}
                onChange={(event) => setScanCode(event.target.value)}
                placeholder="Real-time scanned code will appear here, or paste manually"
              />

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount to Pay</label>
              <input
                className="input-soft"
                type="number"
                min="1"
                step="0.01"
                value={scanAmount}
                onChange={(event) => setScanAmount(event.target.value)}
                placeholder="Enter amount"
              />

              <button
                type="button"
                disabled={scanBusy || !scanCode.trim() || Number(scanAmount) <= 0}
                onClick={scanAndPay}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
              >
                <Wallet className="h-4 w-4" />
                {scanBusy ? 'Processing...' : 'Pay from Leftover Balance'}
              </button>
            </div>
          </div>

          <div className="card-soft border border-amber-100 bg-gradient-to-br from-amber-50 to-white">
            <div className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-slate-800">Smart Alert Tips</p>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li className="inline-flex items-start gap-2"><CircleDot className="mt-0.5 h-3.5 w-3.5 text-indigo-500" /> Keep alert window 2–5 days for subscriptions.</li>
              <li className="inline-flex items-start gap-2"><CircleDot className="mt-0.5 h-3.5 w-3.5 text-rose-500" /> Use Pay Now on overdue entries to avoid penalties.</li>
              <li className="inline-flex items-start gap-2"><CircleDot className="mt-0.5 h-3.5 w-3.5 text-emerald-500" /> Scan & Pay always debits from leftover account balance.</li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
};

export default PaymentsPage;
