import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange, IndianRupee, MapPin, Pencil, Plane, Plus, Sparkles, Trash2, Users, X } from 'lucide-react';
import api from '../api/client';
import { formatDate, formatINR } from '../utils/format';

const baseForm = {
  budgetName: '',
  amount: '',
  period: 'custom',
  category: 'Travel',
  startDate: '',
  endDate: '',
  destination: '',
  peopleCount: 1,
  breakdown: {
    accommodation: 0,
    transportation: 0,
    food: 0,
    activities: 0,
    miscellaneous: 0,
  },
};

const fields = ['accommodation', 'transportation', 'food', 'activities', 'miscellaneous'];

const fieldLabels = {
  accommodation: 'Accommodation',
  transportation: 'Transportation',
  food: 'Food',
  activities: 'Activities',
  miscellaneous: 'Miscellaneous',
};

const fieldAllowanceNotes = {
  accommodation: 'Hotel / stay allowance',
  transportation: 'Flight, cab, local travel',
  food: 'Meals and cafe spending',
  activities: 'Tours, tickets, experiences',
  miscellaneous: 'Shopping and other extras',
};

const fieldColorClasses = {
  accommodation: 'bg-indigo-500',
  transportation: 'bg-sky-500',
  food: 'bg-emerald-500',
  activities: 'bg-amber-500',
  miscellaneous: 'bg-fuchsia-500',
};

const fieldSoftClasses = {
  accommodation: 'from-indigo-50 to-white border-indigo-100',
  transportation: 'from-sky-50 to-white border-sky-100',
  food: 'from-emerald-50 to-white border-emerald-100',
  activities: 'from-amber-50 to-white border-amber-100',
  miscellaneous: 'from-fuchsia-50 to-white border-fuchsia-100',
};

