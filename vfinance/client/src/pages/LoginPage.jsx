import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  Receipt,
  Plane,
  CreditCard,
  LineChart,
  Calculator,
  Landmark,
  Activity,
  ArrowDown,
  Shield,
  Layers,
  Sliders
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
    velocityLabel: 'Campus Velocity',
    velocityVal: '₹6,450 /mo',
    runwayLabel: 'Semester Runway',
    runwayVal: '5.2 Months',
    savingsRate: '38.4%',
    personaBenefit: 'Designed for campus living, roommates, mess split envelopes & zero-fee instant UPI payments.',
    sampleTransaction: {
      title: 'Tuition & Grants',
      amount: '+₹15,000',
      type: 'credit',
      category: 'Education'
    },
    floatingEvent1: {
      title: 'Scholarship Grant Credit',
      amount: '+₹15,000',
      tag: 'Education Vault • UPI',
      status: 'Verified'
    },
    floatingEvent2: {
      title: 'Trip Envelope: Goa Vacation',
      detail: '84% target reached • 4/5 friends paid',
      badge: 'Auto-Split',
      accent: 'text-amber-300'
    },
    chartPath: 'M 0,26 C 20,24 35,16 60,19 C 85,21 100,10 120,4',
    chartFill: 'M 0,26 C 20,24 35,16 60,19 C 85,21 100,10 120,4 L 120,32 L 0,32 Z',
    peakLabel: '₹15K Grant Inflow'
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
    velocityLabel: 'Billing Velocity',
    velocityVal: '₹82,100 /mo',
    runwayLabel: 'Operating Runway',
    runwayVal: '8.4 Months',
    savingsRate: '42.1%',
    personaBenefit: 'Engineered for high-velocity transaction logging, GST ledger auto-sync & bulk vendor payouts.',
    sampleTransaction: {
      title: 'Client Invoice #1084',
      amount: '+₹48,500',
      type: 'credit',
      category: 'Revenue'
    },
    floatingEvent1: {
      title: 'Client Settlement #1084',
      amount: '+₹48,500',
      tag: 'Current A/C • Bank Sync',
      status: 'Verified'
    },
    floatingEvent2: {
      title: 'GST & Tax Reserve Vault',
      detail: '₹18,200 auto-allocated • Zero tax leak',
      badge: 'Auto-Vault',
      accent: 'text-sky-300'
    },
    chartPath: 'M 0,28 C 22,23 45,15 68,12 C 88,9 104,6 120,2',
    chartFill: 'M 0,28 C 22,23 45,15 68,12 C 88,9 104,6 120,2 L 120,32 L 0,32 Z',
    peakLabel: '₹48.5K Peak Margin'
  },
};

