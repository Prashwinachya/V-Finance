import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { formatINR } from '../../utils/format';

const COLORS = [
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#f43f5e', // rose
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-white/90 bg-white/95 p-3 shadow-xl backdrop-blur-xl text-xs">
        <p className="font-bold text-slate-800">{label}</p>
        <div className="mt-1.5 space-y-1">
          {payload.map((item) => (
            <div key={item.dataKey || item.name} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color || item.fill }} />
              <span className="text-slate-500 capitalize">{item.name || item.dataKey}:</span>
              <span className="font-extrabold text-slate-900">{formatINR(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const ReportsAnalytics = ({ transactions = [], stats = {} }) => {
  // Aggregate flow
  const { income, expense, net, count, avgTx, maxTx, categoryBreakdown, monthlyFlow } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let max = 0;
    const catMap = {};
    const monthMap = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (amt > max) max = amt;

      if (tx.type === 'income') {
        inc += amt;
      } else {
        exp += amt;
      }

      // Category map
      const cat = tx.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + amt;

      // Month map
      const rawDate = tx.date || tx.createdAt || null;
      const date = rawDate ? new Date(rawDate) : null;
      const monthKey = date && !isNaN(date.getTime())
        ? date.toLocaleDateString('en-US', { month: 'short' })
        : 'Recent';

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { name: monthKey, income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        monthMap[monthKey].income += amt;
      } else {
        monthMap[monthKey].expense += amt;
      }
    });

    const netFlow = inc - exp;
    const avg = transactions.length > 0 ? (inc + exp) / transactions.length : 0;

    const catArray = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const monthArray = Object.values(monthMap);

    return {
      income: inc,
      expense: exp,
      net: netFlow,
      count: transactions.length,
      avgTx: avg,
      maxTx: max,
      categoryBreakdown: catArray,
      monthlyFlow: monthArray.length > 0 ? monthArray : [
        { name: 'Current Cycle', income: inc, expense: exp },
      ],
    };
  }, [transactions]);

  const savingsRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* 4 Financial Intelligence KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Inflow */}
        <div className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_10px_35px_-12px_rgba(16,185,129,0.1)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Inflow</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">{formatINR(income)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Total deposits &amp; earnings</p>
        </div>

        {/* Gross Outflow */}
        <div className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_10px_35px_-12px_rgba(244,63,94,0.1)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Outflow</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-100 text-rose-700">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-600">{formatINR(expense)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Total transfers &amp; expenditures</p>
        </div>

        {/* Net Flow */}
        <div className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_10px_35px_-12px_rgba(139,92,246,0.1)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Liquidity</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-100 text-purple-700">
              <Scale size={18} />
            </div>
          </div>
          <p className={`mt-2 text-2xl font-extrabold ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {net >= 0 ? '+' : ''}
            {formatINR(net)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">System retained balance</p>
        </div>

        {/* Efficiency / Savings Rate */}
        <div className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_10px_35px_-12px_rgba(236,72,153,0.1)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Retention Ratio</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-pink-100 text-pink-700">
              <Sparkles size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{savingsRate}%</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Net to income retention</p>
        </div>
      </div>

      {/* Visual Analytics Charts 2-Column Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cashflow Bar Chart */}
        <div className="rounded-3xl border border-white/90 bg-white/95 p-6 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <BarChart3 size={16} />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Cash Flow Trajectory</h4>
                <p className="text-xs text-slate-400">Comparative income vs expenditure volume</p>
              </div>
            </div>
          </div>

          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Spending Breakdown Chart */}
        <div className="rounded-3xl border border-white/90 bg-white/95 p-6 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-100 text-purple-700">
                <PieIcon size={16} />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Category Volume Distribution</h4>
                <p className="text-xs text-slate-400">Top spending and transfer allocations</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center sm:flex-row gap-4 h-64">
            {categoryBreakdown.length > 0 ? (
              <>
                <div className="h-56 w-56 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto max-h-56 pr-2 custom-scrollbar text-xs">
                  {categoryBreakdown.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="font-semibold text-slate-700 truncate max-w-[100px]">{cat.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{formatINR(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-slate-400">No transaction categories recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Insights Strip */}
      <div className="rounded-3xl border border-white/90 bg-white/95 p-6 shadow-sm backdrop-blur-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Financial Velocity Insights</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Transaction Ticket</span>
            <p className="mt-1 text-lg font-extrabold text-slate-800">{formatINR(avgTx)}</p>
            <p className="text-[11px] text-slate-400">Calculated over {count} entries</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Highest Ticket Size</span>
            <p className="mt-1 text-lg font-extrabold text-slate-800">{formatINR(maxTx)}</p>
            <p className="text-[11px] text-slate-400">Single highest operation</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Users Tracked</span>
            <p className="mt-1 text-lg font-extrabold text-slate-800">{stats.totalUsers || 0} Accounts</p>
            <p className="text-[11px] text-slate-400">{stats.adminUsers || 0} Admins &amp; Super Admins</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