const TripPlannerPage = () => {
  const [form, setForm] = useState(baseForm);
  const [trips, setTrips] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showPlannerForm, setShowPlannerForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formCardRef = useRef(null);
  const formFirstInputRef = useRef(null);

  const loadTrips = async () => {
    const response = await api.get('/trips');
    setTrips(response.data);
  };

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (!showPlannerForm) return;
    const frameId = window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formFirstInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [showPlannerForm]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      ...form,
      amount: Number(form.amount),
      peopleCount: Number(form.peopleCount),
      breakdown: Object.fromEntries(fields.map((field) => [field, Number(form.breakdown[field] || 0)])),
    };

    try {
      if (editingId) {
        await api.put(`/trips/${editingId}`, payload);
      } else {
        await api.post('/trips', payload);
      }

      setEditingId(null);
      setForm(baseForm);
      setShowPlannerForm(false);
      await loadTrips();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save trip plan right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    await api.delete(`/trips/${id}`);
    loadTrips();
  };

  const edit = (trip) => {
    setEditingId(trip._id);
    setShowPlannerForm(true);
    setForm({
      ...trip,
      startDate: trip.startDate?.slice(0, 10),
      endDate: trip.endDate?.slice(0, 10),
    });
  };

  const cancelPlannerForm = () => {
    setEditingId(null);
    setForm(baseForm);
    setShowPlannerForm(false);
    setError('');
  };

  const summary = useMemo(
    () =>
      trips.map((trip) => {
        const dayCount = Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)));
        return {
          ...trip,
          perPerson: trip.amount / Math.max(1, trip.peopleCount),
          perDay: trip.amount / dayCount,
        };
      }),
    [trips]
  );

  const stats = useMemo(() => {
    const totalBudget = summary.reduce((sum, trip) => sum + Number(trip.amount || 0), 0);
    const totalPeople = summary.reduce((sum, trip) => sum + Number(trip.peopleCount || 0), 0);
    const averageTrip = summary.length ? totalBudget / summary.length : 0;

    return {
      totalTrips: summary.length,
      totalBudget,
      totalPeople,
      averageTrip,
    };
  }, [summary]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 p-6 text-white shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Trip Planner
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Plan better trips with confident budgets</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              Design destination budgets, monitor per-person spend, and keep every journey under control.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showPlannerForm && !editingId) {
                setShowPlannerForm(false);
              } else {
                setEditingId(null);
                setForm(baseForm);
                setShowPlannerForm(true);
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-fuchsia-700 shadow-lg shadow-fuchsia-300/30 transition hover:bg-fuchsia-50"
          >
            {showPlannerForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showPlannerForm ? 'Close Create' : 'Create Trip Budget'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card-soft border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Trips</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalTrips}</p>
        </div>
        <div className="card-soft border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Budget Planned</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatINR(stats.totalBudget)}</p>
        </div>
        <div className="card-soft border-sky-100 bg-gradient-to-br from-sky-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">People Covered</p>
          <p className="mt-2 text-3xl font-bold text-sky-700">{stats.totalPeople}</p>
        </div>
        <div className="card-soft border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Avg Trip Budget</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{formatINR(stats.averageTrip)}</p>
        </div>
      </section>

      {showPlannerForm && (
        <form ref={formCardRef} onSubmit={submit} className="card-soft mx-auto max-w-6xl space-y-4 border border-slate-100 bg-gradient-to-br from-white via-white to-indigo-50/20 p-4 shadow-lg shadow-indigo-100/30 motion-safe:transition-all motion-safe:duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Plan & Budget</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-800">{editingId ? 'Edit Trip Budget' : 'Create Trip Budget'}</h2>
            </div>
            <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200" onClick={cancelPlannerForm}>
              Cancel
            </button>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white/85 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Trip Details</p>
            <div className="grid gap-2.5 md:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Trip Name</span>
                <input ref={formFirstInputRef} className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100" placeholder="Goa Summer Trip" value={form.budgetName} onChange={(event) => setForm((prev) => ({ ...prev, budgetName: event.target.value }))} required />
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Budget</span>
                <input className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100" type="number" min="0" placeholder="65000" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} required />
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Destination</span>
                <input className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100" placeholder="Goa" value={form.destination} onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))} required />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white/85 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Schedule & Group</p>
            <div className="grid gap-2.5 md:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Planning Period</span>
                <select className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100" value={form.period} onChange={(event) => setForm((prev) => ({ ...prev, period: event.target.value }))}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Trip Category</span>
                <select className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
                  <option>Travel</option>
                  <option>Vacation</option>
                  <option>Adventure</option>
                  <option>Family</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">No. of People</span>
                <input className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100" type="number" min="1" placeholder="2" value={form.peopleCount} onChange={(event) => setForm((prev) => ({ ...prev, peopleCount: event.target.value }))} />
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Start Date</span>
                <input className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100" type="date" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} required />
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">End Date</span>
                <input className="input-soft rounded-xl border-slate-200 bg-white/90 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100" type="date" value={form.endDate} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} required />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white/85 p-3">
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expense Breakdown</p>
              <p className="mt-1 text-xs text-slate-500">Specify each allowance clearly so every budget column has a defined purpose.</p>
            </div>

            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
              {fields.map((field) => (
                <div key={field} className={`rounded-xl border bg-gradient-to-br p-2.5 shadow-sm shadow-slate-200/30 ${fieldSoftClasses[field]}`}>
                  <div className="mb-1 inline-flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${fieldColorClasses[field]}`} />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">{fieldLabels[field]} Allowance</p>
                  </div>
                  <p className="text-[11px] text-slate-500">{fieldAllowanceNotes[field]}</p>
                  <input
                    type="number"
                    min="0"
                    className="input-soft mt-2 rounded-lg border-slate-200 bg-white/95 focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                    placeholder="0"
                    value={form.breakdown[field]}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        breakdown: { ...prev.breakdown, [field]: event.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

          <button className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" type="submit" disabled={submitting}>
            <Plus className="h-4 w-4" />
            {submitting ? 'Saving...' : editingId ? 'Update Trip Budget' : 'Create Trip Budget'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {summary.map((trip) => {
          const breakdownTotal = fields.reduce((sum, field) => sum + Number(trip.breakdown?.[field] || 0), 0);
          const budgetAmount = Number(trip.amount || 0);
          const difference = budgetAmount - breakdownTotal;
          const utilization = budgetAmount > 0 ? Math.min((breakdownTotal / budgetAmount) * 100, 100) : 0;
          const overBudget = breakdownTotal > Number(trip.amount || 0);
          const rankedBreakdown = [...fields]
            .map((field) => ({
              key: field,
              label: fieldLabels[field],
              value: Number(trip.breakdown?.[field] || 0),
            }))
            .sort((left, right) => right.value - left.value);

          return (
            <div key={trip._id} className="card-soft border border-slate-100 bg-gradient-to-r from-white via-white to-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-fuchsia-700">{trip.category}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {utilization.toFixed(0)}% utilized
                    </span>
                  </div>

                  <h3 className="mt-2 inline-flex items-center gap-2 text-lg font-bold text-slate-800">
                    <MapPin className="h-4 w-4 text-fuchsia-500" />
                    {trip.destination}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{trip.budgetName}</p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/80">Budget</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {formatINR(trip.amount)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Planned</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">{formatINR(breakdownTotal)}</p>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700/80">Per Person</p>
                      <p className="mt-1 text-sm font-bold text-indigo-700">{formatINR(trip.perPerson)}</p>
                    </div>
                    <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700/80">Per Day</p>
                      <p className="mt-1 text-sm font-bold text-sky-700">{formatINR(trip.perDay)}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-100 bg-white/80 px-3 py-2.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="uppercase tracking-wide text-slate-500">Budget Utilization</span>
                      <span className={overBudget ? 'text-rose-600' : 'text-slate-700'}>{utilization.toFixed(0)}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${overBudget ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500'}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-600"><CalendarRange className="h-3.5 w-3.5 text-slate-400" /> {formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
                  </div>
                </div>

                <div className="w-full xl:w-[340px]">
                  <div className="rounded-2xl border border-slate-100 bg-white/90 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Category Allocation</p>
                    <div className="mt-2.5 space-y-2">
                      {rankedBreakdown.map((item) => {
                        const share = breakdownTotal > 0 ? (item.value / breakdownTotal) * 100 : 0;
                        return (
                          <div key={item.key}>
                            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-600">
                              <p className="font-medium">{item.label}</p>
                              <p className="font-semibold">{formatINR(item.value)}</p>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full ${fieldColorClasses[item.key]}`} style={{ width: `${Math.max(share, 3)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className={`mt-2.5 rounded-xl px-3 py-2 text-xs font-semibold ${overBudget ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {overBudget
                      ? `Over by ${formatINR(breakdownTotal - budgetAmount)}`
                      : `Budget health: ${difference > 0 ? `${formatINR(difference)} buffer left` : 'Balanced'}`}
                  </p>

                  <div className="mt-2.5 flex gap-2">
                    <button onClick={() => edit(trip)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"><Pencil className="h-3.5 w-3.5" />Edit</button>
                    <button onClick={() => remove(trip._id)} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!summary.length && (
          <div className="card-soft border-dashed border-slate-200 text-center">
            <p className="text-base font-semibold text-slate-700">No trip plans yet</p>
            <p className="mt-1 text-sm text-slate-500">Tap “Create Trip Budget” to start planning your next journey.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripPlannerPage;
