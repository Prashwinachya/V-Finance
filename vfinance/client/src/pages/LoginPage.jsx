import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BriefcaseBusiness, GraduationCap, Lock, LogIn, Mail, UserPlus } from 'lucide-react';
import { verifyLoginBiometric } from '../utils/paymentVerification';

const roleMeta = {
  student: {
    label: 'Student',
    icon: GraduationCap,
    helper: 'Track spending with manual entries and optional bank sync.',
    activeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  },
  business_user: {
    label: 'Business',
    icon: BriefcaseBusiness,
    helper: 'Sync high-volume bank transactions automatically.',
    activeClass: 'border-sky-300 bg-sky-50 text-sky-700',
  },
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, logout } = useAuth();

  const [activeRole, setActiveRole] = useState('student');
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedRole = mode === 'register' ? activeRole : activeRole;
  const currentRoleMeta = roleMeta[activeRole];

  const submit = async (event) => {
    event.preventDefault();
    setError('');
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
      const firstValidationMessage = responseData?.errors
        ? Object.values(responseData.errors)?.[0]?.[0]
        : null;
      setError(firstValidationMessage || responseData?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-rose-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-pink-400/15 blur-3xl" />
        <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-rose-100/70 via-rose-50/40 to-transparent" />
        <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'radial-gradient(#f43f5e 0.7px, transparent 0.7px)', backgroundSize: '22px 22px' }} />
      </div>

      <div className="animate-dashboard-in relative mx-auto grid w-full max-w-6xl items-start gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-fuchsia-600 via-pink-600 to-violet-600 p-6 text-white shadow-xl shadow-fuchsia-200/60 sm:p-8">
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-violet-200/20 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/95">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[10px] font-bold">V</span>
              VFinance Secure Portal
            </div>

            <h1 className="mt-6 text-3xl font-black leading-tight sm:text-4xl">
              Smart access for
              <br />
              Student and Business users
            </h1>

            <p className="mt-4 max-w-md text-sm text-white/90">
              Same trusted color identity, upgraded with a cleaner, modern portal experience.
            </p>

            <div className="mt-6 rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">Portal Benefits</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                  <p className="text-lg font-black text-white">2x</p>
                  <p className="text-[11px] text-white/85">Faster onboarding flow</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                  <p className="text-lg font-black text-white">100%</p>
                  <p className="text-[11px] text-white/85">Role-based transaction policy</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                  <p className="text-lg font-black text-white">24/7</p>
                  <p className="text-[11px] text-white/85">Bank sync visibility</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                <p className="text-[11px] text-white/90">
                  {activeRole === 'student'
                    ? 'Student portal: Add manual transactions anytime, plus optional bank sync.'
                    : 'Business portal: Bank-sync-first experience for high transaction volume.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-pink-100 backdrop-blur sm:p-6">
          <div className="mb-5">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-soft">
              <span className="text-xl font-bold">V</span>
            </div>
            <p className="mt-3 text-center text-2xl font-bold text-pink-600">VFinance</p>
            <h2 className="mt-3 text-center text-3xl font-extrabold tracking-tight text-slate-900">
              {mode === 'login' ? `${currentRoleMeta.label} Login` : `Create ${currentRoleMeta.label} Account`}
            </h2>
            <p className="mt-1 text-center text-sm text-slate-500">{currentRoleMeta.helper}</p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="text-xs font-semibold text-slate-700">Choose Portal</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
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
                      className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${isActive ? meta.activeClass : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${mode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="inline-flex items-center gap-1.5"><LogIn className="h-3.5 w-3.5" /> Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${mode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="inline-flex items-center gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Create</span>
              </button>
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  placeholder="Your name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                  required
                />
              </div>
            )}

            {mode === 'login' && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                Signing in through <span className="font-semibold">{currentRoleMeta.label}</span> portal.
              </p>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="you@example.com"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 pl-10 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="••••••••"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 pl-10 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-200"
                />
                Remember me
              </label>

              <a
                href="#"
                onClick={(event) => event.preventDefault()}
                className="text-xs font-semibold text-pink-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-rose-200 transition hover:from-rose-500 hover:to-fuchsia-500 active:scale-[0.99] disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <p className="pt-1 text-center text-xs text-slate-500">
              {mode === 'login'
                ? `New to ${currentRoleMeta.label}? Use Create above.`
                : `Already have a ${currentRoleMeta.label} account? Use Sign In above.`}
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
