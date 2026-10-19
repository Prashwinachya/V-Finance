import { LayoutDashboard, Receipt, Plane, Wallet, ShieldCheck, Landmark, Radar, Coins, CreditCard, Building2 } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountMenu from './AccountMenu';

const menu = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    activeClass: 'bg-slate-100 text-slate-900',
    activeShadow: 'shadow-sm',
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: Receipt,
    activeClass: 'bg-emerald-500 text-white',
    activeShadow: 'shadow-md shadow-emerald-200',
  },
  {
    label: 'Trip Planner',
    path: '/trip-planner',
    icon: Plane,
    activeClass: 'bg-gradient-to-r from-rose-600 to-red-500 text-white',
    activeShadow: 'shadow-md shadow-rose-200',
  },
  {
    label: 'Smart Radar',
    path: '/subscriptions/radar',
    icon: Radar,
    activeClass: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white',
    activeShadow: 'shadow-md shadow-emerald-200',
  },
  {
    label: 'Loan Optimizer',
    path: '/loans/optimizer',
    icon: Coins,
    activeClass: 'bg-gradient-to-r from-slate-700 to-blue-700 text-white',
    activeShadow: 'shadow-md shadow-slate-300',
  },
  {
    label: 'Payments',
    path: '/payments',
    icon: CreditCard,
    activeClass: 'bg-gradient-to-r from-fuchsia-600 to-rose-500 text-white',
    activeShadow: 'shadow-md shadow-rose-200',
  },
  {
    label: 'Wallets',
    path: '/wallets',
    icon: Wallet,
    activeClass: 'bg-gradient-to-r from-green-500 to-lime-500 text-white',
    activeShadow: 'shadow-md shadow-lime-200',
  },
  {
    label: 'Bank Sync',
    path: '/bank-sync',
    icon: Building2,
    activeClass: 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white',
    activeShadow: 'shadow-md shadow-cyan-200',
  },
  {
    label: 'Admin',
    path: '/admin',
    icon: ShieldCheck,
    activeClass: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white',
    activeShadow: 'shadow-md shadow-rose-200',
  },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const interfaceRole = user?.portalRole || user?.role;
  const showAdminBadge = location.pathname.startsWith('/admin') && ['admin', 'super_admin'].includes(user?.role);
  const roleBadgeLabel = showAdminBadge ? (user?.role === 'super_admin' ? 'Super Admin' : 'Admin') : null;
  const roleBadgeClass = user?.role === 'super_admin'
    ? 'border-purple-100 bg-purple-50 text-purple-700'
    : 'border-rose-100 bg-rose-50 text-rose-700';
  const navItems = menu.filter((item) => {
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

  const routeAccent = (() => {
    const path = location.pathname;
    if (path.startsWith('/transactions')) return 'from-emerald-500 to-teal-500';
    if (path.startsWith('/trip-planner')) return 'from-rose-600 to-red-500';
    if (path.startsWith('/subscriptions/radar')) return 'from-teal-500 to-emerald-500';
    if (path.startsWith('/loans/optimizer')) return 'from-slate-700 to-blue-700';
    if (path.startsWith('/payments')) return 'from-fuchsia-600 to-rose-500';
    if (path.startsWith('/bank-sync')) return 'from-cyan-600 to-blue-700';
    if (path.startsWith('/wallets')) return 'from-emerald-500 to-lime-500';
    if (path.startsWith('/admin')) return 'from-rose-500 to-pink-600';
    if (path.startsWith('/settings')) return 'from-slate-600 to-slate-800';
    return 'from-pink-500 to-violet-600';
  })();

  return (
    <div className="min-h-screen bg-rose-50/80">
      <header className="sticky top-0 z-20 px-3 pb-2 pt-2">
        <nav className="mx-auto flex w-full max-w-[1220px] flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 px-3 py-2.5 shadow-soft backdrop-blur-xl sm:px-4">
          <span className={`h-1 w-full rounded-full bg-gradient-to-r ${routeAccent}`} />
          <Link to="/" className="order-1 inline-flex shrink-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200">
              <Landmark size={18} />
            </span>
            <span className="text-2xl font-bold text-pink-600">VFinance</span>
          </Link>

          <div className="order-3 hidden basis-full pt-1 md:flex md:justify-center">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition duration-200 ${
                        isActive
                          ? `${item.activeClass} ${item.activeShadow}`
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon size={15} />
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="order-2 ml-auto shrink-0 flex items-center gap-2">
            {roleBadgeLabel && (
              <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${roleBadgeClass}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {roleBadgeLabel}
              </span>
            )}

            <AccountMenu user={user} logout={logout} />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1220px] px-3 pb-8 pt-3 sm:px-4">{children}</main>

      <footer className="mx-auto w-full max-w-[1220px] px-3 pb-6 sm:px-4">
        <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-center text-xs font-semibold text-slate-500 shadow-sm backdrop-blur">
          <span className={`mb-2 block h-0.5 w-full rounded-full bg-gradient-to-r ${routeAccent}`} />
          © {new Date().getFullYear()} Prashwin. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
