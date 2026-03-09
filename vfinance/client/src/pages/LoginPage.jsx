import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, LogIn, Mail } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(form.email, form.password, remember);
      } else {
        await register(form.name, form.email, form.password, remember);
      }
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-rose-50 px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-400/10 blur-2xl" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-violet-400/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-slate-100/60 to-transparent" />
      </div>

      <div className="animate-dashboard-in relative w-full max-w-sm">
        <div className="mb-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-soft">
            <span className="text-xl font-bold">V</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-pink-600">VFinance</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {mode === 'login' ? 'Welcome Fam' : 'Create Account'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'login' ? 'Sign in to your VFinance account' : 'Create your VFinance account'}
          </p>

          <div className="mx-auto mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-slate-200" />
            <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
            <span className="h-px w-12 bg-slate-200" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-pink-100 backdrop-blur">
          <form className="space-y-4" onSubmit={submit}>
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

            {error && <p className="text-sm font-semibold text-rose-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-rose-200 transition hover:from-rose-500 hover:to-fuchsia-500 active:scale-[0.99] disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <p className="pt-1 text-center text-xs text-slate-500">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button type="button" onClick={() => setMode('register')} className="font-semibold text-pink-600 hover:underline">
                    Create one here
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('login')} className="font-semibold text-pink-600 hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