const landingFeatures = [
  {
    id: 'expense',
    title: 'Expense Tracking',
    icon: Receipt,
    tag: 'Automated',
    category: 'Core Tracking',
    description: 'Instant receipt capture, real-time auto-categorization, and anomalous spending velocity alerts that prevent month-end surprises.',
    highlights: ['Camera receipt OCR parsing', 'Category breakdown graphs', 'Velocity threshold triggers']
  },
  {
    id: 'wallets',
    title: 'Smart Wallets',
    icon: Wallet,
    tag: 'Multi-Vault',
    category: 'Asset Management',
    description: 'Segregated digital envelopes with custom rule-based liquidity allocation to partition rent, taxes, savings, and operating expenses.',
    highlights: ['Automated deposit routing', 'Protected emergency vaults', 'Sub-account ledger isolation']
  },
  {
    id: 'budget',
    title: 'Budget Management',
    icon: PieChart,
    tag: 'Envelope System',
    category: 'Financial Discipline',
    description: 'Zero-based budgeting envelopes that empower both students managing semester grants and businesses managing department spend.',
    highlights: ['Dynamic monthly cap sliders', 'Overspending alerts', 'Rollover surplus balances']
  },
  {
    id: 'forecast',
    title: 'Cash Flow Forecasting',
    icon: TrendingUp,
    tag: 'AI Telemetry',
    category: 'Intelligence',
    description: 'Predictive cash runway calculations that forecast future balance trajectories and flag upcoming liquidity crunches weeks in advance.',
    highlights: ['90-day balance projections', 'Recurring bill timeline', 'Safe-to-spend limits']
  },
  {
    id: 'trip',
    title: 'Trip Planner',
    icon: Plane,
    tag: 'Group Splits',
    category: 'Collaboration',
    description: 'Collaborative travel budgeting with shared expense pools, receipt logging, and mathematically fair debt settlement matrices.',
    highlights: ['Multi-currency conversions', 'Simplified balance debt math', 'Offline receipt cache']
  },
  {
    id: 'loan',
    title: 'Loan Optimizer',
    icon: Calculator,
    tag: 'Amortization',
    category: 'Debt Strategy',
    description: 'Intelligent EMI payoff acceleration tools that demonstrate how small principal prepayments slash total interest and loan duration.',
    highlights: ['Student loan payback roadmap', 'Commercial equipment amortization', 'Prepayment interest savings']
  },
  {
    id: 'trader',
    title: 'Smart Trader',
    icon: LineChart,
    tag: 'Market Radar',
    category: 'Investment',
    description: 'Real-time market analytics, paper trading simulation leagues for students, and corporate treasury yield tracking for enterprises.',
    highlights: ['Zero-risk paper simulator', 'Asset portfolio sync', 'Yield benchmark alerts']
  }
];

const benefitPillars = [
  {
    title: 'Total Money Control',
    description: 'Unify bank accounts, digital cash, and savings envelopes in a single, lightning-fast dashboard.',
    icon: Layers,
    color: 'from-pink-500 to-rose-500'
  },
  {
    title: 'Spending Velocity Radar',
    description: 'Detect subscription creep, stealth charges, and budget leaks the exact moment they occur.',
    icon: Activity,
    color: 'from-rose-500 to-fuchsia-600'
  },
  {
    title: 'Proactive Budget Envelopes',
    description: 'Automatically allocate incoming funds to tuition, rent, taxes, or payroll before spending begins.',
    icon: Sliders,
    color: 'from-fuchsia-600 to-violet-600'
  },
  {
    title: 'Data-Backed Financial Decisions',
    description: 'Make informed personal or commercial decisions using predictive runway and cashburn analytics.',
    icon: Sparkles,
    color: 'from-violet-600 to-indigo-600'
  }
];

