import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  BriefcaseBusiness,
  GraduationCap,
  Lock,
  LogIn,
  Mail,
  UserPlus,
  User,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap,
  PieChart,
  X,
  Building2,
  Receipt
} from 'lucide-react';
import { verifyLoginBiometric } from '../utils/paymentVerification';

const roleMeta = {
  student: {
    label: 'Student',
    subtitle: 'Campus & Personal Finance',
    icon: GraduationCap,
    helper: 'Track spending with manual entries, budget envelopes, and optional bank sync.',
    activeBorder: 'border-emerald-400',
    activeBg: 'bg-emerald-50/90 text-emerald-800 shadow-sm',
    badge: 'Campus Edition',
    balance: '₹24,850.00',
    statDelta: '+14.2% budget saved',
    statLabel: 'Semester Savings',
    sampleTransaction: {
      title: 'Tuition & Grants',
      amount: '+₹15,000',
      type: 'credit',
      category: 'Education'
    }
  },
  business_user: {
    label: 'Business',
    subtitle: 'Commercial & Cash Flow',
    icon: BriefcaseBusiness,
    helper: 'High-velocity transaction logging, automated bank feeds, and invoice tracking.',
    activeBorder: 'border-sky-400',
    activeBg: 'bg-sky-50/90 text-sky-800 shadow-sm',
    badge: 'Enterprise Feed',
    balance: '₹1,84,500.00',
    statDelta: '+28.5% operating margin',
    statLabel: 'Monthly Cash Flow',
    sampleTransaction: {
      title: 'Client Invoice #1084',
      amount: '+₹48,500',
      type: 'credit',
      category: 'Revenue'
    }
  },
};

const featureCards = [
  {
    icon: TrendingUp,
    title: 'Smart Expense Tracking',
    description: 'Real-time categorization, spending velocity alerts, and automated budget envelopes.',
    tag: 'Automated'
  },
  {
    icon: ShieldCheck,
    title: 'Secure Financial Management',
    description: 'Hardware-backed WebAuthn biometrics, 4-digit PIN security, and end-to-end bank encryption.',
    tag: 'Bank-Grade'
  },
  {
    icon: Sparkles,
    title: 'Student & Business Accounts',
    description: 'Tailored workflows designed for campus living or scaling enterprise commerce.',
    tag: 'Dual Persona'
  }
];

