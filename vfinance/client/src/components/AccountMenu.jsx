import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  User,
  KeyRound,
  ShieldCheck,
  LogOut,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import UserAvatar from './UserAvatar';

const formatMemberSince = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const getRoleBadge = (user) => {
  if (user?.role === 'super_admin' || user?.isSuperAdmin) {
    return {
      label: 'Super Admin',
      className: 'border-purple-200 bg-purple-50 text-purple-700',
    };
  }
  if (user?.role === 'admin') {
    return {
      label: 'Admin',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }
  if (user?.portalRole === 'business_user' || user?.role === 'business') {
    return {
      label: 'Business Account',
      className: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    };
  }
  return {
    label: 'Student Account',
    className: 'border-pink-200 bg-pink-50 text-pink-700',
  };
};

const AccountMenu = ({ user, logout }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const roleBadge = getRoleBadge(user);
  const memberSince = formatMemberSince(user?.createdAt);
  const isAdmin = ['admin', 'super_admin'].includes(user?.role) || Boolean(user?.isSuperAdmin);

  // Close menu on outside click or Escape key
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleItemClick = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-dropdown-menu"
        aria-label={`Account menu for ${user?.name || 'user'}`}
        className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
      >
        <UserAvatar user={user} size="h-8 w-8" textSize="text-sm" />
        <span className="hidden max-w-[130px] truncate pr-1 text-sm font-semibold text-slate-700 sm:inline">
          {user?.name || 'User'}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Card */}
      {open && (
        <div
          id="account-dropdown-menu"
          role="menu"
          aria-label="Account options"
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100dvw-2rem)] rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-2xl shadow-slate-900/10 z-50 motion-safe:animate-in motion-safe:fade-in-50 motion-safe:zoom-in-95 max-h-[calc(100dvh-85px)] overflow-y-auto"
        >
          {/* User Profile Header */}
          <div className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-3 border border-slate-100">
            <UserAvatar user={user} size="h-11 w-11" textSize="text-base" className="shrink-0 ring-2 ring-white shadow-sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-bold text-slate-900" title={user?.name}>
                  {user?.name || 'User'}
                </p>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleBadge.className}`}
                >
                  {roleBadge.label}
                </span>
              </div>
              <p className="truncate text-xs text-slate-500 font-medium mt-0.5" title={user?.email}>
                {user?.email || 'No email registered'}
              </p>
            </div>
          </div>

          {/* Compact Account Summary (Status & Member Since) */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs">
            {/* Account Status */}
            <div className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-semibold text-slate-700">Account Active</span>
            </div>

            {/* Member Since (displayed if available) */}
            {memberSince && (
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <Calendar className="h-3 w-3 text-slate-400" aria-hidden="true" />
                <span>Joined {memberSince}</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="mt-2 space-y-1">
            {/* Profile & Account Settings */}
            <Link
              to="/settings?tab=profile"
              state={{ tab: 'profile' }}
              onClick={handleItemClick}
              role="menuitem"
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 transition duration-150 hover:bg-slate-100/80 focus:outline-none focus-visible:bg-slate-100 focus-visible:ring-2 focus-visible:ring-pink-500"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-pink-50 text-pink-600 transition group-hover:bg-pink-100 group-hover:text-pink-700">
                <User size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-pink-600">
                  Profile & Identity
                </p>
                <p className="truncate text-[11px] text-slate-500">Personal details and avatar</p>
              </div>
            </Link>

            {/* Advanced Security Settings */}
            <Link
              to="/settings?tab=security"
              state={{ tab: 'security' }}
              onClick={handleItemClick}
              role="menuitem"
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 transition duration-150 hover:bg-slate-100/80 focus:outline-none focus-visible:bg-slate-100 focus-visible:ring-2 focus-visible:ring-pink-500"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-50 text-purple-600 transition group-hover:bg-purple-100 group-hover:text-purple-700">
                <KeyRound size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-purple-600">
                  Advanced Security
                </p>
                <p className="truncate text-[11px] text-slate-500">PIN, passkeys & active sessions</p>
              </div>
            </Link>

            {/* Admin Portal Link (if admin/super_admin) */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={handleItemClick}
                role="menuitem"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 transition duration-150 hover:bg-slate-100/80 focus:outline-none focus-visible:bg-slate-100 focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 transition group-hover:bg-rose-100 group-hover:text-rose-700">
                  <ShieldCheck size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-rose-600">
                    Admin Console
                  </p>
                  <p className="truncate text-[11px] text-slate-500">System management & users</p>
                </div>
              </Link>
            )}
          </div>

          {/* Distinct Logout Section */}
          <div className="mt-2 border-t border-slate-100 pt-1.5">
            <button
              type="button"
              onClick={handleLogout}
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-rose-600 transition duration-150 hover:bg-rose-50/80 hover:text-rose-700 focus:outline-none focus-visible:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 transition group-hover:bg-rose-100">
                <LogOut size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Sign Out</p>
                <p className="text-[11px] text-rose-400">End your active session</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
