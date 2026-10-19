import { useState, useMemo, useDeferredValue } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Pencil,
  Shield,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building,
  Key,
  Fingerprint,
  RotateCcw,
} from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { formatDate } from '../../utils/format';

const UserManagementTable = ({
  users = [],
  onViewUser,
  onEditUser,
  onToggleRole,
  onDeleteUser,
  isSuperAdmin,
  currentUserId,
  busy,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [roleFilter, setRoleFilter] = useState('all');
  const [portalFilter, setPortalFilter] = useState('all');
  const [sortBy, setSortBy] = useState('joined_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search query
    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          String(u.id || u._id).toLowerCase().includes(q)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'super_admin') {
        result = result.filter((u) => u.role === 'super_admin' || u.isSuperAdmin);
      } else if (roleFilter === 'admin') {
        result = result.filter((u) => u.role === 'admin');
      } else if (roleFilter === 'business') {
        result = result.filter((u) => u.portalRole === 'business_user' || u.role === 'business_user' || u.role === 'business');
      } else if (roleFilter === 'student') {
        result = result.filter((u) => u.role === 'user' || u.role === 'student' || u.portalRole === 'student');
      }
    }

    // Portal filter
    if (portalFilter !== 'all') {
      result = result.filter((u) => {
        const portal = u.portalRole || u.portal || 'student';
        return portal === portalFilter;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'joined_desc') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'joined_asc') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'transactions_desc') {
        return (b.transactionsCount || 0) - (a.transactionsCount || 0);
      }
      if (sortBy === 'budgets_desc') {
        return (b.budgetsCount || 0) - (a.budgetsCount || 0);
      }
      return 0;
    });

    return result;
  }, [users, deferredSearchQuery, roleFilter, portalFilter, sortBy]);

  // Pagination calculation
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setPortalFilter('all');
    setSortBy('joined_desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Controls Toolbar */}
      <div className="rounded-3xl border border-white/90 bg-white/95 p-5 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, or user ID..."
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

          {/* Filters & Sorters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold">
              <Filter size={13} className="text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-700 outline-none"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admins</option>
                <option value="admin">Admins</option>
                <option value="business">Business Accounts</option>
                <option value="student">Student Accounts</option>
              </select>
            </div>

            {/* Portal Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold">
              <Building size={13} className="text-slate-400" />
              <select
                value={portalFilter}
                onChange={(e) => {
                  setPortalFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-700 outline-none"
              >
                <option value="all">All Portals</option>
                <option value="student">Campus Portal</option>
                <option value="business_user">Commercial Portal</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold">
              <ArrowUpDown size={13} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-700 outline-none"
              >
                <option value="joined_desc">Newest First</option>
                <option value="joined_asc">Oldest First</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="transactions_desc">Most Transactions</option>
                <option value="budgets_desc">Most Budgets</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(searchQuery || roleFilter !== 'all' || portalFilter !== 'all' || sortBy !== 'joined_desc') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-xl bg-pink-50 px-3 py-1.5 text-xs font-bold text-pink-700 hover:bg-pink-100 transition"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modern Fintech Table */}
      <div className="overflow-hidden rounded-3xl border border-white/90 bg-white/95 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 pl-6 pr-3">User & Identity</th>
                <th className="px-3 py-4">System Role</th>
                <th className="px-3 py-4">Active Portal</th>
                <th className="px-3 py-4 text-center">Activity</th>
                <th className="px-3 py-4">Security Enforcements</th>
                <th className="px-3 py-4">Timeline</th>
                <th className="py-4 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto flex flex-col items-center">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-base font-bold text-slate-700">No users match your criteria</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Try refining your search keyword or clearing the applied role filters.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="btn-secondary mt-4 text-xs"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isSuperAdminUser = user.role === 'super_admin' || user.isSuperAdmin;
                  const isAdminUser = user.role === 'admin';
                  const isBusiness = user.portalRole === 'business_user' || user.role === 'business_user';

                  return (
                    <tr
                      key={user.id || user._id}
                      className="group transition-colors duration-150 hover:bg-pink-50/30"
                    >
                      {/* User Cell */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={user}
                            size="h-10 w-10"
                            textSize="text-sm"
                            className="ring-2 ring-white shadow-xs group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">{user.name}</p>
                            <p className="truncate text-xs font-medium text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-3 py-3.5">
                        {isSuperAdminUser ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700">
                            <Sparkles size={11} className="text-purple-600" />
                            Super Admin
                          </span>
                        ) : isAdminUser ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                            <Shield size={11} className="text-rose-600" />
                            Admin
                          </span>
                        ) : isBusiness ? (
                          <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-700">
                            Business User
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-pink-200 bg-pink-50 px-2.5 py-1 text-[11px] font-bold text-pink-700">
                            Student / User
                          </span>
                        )}
                      </td>

                      {/* Portal */}
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                            isBusiness
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          <Building size={12} />
                          {isBusiness ? 'Commercial' : 'Campus'}
                        </span>
                      </td>

                      {/* Activity */}
                      <td className="px-3 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            title="Transactions Count"
                            className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700"
                          >
                            {user.transactionsCount ?? 0} tx
                          </span>
                          <span
                            title="Budgets Count"
                            className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700"
                          >
                            {user.budgetsCount ?? 0} bg
                          </span>
                        </div>
                      </td>

                      {/* Security Enforcements */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {user.requirePaymentPin || user.paymentPinEnabled ? (
                            <span
                              title="Payment PIN active"
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80"
                            >
                              <Key size={10} /> PIN
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">PIN: Off</span>
                          )}

                          {user.hasBiometricCredential || user.fingerprintEnabled ? (
                            <span
                              title="Biometrics passkeys configured"
                              className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200/80"
                            >
                              <Fingerprint size={10} /> FIDO2
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-3 py-3.5 text-xs text-slate-500">
                        <div>
                          <span>Joined {formatDate(user.createdAt)}</span>
                          <p className="text-[10px] text-slate-400">
                            {user.lastLoginAt ? `Active ${formatDate(user.lastLoginAt)}` : 'No login yet'}
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            title="View User Profile Details"
                            onClick={() => onViewUser(user)}
                            className="rounded-xl border border-slate-200/80 bg-white p-2 text-slate-600 shadow-2xs transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            title="Edit User Profile"
                            onClick={() => onEditUser(user)}
                            className="rounded-xl border border-slate-200/80 bg-white p-2 text-slate-600 shadow-2xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Toggle Role Button */}
                          <button
                            type="button"
                            title={isSuperAdminUser ? 'Super Admin role protected' : 'Toggle Administrator Role'}
                            onClick={() => onToggleRole(user)}
                            disabled={!isSuperAdmin || isSuperAdminUser || busy}
                            className={`rounded-xl border p-2 shadow-2xs transition ${
                              !isSuperAdmin || isSuperAdminUser
                                ? 'cursor-not-allowed border-transparent bg-slate-50 text-slate-300'
                                : 'border-purple-200/80 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800'
                            }`}
                          >
                            <Shield className="h-4 w-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            title={isSuperAdminUser ? 'Cannot delete Super Admin' : 'Delete User'}
                            onClick={() => onDeleteUser(user)}
                            disabled={isSuperAdminUser || String(currentUserId) === String(user.id || user._id) || busy}
                            className={`rounded-xl border p-2 shadow-2xs transition ${
                              isSuperAdminUser || String(currentUserId) === String(user.id || user._id)
                                ? 'cursor-not-allowed border-transparent bg-slate-50 text-slate-300'
                                : 'border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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
              of <strong className="text-slate-800">{totalItems}</strong> accounts
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
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
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
              onClick={() => handlePageChange(currentPage + 1)}
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

export default UserManagementTable;
