import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { formatINR, formatDate } from '../../utils/format';
import UserAvatar from '../UserAvatar';

const BudgetsTable = ({ budgets = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalAllocated = budgets.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
    const avg = budgets.length > 0 ? totalAllocated / budgets.length : 0;
    return { totalAllocated, avg, count: budgets.length };
  }, [budgets]);

  // Filter & Sort
  const filtered = useMemo(() => {
    let result = [...budgets];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.budgetName?.toLowerCase().includes(q) ||
          b.name?.toLowerCase().includes(q) ||
          b.destination?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          (typeof b.user === 'object' && b.user?.name?.toLowerCase().includes(q))
      );
    }

    if (periodFilter !== 'all') {
      result = result.filter((b) => (b.period || '').toLowerCase() === periodFilter.toLowerCase());
    }

    result.sort((a, b) => {
      if (sortBy === 'created_desc') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'created_asc') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
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
  }, [budgets, searchQuery, periodFilter, sortBy]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleReset = () => {
    setSearchQuery('');
    setPeriodFilter('all');
    setSortBy('created_desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Metric Summary Ribbon */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Budget Capacity</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{formatINR(summary.totalAllocated)}</p>
          <p className="text-[11px] text-slate-400">Combined allocations across all users</p>
        </div>

        <div className="rounded-2xl border border-purple-100/80 bg-purple-50/50 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Average Allocation</p>
          <p className="mt-1 text-xl font-extrabold text-purple-700">{formatINR(summary.avg)}</p>
          <p className="text-[11px] text-purple-600/80">Mean target per budget vault</p>
        </div>

        <div className="rounded-2xl border border-cyan-100/80 bg-cyan-50/50 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">Active Budget Envelopes</p>
          <p className="mt-1 text-xl font-extrabold text-cyan-700">{summary.count}</p>
          <p className="text-[11px] text-cyan-600/80">Total monitored plans</p>
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
              placeholder="Search by budget name, destination, or user..."
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
            {/* Period Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold">
              <Filter size={13} className="text-slate-400" />
              <select
                value={periodFilter}
                onChange={(e) => {
                  setPeriodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-700 outline-none"
              >
                <option value="all">All Periods</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
                <option value="trip">Trip / Goal</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold">
              <ArrowUpDown size={13} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-700 outline-none"
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>

            {(searchQuery || periodFilter !== 'all' || sortBy !== 'created_desc') && (
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

      {/* Budgets Table */}
      <div className="overflow-hidden rounded-3xl border border-white/90 bg-white/95 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 pl-6 pr-3">Budget Plan</th>
                <th className="px-3 py-4">Account Holder</th>
                <th className="px-3 py-4">Target Amount</th>
                <th className="px-3 py-4 text-center">Period / Type</th>
                <th className="px-3 py-4">Active Date Window</th>
                <th className="py-4 pl-3 pr-6 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="mx-auto flex flex-col items-center">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-base font-bold text-slate-700">No budgets found</p>
                      <p className="mt-1 text-xs text-slate-400">
                        No budgets match your search or filter configuration.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((b) => {
                  const userInfo = typeof b.user === 'object' && b.user ? b.user : null;
                  const displayName = b.budgetName || b.name || 'Personal Budget';
                  const destination = b.destination || b.category || 'General Fund';

                  return (
                    <tr
                      key={b.id || b._id}
                      className="group transition-colors duration-150 hover:bg-pink-50/30"
                    >
                      {/* Name & Destination */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-100 text-purple-700">
                            <Wallet size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">{displayName}</p>
                            <p className="truncate text-xs text-slate-400">{destination}</p>
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
                          <span className="text-xs text-slate-500 font-medium">User #{b.user || 'N/A'}</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3.5 font-extrabold text-base text-slate-900">
                        {formatINR(b.amount)}
                      </td>

                      {/* Period Badge */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 capitalize">
                          {b.period || 'Monthly'}
                        </span>
                      </td>

                      {/* Window */}
                      <td className="px-3 py-3.5 text-xs text-slate-600">
                        {b.startDate && b.endDate ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            <span>
                              {formatDate(b.startDate)} - {formatDate(b.endDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Open-ended</span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-3.5 pl-3 pr-6 text-right text-xs text-slate-500">
                        {formatDate(b.createdAt)}
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
              of <strong className="text-slate-800">{totalItems}</strong> budget records
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

export default BudgetsTable;
