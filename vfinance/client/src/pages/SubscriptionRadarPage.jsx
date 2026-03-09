import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeIndianRupee,
  CircleDot,
  Filter,
  Layers3,
  Radar,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';
import { formatDate, formatINR } from '../utils/format';

const statusMeta = {
  active: {
    label: 'Active',
    chip: 'bg-emerald-100 text-emerald-700',
  },
  review: {
    label: 'Review Needed',
    chip: 'bg-amber-100 text-amber-700',
  },
  likely_unused: {
    label: 'Likely Unused',
    chip: 'bg-rose-100 text-rose-700',
  },
};

const cadenceLabels = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const localOverridesKey = 'vfinance_subscription_overrides';

const formatRoundedINR = (amount = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

const SubscriptionRadarPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  const [search, setSearch] = useState('');
  const [cadence, setCadence] = useState('all');
  const [sortBy, setSortBy] = useState('annual_desc');
  const [leakMode, setLeakMode] = useState(false);
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    try {
      const persisted = JSON.parse(localStorage.getItem(localOverridesKey) || '{}');
      setOverrides(persisted);
    } catch (_error) {
      setOverrides({});
    }
  }, []);

  const loadRadar = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/subscriptions/radar');
      setSummary(response.data.summary || null);
      setSubscriptions(response.data.subscriptions || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load subscription radar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRadar();
  }, []);

  const withEffectiveStatus = useMemo(() => {
    return subscriptions.map((item) => ({
      ...item,
      effectiveStatus: overrides[item.id] || item.status,
    }));
  }, [subscriptions, overrides]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const output = withEffectiveStatus.filter((item) => {
      const matchesSearch = !term
        || item.name.toLowerCase().includes(term)
        || String(item.category || '').toLowerCase().includes(term);

      const matchesCadence = cadence === 'all' || item.cadence === cadence;
      const matchesLeak = !leakMode || item.effectiveStatus !== 'active';

      return matchesSearch && matchesCadence && matchesLeak;
    });

    output.sort((a, b) => {
      if (sortBy === 'annual_asc') return a.annualCost - b.annualCost;
      if (sortBy === 'risk_desc') return b.unusedScore - a.unusedScore;
      if (sortBy === 'confidence_desc') return b.confidence - a.confidence;
      return b.annualCost - a.annualCost;
    });

    return output;
  }, [withEffectiveStatus, search, cadence, leakMode, sortBy]);

  const live = useMemo(() => {
    const totalAnnual = withEffectiveStatus.reduce((sum, item) => sum + Number(item.annualCost || 0), 0);
    const leakingList = withEffectiveStatus.filter((item) => item.effectiveStatus !== 'active');
    const leakingAnnual = leakingList.reduce((sum, item) => sum + Number(item.annualCost || 0), 0);

    return {
      totalAnnual,
      leakingAnnual,
      leakingCount: leakingList.length,
      totalCount: withEffectiveStatus.length,
    };
  }, [withEffectiveStatus]);

  const saveOverrides = (next) => {
    setOverrides(next);
    localStorage.setItem(localOverridesKey, JSON.stringify(next));
  };

  const setStatus = (id, status) => {
    saveOverrides({
      ...overrides,
      [id]: status,
    });
  };

  const clearStatus = (id) => {
    const next = { ...overrides };
    delete next[id];
    saveOverrides(next);
  };

  const portfolioHealth = useMemo(() => {
    if (live.totalCount === 0 || live.totalAnnual === 0) {
      return { label: 'No Data', className: 'text-slate-600' };
    }

    const ratio = live.leakingAnnual / live.totalAnnual;
    if (ratio >= 0.45) return { label: 'Critical', className: 'text-rose-600' };
    if (ratio >= 0.2) return { label: 'Warning', className: 'text-amber-600' };
    return { label: 'Healthy', className: 'text-emerald-600' };
  }, [live]);

  if (loading) {
    return <div className="card-soft">Analyzing recurring expenses with Smart Radar...</div>;
  }

  if (error) {
    return (
      <div className="card-soft">
        <p className="text-sm font-semibold text-rose-600">{error}</p>
        <button className="btn-gradient mt-4" onClick={loadRadar} type="button">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-dashboard-in">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 p-6 text-white shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Subscription Radar
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Money leaking here</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              {summary?.alert || 'Recurring subscriptions detected from your spending patterns and annualized for clear impact.'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/70">Leaking yearly cost</p>
            <p className="mt-1 text-4xl font-black">{formatRoundedINR(live.leakingAnnual)}</p>
            <p className="mt-1 text-sm text-white/75">{live.leakingCount} service(s) at risk</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card-soft">
          <p className="text-xs uppercase tracking-wide text-slate-400">Detected Recurring</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{live.totalCount}</p>
        </div>
        <div className="card-soft">
          <p className="text-xs uppercase tracking-wide text-slate-400">Annual Subscription Cost</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{formatRoundedINR(live.totalAnnual)}</p>
        </div>
        <div className="card-soft">
          <p className="text-xs uppercase tracking-wide text-slate-400">Unused / Review</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">{live.leakingCount}</p>
        </div>
        <div className="card-soft">
          <p className="text-xs uppercase tracking-wide text-slate-400">Portfolio Health</p>
          <p className={`mt-2 text-3xl font-bold ${portfolioHealth.className}`}>{portfolioHealth.label}</p>
        </div>
      </div>

      <section className="card-soft">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search service</label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input-soft w-full pl-10"
                placeholder="Netflix, Prime, ChatGPT..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cadence</label>
            <select className="input-soft mt-2 w-full" value={cadence} onChange={(event) => setCadence(event.target.value)}>
              <option value="all">All</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort by</label>
            <select className="input-soft mt-2 w-full" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="annual_desc">Annual Cost (High to Low)</option>
              <option value="annual_asc">Annual Cost (Low to High)</option>
              <option value="risk_desc">Unused Risk (High to Low)</option>
              <option value="confidence_desc">Confidence (High to Low)</option>
            </select>
          </div>

          <div className="flex items-end gap-2 lg:col-span-3">
            <button
              type="button"
              onClick={() => setLeakMode((prev) => !prev)}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                leakMode
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-200 hover:bg-rose-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              {leakMode ? 'Leak Mode On' : 'Focus Leak Mode'}
            </button>
            <button
              type="button"
              onClick={loadRadar}
              className="inline-flex items-center justify-center rounded-xl bg-slate-100 p-2.5 text-slate-700 hover:bg-slate-200"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="card-soft text-center">
          <p className="text-lg font-semibold text-slate-800">No recurring subscriptions match this filter.</p>
          <p className="mt-1 text-sm text-slate-500">Try clearing search, cadence, or leak mode.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const status = item.effectiveStatus;
            const meta = statusMeta[status] || statusMeta.active;
            return (
              <article key={item.id} className="card-soft">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {cadenceLabels[item.cadence] || item.cadence}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chip}`}>{meta.label}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CircleDot className="h-3.5 w-3.5 text-slate-400" />
                        Last paid {formatDate(item.lastPayment)}
                      </span>
                      <span>{item.daysSinceLast} day(s) since payment</span>
                      <span>{item.transactionsCount} occurrences detected</span>
                      <span>Confidence {item.confidence}%</span>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>Unused likelihood</span>
                        <span>{item.unusedScore}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"
                          style={{ width: `${Math.min(100, item.unusedScore)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-[300px] lg:text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Annual cost</p>
                    <p className="mt-1 text-3xl font-black text-slate-900">{formatRoundedINR(item.annualCost)}</p>
                    <p className="mt-1 text-xs text-slate-500">Avg charge {formatINR(item.averageAmount)}</p>

                    <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                      <button
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        onClick={() => setStatus(item.id, 'active')}
                        type="button"
                      >
                        Mark Active
                      </button>
                      <button
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        onClick={() => setStatus(item.id, 'likely_unused')}
                        type="button"
                      >
                        Mark Unused
                      </button>
                      <button
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        onClick={() => clearStatus(item.id)}
                        type="button"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card-soft border-rose-100 bg-gradient-to-br from-rose-50 to-white">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-rose-100 p-2 text-rose-600"><ShieldAlert className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold text-slate-700">Leak Alert Snapshot</p>
              <p className="text-xs text-slate-500">High-impact subscriptions to review now</p>
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-rose-600">{formatRoundedINR(live.leakingAnnual)}/year</p>
          <p className="mt-1 text-sm text-slate-600">Potentially wasted through unused or stale subscriptions.</p>
        </div>

        <div className="card-soft border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-100 p-2 text-indigo-600"><Radar className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold text-slate-700">Radar Intelligence</p>
              <p className="text-xs text-slate-500">Recurring pattern confidence + annualized impact</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-xs text-slate-500">Detected</p>
              <p className="text-xl font-bold text-slate-800">{live.totalCount}</p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-xs text-slate-500">At Risk</p>
              <p className="text-xl font-bold text-rose-600">{live.leakingCount}</p>
            </div>
            <div className="col-span-2 rounded-xl bg-white p-3 shadow-sm">
              <p className="text-xs text-slate-500">Estimated Annual Burden</p>
              <p className="text-2xl font-black text-slate-900 inline-flex items-center gap-1">
                <BadgeIndianRupee className="h-5 w-5 text-slate-700" />
                {Math.round(live.totalAnnual).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="inline-flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          Pro tip: Cancel one unused yearly app today and redirect that money into investments.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionRadarPage;