const capabilityPills = [
  'Track income & expenses',
  'Personal wallets',
  'Trip planner',
  'Financial insights',
  'Business ledger'
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, logout } = useAuth();

  const [activeRole, setActiveRole] = useState('student');
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const selectedRole = activeRole;
  const currentRoleMeta = roleMeta[activeRole];

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!form.name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!form.email.trim()) {
        setError('Please enter a valid email address.');
        return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const authenticatedUser = await login(form.email, form.password, remember, selectedRole);
        if (authenticatedUser?.fingerprintEnabled && authenticatedUser?.hasBiometricCredential) {
          await verifyLoginBiometric();
        }
        navigate('/');
      } else {
        await register(form.name, form.email, form.password, activeRole, remember);
        navigate('/settings?setupFingerprint=1');
      }
    } catch (requestError) {
      if (mode === 'login') {
        logout();
      }

      const responseData = requestError.response?.data;
      const status = requestError.response?.status;
      let displayMessage = '';

      if (responseData?.errors && typeof responseData.errors === 'object') {
        const errorValues = Object.values(responseData.errors);
        if (errorValues.length > 0) {
          const firstErr = errorValues[0];
          displayMessage = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
        }
      }

      if (!displayMessage && responseData?.message) {
        displayMessage = responseData.message;
      }

      if (!displayMessage) {
        if (status === 405) {
          displayMessage = 'Registration endpoint returned Method Not Allowed (405). The API request was received by the static frontend instead of the Laravel backend. Please check VITE_API_URL in production.';
        } else if (status === 404) {
          displayMessage = 'Authentication endpoint not found (404). Please verify your API URL configuration.';
        } else if (status && status >= 500) {
          displayMessage = 'The backend server encountered an error. Please try again shortly.';
        } else if (requestError.code === 'ERR_NETWORK' || !requestError.response) {
          displayMessage = 'Unable to connect to the authentication server. Please check your network connection or API URL configuration.';
        } else {
          displayMessage = mode === 'register'
            ? 'Registration failed. Please check the information provided and try again.'
            : 'Authentication failed. Please verify your credentials.';
        }
      }

      setError(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-rose-50/80 px-4 py-8 sm:px-6 sm:py-12 flex items-center justify-center">
      {/* Background Decorative Atmosphere */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="absolute -right-28 top-20 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-fuchsia-300/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#f43f5e 0.75px, transparent 0.75px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-rose-100/60 via-rose-50/30 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid w-full items-stretch gap-6 lg:grid-cols-[1.12fr_0.88fr]"
        >
          {/* ========================================================================= */}
          {/* LEFT HERO PANEL (Preserved Gradient, Enhanced Visual Storytelling)       */}
          {/* ========================================================================= */}
          <section className="relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-white/50 bg-gradient-to-br from-fuchsia-600 via-pink-600 to-violet-700 p-6 text-white shadow-2xl shadow-pink-500/25 sm:p-7 lg:p-8">
            {/* Ambient Lighting Orbs */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/10" />

            {/* Top Brand & Header Section */}
            <div className="relative z-10 space-y-3.5">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/95 backdrop-blur-md shadow-sm"
              >
                <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-white text-[10px] font-black text-pink-600 shadow-sm">
                  V
                </span>
                VFinance Portal • Dual-Mode System
              </motion.div>

              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[32px] lg:leading-[1.12]">
                  Smart access for
                  <br />
                  <span className="bg-gradient-to-r from-white via-pink-100 to-violet-200 bg-clip-text text-transparent">
                    Student and Business users
                  </span>
                </h1>
                <p className="max-w-md text-xs sm:text-[13px] leading-relaxed text-white/90 font-normal">
                  Track income, categorize expenses, and sync bank transactions with real-time financial intelligence tailored to your persona.
                </p>
              </div>

              {/* Dynamic Interactive Financial Preview Card */}
              <motion.div
                layout
                className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/15 p-3 backdrop-blur-md shadow-xl"
              >
                {/* Micro Header with Live Indicator */}
                <div className="flex items-center justify-between pb-2 border-b border-white/15">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                      Live Dashboard Simulation
                    </span>
                  </div>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                    {currentRoleMeta.badge}
                  </span>
                </div>

                {/* Balance & Micro Sparkline Grid */}
                <div className="pt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                  <div>
                    <p className="text-[10px] font-medium text-white/75">{currentRoleMeta.statLabel}</p>
                    <p className="text-xl font-black tracking-tight text-white mt-0.5">{currentRoleMeta.balance}</p>
                    <div className="inline-flex items-center gap-1.5 mt-0.5 text-[10.5px] font-semibold text-emerald-300">
                      <TrendingUp className="h-3 w-3" />
                      <span>{currentRoleMeta.statDelta}</span>
                    </div>
                  </div>

                  {/* Sleek SVG Sparkline Chart */}
                  <div className="rounded-xl bg-black/10 border border-white/15 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[9px] text-white/70 mb-0.5 font-medium">
                      <span>30-Day Velocity</span>
                      <span className="text-emerald-300 font-bold">Stable</span>
                    </div>
                    <svg className="w-full h-7 overflow-visible" viewBox="0 0 120 32">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,26 Q 20,24 35,18 T 70,14 T 95,8 T 120,4"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 0,26 Q 20,24 35,18 T 70,14 T 95,8 T 120,4 L 120,32 L 0,32 Z"
                        fill="url(#chartGradient)"
                      />
                      <circle cx="120" cy="4" r="3" fill="#34d399" />
                    </svg>
                  </div>
                </div>

                {/* Floating Transaction Pill */}
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2.5 flex items-center justify-between rounded-xl bg-white/20 border border-white/25 px-2.5 py-1.5 text-xs backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="grid h-5 w-5 place-items-center rounded-lg bg-white/25 text-white">
                      <Receipt className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-[11px] leading-tight">{currentRoleMeta.sampleTransaction.title}</p>
                      <p className="text-[9.5px] text-white/75">{currentRoleMeta.sampleTransaction.category} • Verified</p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-300 text-xs">
                    {currentRoleMeta.sampleTransaction.amount}
                  </span>
                </motion.div>
              </motion.div>

              {/* Three Feature Cards */}
              <div className="space-y-1.5">
                {featureCards.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <motion.div
                      key={feat.title}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.08, duration: 0.4 }}
                      className="group flex items-start gap-2.5 rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm transition-all duration-200 hover:bg-white/15 hover:border-white/30"
                    >
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/20 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11.5px] font-bold text-white leading-tight">{feat.title}</p>
                          <span className="text-[8.5px] font-semibold text-pink-200 uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded">
                            {feat.tag}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10.5px] leading-relaxed text-white/80">
                          {feat.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Capability Tag Cloud */}
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Built-in Financial Modules
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {capabilityPills.map((pill) => (
                    <span
                      key={pill}
                      className="rounded-lg border border-white/20 bg-white/10 px-2 py-0.5 text-[9.5px] font-medium text-white/90 backdrop-blur-sm"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Security & Privacy Indicator */}
            <div className="relative z-10 mt-3 pt-2.5 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] text-white/85">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                <span>256-Bit SSL Encryption • WebAuthn Passkeys</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-pink-200">
                <Zap className="h-3 w-3 text-amber-300" />
                <span>Real-Time Bank Sync</span>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* RIGHT LOGIN CARD (Preserved Brand Colors, Elevated UX & Micro-Motions)   */}
          {/* ========================================================================= */}
          <section className="flex flex-col justify-between rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-2xl shadow-pink-200/50 backdrop-blur-md sm:p-8 lg:p-9">
            <div>
              {/* Logo & Headline */}
              <div className="mb-6 text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-violet-600 text-white shadow-lg shadow-pink-300/40"
                >
                  <span className="text-2xl font-black tracking-wider">V</span>
                </motion.div>
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                  VFinance Portal
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {mode === 'login' ? `Sign In to ${currentRoleMeta.label}` : `Create ${currentRoleMeta.label} Account`}
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {currentRoleMeta.helper}
                </p>
              </div>

              {/* Form Content */}
              <form className="space-y-4" onSubmit={submit}>
                {/* Portal Selector (Student vs Business) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Access Portal
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Switch anytime
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                    {Object.entries(roleMeta).map(([roleKey, meta]) => {
                      const Icon = meta.icon;
                      const isActive = activeRole === roleKey;
                      return (
                        <button
                          key={`form-role-${roleKey}`}
                          type="button"
                          onClick={() => {
                            setActiveRole(roleKey);
                            setForm((prev) => ({ ...prev, role: roleKey }));
                            setError('');
                          }}
                          className={`relative rounded-xl py-2.5 px-3 text-left transition-all duration-200 flex items-center gap-2.5 ${
                            isActive
                              ? `${meta.activeBg} border ${meta.activeBorder}`
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          <div className={`grid h-7 w-7 place-items-center rounded-lg ${
                            isActive ? 'bg-white shadow-sm' : 'bg-slate-200/70 text-slate-500'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold leading-tight">{meta.label}</p>
                            <p className="text-[10px] text-slate-500 truncate">{meta.subtitle.split('&')[0]}</p>
                          </div>
                          {isActive && (
                            <motion.div
                              layoutId="activeRoleDot"
                              className="h-1.5 w-1.5 rounded-full bg-pink-600"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sign In vs Create Account Mode Switcher */}
                <div className="relative grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/90 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors ${
                      mode === 'login' ? 'text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {mode === 'login' && (
                      <motion.div
                        layoutId="activeAuthModePill"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <LogIn className="h-3.5 w-3.5" /> Sign In
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors ${
                      mode === 'register' ? 'text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {mode === 'register' && (
                      <motion.div
                        layoutId="activeAuthModePill"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <UserPlus className="h-3.5 w-3.5" /> Create Account
                    </span>
                  </button>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-rose-700 shadow-sm"
                    >
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">{error}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Fields Container */}
                <div className="space-y-3.5">
                  {/* Full Name Field (Register Mode Only) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            placeholder="John Doe"
                            type="text"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 pl-10 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100"
                            required
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        placeholder="you@domain.com"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 pl-10 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={form.password}
                        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-pink-600 accent-pink-600 focus:ring-pink-200"
                      />
                      Remember this device
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-semibold text-pink-600 hover:text-pink-700 hover:underline transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* Primary Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-violet-600 px-4 py-3 text-sm font-black tracking-wide text-white shadow-lg shadow-pink-200 transition duration-200 hover:from-pink-500 hover:via-rose-500 hover:to-violet-500 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Authenticating…</span>
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Sign In to {currentRoleMeta.label}</span>
                      <ArrowRight className="h-4 w-4 ml-1 opacity-80" />
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Create {currentRoleMeta.label} Account</span>
                      <ArrowRight className="h-4 w-4 ml-1 opacity-80" />
                    </>
                  )}
                </motion.button>

                {/* Footer Switch Prompt */}
                <p className="pt-2 text-center text-xs text-slate-500 font-medium">
                  {mode === 'login' ? (
                    <>
                      Need a new account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError('');
                        }}
                        className="font-bold text-pink-600 hover:underline"
                      >
                        Register as {currentRoleMeta.label}
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError('');
                        }}
                        className="font-bold text-pink-600 hover:underline"
                      >
                        Sign In here
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>

            {/* Bottom Compliance & Role Indicator */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Protected Session
              </span>
              <span>VFinance Core 2.4</span>
            </div>
          </section>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-pink-50 text-pink-600">
                    <Lock className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Password Assistance</h3>
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-sm text-slate-600">
                <p>
                  To protect your financial wallets and bank records, password resets require security verification.
                </p>
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60 text-xs space-y-1.5">
                  <p className="font-semibold text-slate-700">Security Options:</p>
                  <p>1. If you previously enrolled biometric credentials (Fingerprint/Face), you can sign in directly on your enrolled device.</p>
                  <p>2. For enterprise or student administrator password resets, please contact your portal administrator or support desk.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
