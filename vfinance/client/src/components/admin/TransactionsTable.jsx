import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { formatINR, formatDate } from '../../utils/format';
import UserAvatar from '../UserAvatar';

const TransactionsTable = ({ transactions = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    transactions.forEach((tx) => {
      if (tx.category) set.add(tx.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Totals
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        const amt = Number(tx.amount || 0);
        if (tx.type === 'income') {
          acc.income += amt;
        } else {
          acc.expense += amt;
        }
        acc.volume += amt;
        return acc;
      },
      { income: 0, expense: 0, volume: 0 }
    );
  }, [transactions]);

  // Filtered and sorted
  const filtered = useMemo(() => {
    let result = [...transactions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (tx) =>
          tx.title?.toLowerCase().includes(q) ||
          tx.category?.toLowerCase().includes(q) ||
          (typeof tx.user === 'object' && tx.user?.name?.toLowerCase().includes(q)) ||
          (typeof tx.user === 'object' && tx.user?.email?.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((tx) => tx.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((tx) => tx.category === categoryFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
      }
      if (sortBy === 'date_asc') {
        return new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0);
      }
      if (sortBy === 'amount_desc') {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }
      if (sortBy === 'amount_asc') {
        return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      }
      return 0;
    });

    return result;
  }, [transactions, searchQuery, typeFilter, categoryFilter, sortBy]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleReset = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setSortBy('date_desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Metric Summary Ribbon */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Volume</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{formatINR(totals.volume)}</p>
          <p className="text-[11px] text-slate-400">{transactions.length} total operations recorded</p>
        </div>

        <div className="rounded-2xl border border-emerald-100/80 bg-emerald-50/50 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Total Inflow (Income)</p>
          <p className="mt-1 text-xl font-extrabold text-emerald-600">{formatINR(totals.income)}</p>
          <p className="text-[11px] text-emerald-600/80">Credited to user accounts</p>
        </div>

        <div className="rounded-2xl border border-rose-100/80 bg-rose-50/50 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Total Outflow (Expenses)</p>
          <p className="mt-1 text-xl font-extrabold text-rose-600">{formatINR(totals.expense)}</p>
          <p className="text-[11px] text-rose-600/80">Debited for payments &amp; transfers</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-white/90 bg-white/95 p-5 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by transaction title, category, or user..."
              className="input-soft w-full pl-10 pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Type Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold">
              <Filter size={13} className="text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-700 outline-none"
              >
                <option value="all">All Types</option>
                <option value="income">Income (+)</option>
                <option value="expense">Expense (-)</option>
              </select>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-700 outline-none max-w-[140px]"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold">
              <ArrowUpDown size={13} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-700 outline-none"
              >
                <option value="date_desc">Newest Date</option>
                <option value="date_asc">Oldest Date</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>

            {(searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'date_desc') && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 rounded-xl bg-pink-50 px-3 py-1.5 text-xs font-bold text-pink-700 hover:bg-pink-100 transition"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-3xl border border-white/90 bg-white/95 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 pl-6 pr-3">Transaction Details</th>
                <th className="px-3 py-4">Account Holder</th>
                <th className="px-3 py-4">Category</th>
                <th className="px-3 py-4 text-center">Flow Type</th>
                <th className="px-3 py-4 text-right">Amount</th>
                <th className="py-4 pl-3 pr-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="mx-auto flex flex-col items-center">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-base font-bold text-slate-700">No transactions found</p>
                      <p className="mt-1 text-xs text-slate-400">
                        No transaction matches your selected filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const userInfo = typeof tx.user === 'object' && tx.user ? tx.user : null;

                  return (
                    <tr
                      key={tx.id || tx._id}
                      className="group transition-colors duration-150 hover:bg-pink-50/30"
                    >
                      {/* Title */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                              isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">{tx.title || 'Untitled'}</p>
                            <p className="truncate text-xs text-slate-400">ID: {tx.id || tx._id}</p>
                          </div>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-3 py-3.5">
                        {userInfo ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={userInfo} size="h-7 w-7" textSize="text-xs" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-800">{userInfo.name}</p>
                              <p className="truncate text-[10px] text-slate-400">{userInfo.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">User #{tx.user || 'N/A'}</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3.5">
                        <span className="inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {tx.category || 'General'}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            isIncome
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isIncome ? 'Income (+)' : 'Expense (-)'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3.5 text-right font-extrabold text-base">
                        <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                          {isIncome ? '+' : '-'} {formatINR(tx.amount)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 pl-3 pr-6 text-right text-xs text-slate-500">
                        <div className="inline-flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{formatDate(tx.date || tx.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100/90 px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Showing{' '}
              <strong className="text-slate-800">
                {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {Math.min(currentPage * pageSize, totalItems)}
              </strong>{' '}
              of <strong className="text-slate-800">{totalItems}</strong> entries
            </span>

            <div className="hidden items-center gap-1 sm:flex">
              <span className="text-slate-400">•</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 text-xs font-bold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsTable;
