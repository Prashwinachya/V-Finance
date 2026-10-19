import { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Plane,
  Wallet,
  ShieldCheck,
  Radar,
  Coins,
  CreditCard,
  Building2,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AccountMenu from './AccountMenu';

const primaryMenu = [
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
    label: 'Wallets',
    path: '/wallets',
    icon: Wallet,
    activeColor: 'from-green-600 to-emerald-600',
  },
  {
    label: 'Payments',
    path: '/payments',
    icon: CreditCard,
    activeColor: 'from-fuchsia-600 to-pink-600',
  },
  {
    label: 'Trip Planner',
    path: '/trip-planner',
    icon: Plane,
    activeColor: 'from-rose-500 to-red-500',
  },
];

const secondaryMenu = [
  {
    label: 'Smart Radar',
    path: '/subscriptions/radar',
    icon: Radar,
    activeColor: 'from-teal-500 to-emerald-600',
    description: 'Detect subscription leaks',
  },
  {
    label: 'Bank Sync',
    path: '/bank-sync',
    icon: Building2,
    activeColor: 'from-cyan-600 to-blue-600',
    description: 'Sync financial accounts',
  },
  {
    label: 'Loan Optimizer',
    path: '/loans/optimizer',
    icon: Coins,
    activeColor: 'from-slate-700 to-blue-700',
    description: 'Intelligent EMI payoff',
    businessOnly: true,
  },
  {
    label: 'Admin',
    path: '/admin',
    icon: ShieldCheck,
    activeColor: 'from-purple-600 via-fuchsia-600 to-pink-600',
    description: 'System & user controls',
    adminOnly: true,
  },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const moreButtonRef = useRef(null);

  const interfaceRole = user?.portalRole || user?.role;
  const showAdminBadge = location.pathname.startsWith('/admin') && ['admin', 'super_admin'].includes(user?.role);
  const roleBadgeLabel = showAdminBadge ? (user?.role === 'super_admin' ? 'Super Admin' : 'Admin') : null;
  const roleBadgeClass =
    user?.role === 'super_admin'
      ? 'border-purple-200/80 bg-purple-50/90 text-purple-700 shadow-purple-100'
      : 'border-rose-200/80 bg-rose-50/90 text-rose-700 shadow-rose-100';

  const isAdmin = ['admin', 'super_admin'].includes(user?.role) || Boolean(user?.isSuperAdmin);

  // Filter secondary items based on user roles
  const filteredSecondaryMenu = useMemo(() => {
    return secondaryMenu.filter((item) => {
      if (item.adminOnly && !isAdmin) {
        return false;
      }
      if (item.businessOnly && !isAdmin && interfaceRole !== 'business_user') {
        return false;
      }
      return true;
    });
  }, [isAdmin, interfaceRole]);

  // Check if an item in secondary menu is active
  const activeSecondaryItem = useMemo(() => {
    return filteredSecondaryMenu.find(
      (item) => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
    );
  }, [filteredSecondaryMenu, location.pathname]);

  const isSecondaryActive = Boolean(activeSecondaryItem);

  // Adjust menu states when route changes (render-phase adjustment without cascading effects)
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  }

  // Close "More" dropdown on outside click or Escape key
  useEffect(() => {
    if (!moreMenuOpen) return;

    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setMoreMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMoreMenuOpen(false);
        moreButtonRef.current?.focus();
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
  }, [moreMenuOpen]);

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
    <div className="min-h-screen bg-[#FFF5F7] text-slate-800 overflow-x-clip">
      {/* Sticky Header with backdrop blur */}
      <header className="sticky top-0 z-40 w-full border-b border-pink-100/60 bg-white/80 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Brand Logo (Left) */}
          <Link to="/" className="group inline-flex shrink-0 items-center gap-2.5" aria-label="VFinance Home">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-violet-600 text-white shadow-md shadow-pink-300/40 transition-transform duration-200 group-hover:scale-105">
              <span className="text-xl font-black">V</span>
            </div>
            <div className="flex items-center">
              <span className="text-base font-black tracking-tight text-slate-900 sm:text-lg">VFinance</span>
              <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700 uppercase tracking-wider">
                Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (Center Section - lg and above) */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main Navigation">
            {primaryMenu.map((item) => {
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

            {/* "More" Dropdown Menu */}
            {filteredSecondaryMenu.length > 0 && (
              <div ref={moreMenuRef} className="relative">
                <button
                  ref={moreButtonRef}
                  type="button"
                  onClick={() => setMoreMenuOpen((prev) => !prev)}
                  aria-expanded={moreMenuOpen}
                  aria-haspopup="true"
                  aria-label="More navigation options"
                  className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 ${
                    isSecondaryActive
                      ? `bg-gradient-to-r ${activeSecondaryItem.activeColor} text-white shadow-md shadow-pink-500/15`
                      : moreMenuOpen
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  {isSecondaryActive ? (
                    <>
                      {(() => {
                        const ActiveIcon = activeSecondaryItem.icon;
                        return <ActiveIcon size={14} />;
                      })()}
                      <span>{activeSecondaryItem.label}</span>
                    </>
                  ) : (
                    <>
                      <MoreHorizontal size={14} />
                      <span>More</span>
                    </>
                  )}
                  <ChevronDown
                    size={13}
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {moreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-900/10 z-50"
                    >
                      <div className="space-y-1">
                        {filteredSecondaryMenu.map((item) => {
                          const Icon = item.icon;
                          const isItemActive =
                            location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={() => setMoreMenuOpen(false)}
                              className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                isItemActive
                                  ? 'bg-pink-50 text-pink-700'
                                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                              }`}
                            >
                              <span
                                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition ${
                                  isItemActive
                                    ? 'bg-pink-100 text-pink-600'
                                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                                }`}
                              >
                                <Icon size={14} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-bold">{item.label}</p>
                                <p className="truncate text-[10px] text-slate-400 font-normal">{item.description}</p>
                              </div>
                            </NavLink>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          {/* Right Action Cluster (Profile Dropdown + Mobile Menu Button) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {roleBadgeLabel && (
              <div className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide shadow-xs ${roleBadgeClass}`}>
                <Sparkles size={12} className={user?.role === 'super_admin' ? 'text-purple-600' : 'text-rose-600'} />
                <span>{roleBadgeLabel}</span>
              </div>
            )}

            <AccountMenu user={user} logout={logout} />

            {/* Mobile / Tablet Menu Button (Visible below lg) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 lg:hidden"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile / Tablet Drawer (Visible below lg) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-pink-100/60 bg-white/95 px-4 pt-3 pb-3 backdrop-blur-xl sm:px-6 lg:hidden"
            >
              <div className="mx-auto max-w-[1240px] space-y-3">
                {/* Main Navigation Section */}
                <div>
                  <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Main Navigation
                  </p>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {primaryMenu.map((item) => {
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
                </div>

                {/* Tools & Secondary Navigation */}
                {filteredSecondaryMenu.length > 0 && (
                  <div>
                    <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Features & Services
                    </p>
                    <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {filteredSecondaryMenu.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                          location.pathname === item.path ||
                          (item.path !== '/' && location.pathname.startsWith(item.path));
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
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Route Accent Line */}
        <div className={`h-[2px] w-full bg-gradient-to-r ${routeAccent} opacity-80`} />
      </header>

      {/* Main Content Area - Aligned with navbar max-w-[1240px] and consistent padding */}
      <main className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-16 sm:px-6 lg:px-8">{children}</main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-[1240px] px-4 pb-8 sm:px-6 lg:px-8">
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

