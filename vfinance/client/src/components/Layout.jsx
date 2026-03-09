import { ChevronDown, LayoutDashboard, Receipt, Plane, Wallet, ShieldCheck, Landmark, Settings, Radar, Coins, CreditCard } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const apiOrigin = String(import.meta.env.VITE_API_URL || 'http://localhost:5050/api').replace(/\/api\/?$/, '');

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
    activeClass: 'bg-violet-500 text-white',
    activeShadow: 'shadow-md shadow-violet-200',
  },
  {
    label: 'Smart Radar',
    path: '/subscriptions/radar',
    icon: Radar,
    activeClass: 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white',
    activeShadow: 'shadow-md shadow-fuchsia-200',
  },
  {
    label: 'Loan Optimizer',
    path: '/loans/optimizer',
    icon: Coins,
    activeClass: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white',
    activeShadow: 'shadow-md shadow-indigo-200',
  },
  {
    label: 'Payments',
    path: '/payments',
    icon: CreditCard,
    activeClass: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white',
    activeShadow: 'shadow-md shadow-fuchsia-200',
  },
  {
    label: 'Wallets',
    path: '/wallets',
    icon: Wallet,
    activeClass: 'bg-emerald-500 text-white',
    activeShadow: 'shadow-md shadow-emerald-200',
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
  const [open, setOpen] = useState(false);
  const navItems = menu.filter((item) => ['admin', 'super_admin'].includes(user?.role) || item.path !== '/admin');

  return (
    <div className="min-h-screen bg-rose-50/80">
      <header className="sticky top-0 z-20 px-3 pb-2 pt-2">
        <nav className="mx-auto flex w-full max-w-[1220px] flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 px-3 py-2.5 shadow-soft backdrop-blur-xl sm:px-4">
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

          <div className="relative order-2 ml-auto shrink-0">
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${apiOrigin}${user.avatarUrl}`}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-sm font-bold text-white">
                  {user?.name?.[0] || 'U'}
                </div>
              )}
              <span className="hidden max-w-[130px] truncate pr-1 text-sm font-semibold text-slate-600 sm:inline">{user?.name || 'User'}</span>
              <ChevronDown size={16} className="text-slate-500" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-100 bg-white p-2 shadow-lg">
                <p className="px-3 py-2 text-xs text-slate-500">{user?.email}</p>
                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  Settings
                </Link>
                <button
                  onClick={logout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1220px] px-3 pb-8 pt-3 sm:px-4">{children}</main>

      <footer className="mx-auto w-full max-w-[1220px] px-3 pb-6 sm:px-4">
        <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-center text-xs font-semibold text-slate-500 shadow-sm backdrop-blur">
          © {new Date().getFullYear()} Prashwin. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
