import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Plane,
  Wallet,
  ShieldCheck,
  Landmark,
  Radar,
  Coins,
  CreditCard,
  Building2,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AccountMenu from './AccountMenu';

const menu = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    activeColor: 'from-pink-500 to-purple-600',
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: Receipt,
    activeColor: 'from-emerald-500 to-teal-600',
  },
  {
    label: 'Trip Planner',
    path: '/trip-planner',
    icon: Plane,
    activeColor: 'from-rose-500 to-red-500',
  },
  {
    label: 'Smart Radar',
    path: '/subscriptions/radar',
    icon: Radar,
    activeColor: 'from-teal-500 to-emerald-600',
  },
  {
    label: 'Loan Optimizer',
    path: '/loans/optimizer',
    icon: Coins,
    activeColor: 'from-slate-700 to-blue-700',
  },
  {
    label: 'Payments',
    path: '/payments',
    icon: CreditCard,
    activeColor: 'from-fuchsia-600 to-pink-600',
  },
  {
    label: 'Wallets',
    path: '/wallets',
    icon: Wallet,
    activeColor: 'from-green-600 to-emerald-600',
  },
  {
    label: 'Bank Sync',
    path: '/bank-sync',
    icon: Building2,
    activeColor: 'from-cyan-600 to-blue-600',
  },
  {
    label: 'Admin',
    path: '/admin',
    icon: ShieldCheck,
    activeColor: 'from-purple-600 via-fuchsia-600 to-pink-600',
  },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const interfaceRole = user?.portalRole || user?.role;
  const showAdminBadge = location.pathname.startsWith('/admin') && ['admin', 'super_admin'].includes(user?.role);
  const roleBadgeLabel = showAdminBadge ? (user?.role === 'super_admin' ? 'Super Admin' : 'Admin') : null;
  const roleBadgeClass =
    user?.role === 'super_admin'
      ? 'border-purple-200/80 bg-purple-50/90 text-purple-700 shadow-purple-100'
      : 'border-rose-200/80 bg-rose-50/90 text-rose-700 shadow-rose-100';

  const navItems = useMemo(() => {
    return menu.filter((item) => {
      const isAdminRoute = item.path === '/admin';
      if (isAdminRoute && !['admin', 'super_admin'].includes(user?.role)) {
        return false;
      }

      const isLoanOptimizerRoute = item.path === '/loans/optimizer';
      if (isLoanOptimizerRoute && interfaceRole !== 'business_user') {
        return false;
      }

      return true;
    });
  }, [user?.role, interfaceRole]);

  const routeAccent = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/transactions')) return 'from-emerald-500 via-teal-500 to-cyan-500';
    if (path.startsWith('/trip-planner')) return 'from-rose-500 via-pink-500 to-red-500';
    if (path.startsWith('/subscriptions/radar')) return 'from-teal-500 via-emerald-500 to-teal-600';
    if (path.startsWith('/loans/optimizer')) return 'from-slate-700 via-blue-700 to-indigo-800';
    if (path.startsWith('/payments')) return 'from-fuchsia-600 via-pink-600 to-rose-500';
    if (path.startsWith('/bank-sync')) return 'from-cyan-600 via-sky-600 to-blue-700';
    if (path.startsWith('/wallets')) return 'from-emerald-500 via-green-500 to-lime-500';
    if (path.startsWith('/admin')) return 'from-purple-600 via-fuchsia-600 to-pink-600';
    if (path.startsWith('/settings')) return 'from-slate-600 via-slate-700 to-slate-900';
    return 'from-pink-500 via-rose-500 to-purple-600';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-slate-800">
      {/* Sticky Header with backdrop blur */}
      <header className="sticky top-0 z-40 w-full border-b border-pink-100/60 bg-white/80 px-3 py-2.5 backdrop-blur-xl transition-all duration-300 sm:px-6">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link to="/" className="group inline-flex shrink-0 items-center gap-2.5" aria-label="VFinance Home">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 text-white shadow-md shadow-pink-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-pink-500/35">
              <Landmark size={20} className="drop-shadow-sm" />
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                V<span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Finance</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fintech Suite</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-colors duration-200"
                >
                  {isActive && (
                    <motion.div
                      layoutId="navActiveIndicator"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.activeColor} shadow-md shadow-pink-500/15`}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative z-10 inline-flex items-center gap-1.5 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {roleBadgeLabel && (
              <div className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide shadow-xs ${roleBadgeClass}`}>
                <Sparkles size={12} className={user?.role === 'super_admin' ? 'text-purple-600' : 'text-rose-600'} />
                <span>{roleBadgeLabel}</span>
              </div>
            )}

            <AccountMenu user={user} logout={logout} />

            {/* Mobile / Tablet Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 xl:hidden"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Medium Screen Navigation (Visible between md and xl) */}
        <div className="mx-auto hidden max-w-[1240px] overflow-x-auto pt-2 pb-0.5 md:flex xl:hidden custom-scrollbar">
          <div className="flex items-center gap-1.5 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${item.activeColor} text-white shadow-sm`
                      : 'bg-slate-50/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={13} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-slate-100 pt-3 pb-2 md:hidden"
            >
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`inline-flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all ${
                        isActive
                          ? `bg-gradient-to-r ${item.activeColor} text-white shadow-sm`
                          : 'bg-slate-50 text-slate-700 hover:bg-pink-50 hover:text-pink-700'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Route Accent Line */}
        <div className={`mt-2 h-[2px] w-full rounded-full bg-gradient-to-r ${routeAccent} opacity-80`} />
      </header>

      {/* Main Content Area - Generous top spacing so sticky header never hides content */}
      <main className="mx-auto w-full max-w-[1240px] px-3 pt-6 pb-16 sm:px-6">{children}</main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-[1240px] px-3 pb-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/80 px-6 py-4 text-center text-xs font-semibold text-slate-500 shadow-[0_4px_20px_-5px_rgba(244,114,182,0.1)] backdrop-blur-md sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>VFinance Enterprise Architecture</span>
          </div>
          <div>© {new Date().getFullYear()} Prashwin. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