const securityPillars = [
  {
    title: 'WebAuthn Hardware Passkeys',
    description: 'Hardware-backed biometric passkeys (Touch ID, Face ID, Windows Hello) eliminate vulnerable passwords.',
    icon: ShieldCheck
  },
  {
    title: '256-Bit TLS End-to-End Encryption',
    description: 'Bank-grade cryptographic encryption secures all API communications, authentication tokens, and ledger data.',
    icon: Lock
  },
  {
    title: 'Isolated Role-Based Permissions',
    description: 'Strict architectural segregation ensures student records and enterprise corporate ledgers remain strictly compartmentalized.',
    icon: Shield
  },
  {
    title: 'Private & Localized Data Vault',
    description: 'Zero third-party monetization. Your financial transactions and personal identity records are never profiled or sold.',
    icon: Landmark
  }
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [activeRole, setActiveRole] = useState('student');
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [previewRole, setPreviewRole] = useState('student');

  const selectedRole = activeRole;
  const currentRoleMeta = roleMeta[activeRole];
  const activePreviewMeta = roleMeta[previewRole];

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

  const scrollToLogin = () => {
    document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-slate-800 antialiased selection:bg-pink-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. STICKY TOP NAVIGATION BAR                                             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full border-b border-pink-100/80 bg-white/85 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <a href="#hero" className="flex items-center gap-3 group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-violet-600 text-white shadow-md shadow-pink-300/40 transition-transform duration-200 group-hover:scale-105">
              <span className="text-xl font-black">V</span>
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900">VFinance</span>
              <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700 uppercase tracking-wider">
                Portal
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#about" className="hover:text-pink-600 transition-colors">
              About
            </a>
            <a href="#features" className="hover:text-pink-600 transition-colors">
              Features
            </a>
            <a href="#benefits" className="hover:text-pink-600 transition-colors">
              Benefits
            </a>
            <a href="#security" className="hover:text-pink-600 transition-colors">
              Security
            </a>
          </nav>

          {/* Right Action Button */}
          <button
            type="button"
            onClick={scrollToLogin}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-pink-200 transition duration-200 hover:from-pink-500 hover:to-violet-500 cursor-pointer"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      </header>

      <main>
        {/* ========================================================================= */}
        {/* 2. HERO SECTION                                                          */}
        {/* ========================================================================= */}
        <section id="hero" className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
          {/* Ambient Lighting Orbs */}
          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
            <motion.div
              animate={shouldReduceMotion ? {} : { scale: [1, 1.08, 1], x: [0, 15, 0], y: [0, -10, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-28 -top-28 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-pink-400/20 to-fuchsia-300/15 blur-[100px]"
            />
            <motion.div
              animate={shouldReduceMotion ? {} : { scale: [1, 1.1, 1], x: [0, -18, 0], y: [0, 14, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -right-28 top-16 h-[520px] w-[520px] rounded-full bg-gradient-to-bl from-violet-400/20 to-pink-300/15 blur-[110px]"
            />
            <div
              className="absolute inset-0 opacity-45"
              style={{
                backgroundImage: 'radial-gradient(#f43f5e 0.75px, transparent 0.75px)',
                backgroundSize: '24px 24px'
              }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Heading, Subtitle & Action Buttons */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-3.5 py-1 text-xs font-bold text-pink-700 shadow-xs backdrop-blur-sm"
                >
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>VFinance 2.4 • Dual-Engine Financial Architecture</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-slate-900 leading-[1.08]"
                >
                  Intelligent Wealth for{' '}
                  <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-violet-600 bg-clip-text text-transparent">
                    Campus & Commerce
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.18 }}
                  className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-relaxed text-slate-600 font-normal"
                >
                  The unified fintech platform built for both worlds. Master student campus living with smart budget envelopes, or scale enterprise commercial operations with real-time bank reconciliation, tax reserves, and cash-flow telemetry.
                </motion.p>

                {/* Primary CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
                >
                  <button
                    type="button"
                    onClick={scrollToLogin}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-pink-300/40 transition duration-200 hover:from-pink-500 hover:to-violet-500 cursor-pointer"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In to Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <a
                    href="#features"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-xs transition duration-200 hover:bg-white hover:text-slate-900 hover:border-slate-300 cursor-pointer"
                  >
                    <span>Explore Features</span>
                    <ArrowDown className="h-4 w-4 text-slate-400" />
                  </a>
                </motion.div>

                {/* Trust Badges Row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-500"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Hardware WebAuthn Biometrics
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-pink-600" />
                    256-Bit SSL Encryption
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Real-Time Bank Sync
                  </span>
                </motion.div>
              </div>

              {/* Right Column: Sophisticated Financial Dashboard Preview */}
              <div className="lg:col-span-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative overflow-hidden rounded-[28px] border border-white/50 bg-gradient-to-br from-fuchsia-600 via-pink-600 to-violet-700 p-6 text-white shadow-2xl shadow-pink-500/25 sm:p-7"
                >
                  {/* Subtle Inner Ambient Glow */}
                  <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-violet-300/25 blur-3xl" />

                  {/* Header with Interactive Role Switcher for Preview */}
                  <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-white/20">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-300/50" />
                      <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                        Live Simulation Deck
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/20">
                      <button
                        type="button"
                        onClick={() => setPreviewRole('student')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          previewRole === 'student' ? 'bg-white text-pink-700 shadow-sm' : 'text-white/80 hover:text-white'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewRole('business_user')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          previewRole === 'business_user' ? 'bg-white text-sky-800 shadow-sm' : 'text-white/80 hover:text-white'
                        }`}
                      >
                        Business
                      </button>
                    </div>
                  </div>

                  {/* Balance & Metrics Grid */}
                  <div className="relative z-10 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
                        {activePreviewMeta.statLabel}
                      </p>
                      <p className="text-3xl font-black tracking-tight text-white mt-1">
                        {activePreviewMeta.balance}
                      </p>
                      <div className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/20 px-2.5 py-0.5 rounded-md border border-emerald-400/25">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{activePreviewMeta.statDelta}</span>
                      </div>

                      <div className="mt-2.5 space-y-1 text-xs text-white/85">
                        <p>{activePreviewMeta.velocityLabel}: <strong className="text-white">{activePreviewMeta.velocityVal}</strong></p>
                        <p>{activePreviewMeta.runwayLabel}: <strong className="text-white">{activePreviewMeta.runwayVal}</strong></p>
                      </div>
                    </div>

                    {/* Animated SVG Sparkline Wave Chart */}
                    <div className="rounded-2xl bg-black/20 border border-white/20 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] text-white/80 mb-1 font-semibold">
                        <span>30-Day Cash Velocity</span>
                        <span className="text-emerald-300 font-bold flex items-center gap-1">
                          <Activity className="h-3 w-3" /> Live
                        </span>
                      </div>
                      <svg className="w-full h-11 overflow-visible" viewBox="0 0 120 32">
                        <defs>
                          <linearGradient id="heroPreviewGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0,20 L 120,8"
                          fill="none"
                          stroke="#ffffff"
                          strokeOpacity="0.25"
                          strokeDasharray="2 3"
                          strokeWidth="1"
                        />
                        <motion.path
                          key={`path-${previewRole}`}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          d={activePreviewMeta.chartPath}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <motion.path
                          key={`fill-${previewRole}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          d={activePreviewMeta.chartFill}
                          fill="url(#heroPreviewGrad)"
                        />
                        <circle cx="120" cy="4" r="3.5" fill="#34d399" />
                        <circle cx="120" cy="4" r="6" fill="#34d399" opacity="0.3" className="animate-ping" />
                      </svg>
                      <div className="mt-1 flex items-center justify-between text-[9.5px] text-white/70">
                        <span>Savings: {activePreviewMeta.savingsRate}</span>
                        <span className="font-semibold text-pink-200">{activePreviewMeta.peakLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Micro-Cards */}
                  <div className="relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Floating Card 1 */}
                    <motion.div
                      key={`ev1-${previewRole}`}
                      animate={shouldReduceMotion ? {} : { y: [0, -3.5, 0] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="flex items-center justify-between rounded-xl bg-white/20 border border-white/25 px-3 py-2 text-xs backdrop-blur-sm shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/25 text-white">
                          <Receipt className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="font-bold text-white text-[11px] leading-tight truncate">
                            {activePreviewMeta.floatingEvent1.title}
                          </p>
                          <p className="text-[9px] text-white/80 truncate">
                            {activePreviewMeta.floatingEvent1.tag}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-emerald-300 text-xs shrink-0 ml-1.5">
                        {activePreviewMeta.floatingEvent1.amount}
                      </span>
                    </motion.div>

                    {/* Floating Card 2 */}
                    <motion.div
                      key={`ev2-${previewRole}`}
                      animate={shouldReduceMotion ? {} : { y: [0, 3.5, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className="flex items-center justify-between rounded-xl bg-white/20 border border-white/25 px-3 py-2 text-xs backdrop-blur-sm shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/25 text-white">
                          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="font-bold text-white text-[11px] leading-tight truncate">
                            {activePreviewMeta.floatingEvent2.title}
                          </p>
                          <p className="text-[9px] text-white/80 truncate">
                            {activePreviewMeta.floatingEvent2.detail}
                          </p>
                        </div>
                      </div>
                      <span className="rounded bg-white/20 px-2 py-0.5 text-[8.5px] font-bold text-white uppercase tracking-wider shrink-0 ml-1.5">
                        {activePreviewMeta.floatingEvent2.badge}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. DEDICATED LOGIN SECTION (STRICTLY PRESERVED & LOCKED LOGIN CARD)      */}
        {/* ========================================================================= */}
        <section id="login-section" className="relative py-16 sm:py-24 bg-gradient-to-b from-transparent via-pink-100/40 to-transparent">
          <div className="mx-auto max-w-xl px-4 sm:px-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-200/80 bg-white/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-pink-600 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                Dedicated Access Portal
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Sign In to Your Workspace
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Choose Student or Business mode below to authenticate and enter your account.
              </p>
            </div>

            {/* ========================================================================= */}
            {/* LOCKED LOGIN CARD (EXACT UNTOUCHED CODE)                                  */}
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
                            className={`relative rounded-xl py-2.5 px-3 text-left transition-all duration-200 flex items-center gap-2.5 ${isActive
                                ? `${meta.activeBg} border ${meta.activeBorder}`
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                              }`}
                          >
                            <div className={`grid h-7 w-7 place-items-center rounded-lg ${isActive ? 'bg-white shadow-sm' : 'bg-slate-200/70 text-slate-500'
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
                      className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors ${mode === 'login' ? 'text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                      className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors ${mode === 'register' ? 'text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. ABOUT V FINANCE SECTION                                               */}
        {/* ========================================================================= */}
        <section id="about" className="py-20 sm:py-28 bg-white border-y border-pink-100/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-pink-600">
                About V Finance
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                One Platform. Two Tailored Financial Engines.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Personal campus living and commercial operations have fundamentally different requirements. VFinance solves this by delivering two dedicated operational modes within one unified, bank-grade platform.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Mode Card */}
              <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-pink-50/20 p-8 shadow-sm transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Student & Campus Mode</h3>
                    <p className="text-xs font-semibold text-emerald-700">Personal Autonomy & Campus Living</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                  Designed specifically for students navigating university life, roommates, and personal budgets. Eliminates awkward debt reminders and end-of-month broke surprises.
                </p>

                <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Automated split calculations for mess bills, rent, and groceries</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Digital envelope budgeting to lock away fee money and rent</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Student loan repayment roadmap with interest payoff simulations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Zero-fee instant peer UPI transfers with automated settlement logs</span>
                  </li>
                </ul>
              </div>

              {/* Business Mode Card */}
              <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50/50 via-white to-violet-50/20 p-8 shadow-sm transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-200">
                    <BriefcaseBusiness className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Commercial & Business Mode</h3>
                    <p className="text-xs font-semibold text-sky-700">Cash-Flow Velocity & Ledger Control</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                  Engineered for commercial transaction logging, invoice reconciliation, tax provisioning, and live multi-bank account synchronization.
                </p>

                <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Automated GST and income tax reserve allocation on every credit</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Dynamic client invoicing with QR scan-and-pay reconciliation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Multi-entity corporate current account real-time statement sync</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>EBITDA margin telemetry, operating runway, and cash burn forecasts</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. FEATURES SECTION                                                      */}
        {/* ========================================================================= */}
        <section id="features" className="py-20 sm:py-28 bg-gradient-to-b from-[#FFF5F7] to-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-pink-600">
                Core Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                Engineered to Automate Every Financial Workflow
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Discover the 7 modular financial tools built directly into V Finance to streamline budgeting, loans, travel, and capital growth.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {landingFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.id}
                    className="group relative flex flex-col justify-between rounded-3xl border border-pink-100/80 bg-white/90 p-7 shadow-sm transition-all duration-200 hover:shadow-xl hover:shadow-pink-100 hover:border-pink-300"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-violet-600 text-white shadow-md shadow-pink-200 transition-transform duration-200 group-hover:scale-105">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="rounded-full bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-700">
                          {feat.tag}
                        </span>
                      </div>

                      <h3 className="mt-5 text-xl font-bold text-slate-900">
                        {feat.title}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-pink-600 uppercase tracking-wider">
                        {feat.category}
                      </p>

                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 space-y-1.5">
                      {feat.highlights.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. BENEFITS SECTION                                                      */}
        {/* ========================================================================= */}
        <section id="benefits" className="py-20 sm:py-28 bg-white border-y border-pink-100/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-pink-600">
                User Benefits
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                Clarity, Control, and Confidence Over Every Rupee
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Whether you are managing pocket allowances or commercial payroll, V Finance gives you the telemetry to navigate finances without friction.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefitPillars.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="relative rounded-3xl border border-pink-100/80 bg-gradient-to-b from-rose-50/40 via-white to-white p-6 shadow-xs hover:shadow-md transition"
                  >
                    <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${benefit.color} text-white shadow-md shadow-pink-200 mb-5`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. SECURITY & PRIVACY SECTION                                            */}
        {/* ========================================================================= */}
        <section id="security" className="py-20 sm:py-28 bg-gradient-to-b from-[#FFF5F7] to-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-pink-600">
                Security & Privacy
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                Bank-Grade Architecture. Zero Compromises.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Financial records require absolute integrity. VFinance employs hardware-backed passkeys, zero-trust token handling, and end-to-end encrypted transport rails.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {securityPillars.map((sec) => {
                const Icon = sec.icon;
                return (
                  <div
                    key={sec.title}
                    className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-pink-300 transition"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-pink-50 text-pink-600 mb-4">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {sec.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {sec.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Bottom Call to Action Banner */}
            <div className="mt-16 rounded-3xl border border-pink-200 bg-gradient-to-r from-pink-600 via-rose-600 to-violet-600 p-8 sm:p-12 text-white text-center shadow-xl shadow-pink-300/40">
              <h3 className="text-2xl sm:text-3xl font-black">
                Ready to Upgrade Your Financial Intelligence?
              </h3>
              <p className="mt-2 text-sm sm:text-base text-white/90 max-w-2xl mx-auto">
                Join thousands of students and growing businesses taking full command of their budgets, transactions, and future runway.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={scrollToLogin}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-black text-pink-600 shadow-md hover:bg-pink-50 transition cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Access Your Account Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-pink-100/80 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
            {/* Column 1: Brand Info */}
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-pink-500 via-rose-500 to-violet-600 text-white font-black text-sm">
                  V
                </div>
                <span className="text-base font-black text-slate-900">VFinance</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The next-generation financial operating system engineered for students living on campus and commercial businesses driving cash flow.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational (99.98% Uptime)</span>
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Navigation</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 font-medium">
                <li><a href="#hero" className="hover:text-pink-600 transition">Home</a></li>
                <li><a href="#about" className="hover:text-pink-600 transition">About Dual Modes</a></li>
                <li><a href="#features" className="hover:text-pink-600 transition">All 7 Modules</a></li>
                <li><a href="#benefits" className="hover:text-pink-600 transition">Platform Benefits</a></li>
                <li><a href="#security" className="hover:text-pink-600 transition">Security Architecture</a></li>
              </ul>
            </div>

            {/* Column 3: Platform Features */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Core Tools</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 font-medium">
                <li>Expense Tracking & OCR</li>
                <li>Multi-Vault Smart Wallets</li>
                <li>Cash Flow Forecasting</li>
                <li>Collaborative Trip Planner</li>
                <li>Loan Payoff Optimizer</li>
                <li>Smart Trader Simulator</li>
              </ul>
            </div>

            {/* Column 4: Access Portal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Sign In</h4>
              <p className="mt-3 text-xs text-slate-500">
                Instant access to your verified Student or Business dashboard.
              </p>
              <button
                type="button"
                onClick={scrollToLogin}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Open Login Card</span>
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} VFinance Portal Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>WebAuthn Biometric Guard</span>
              <span>256-Bit SSL Secured</span>
              <span>Privacy-First Architecture</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal (Unchanged) */}
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
