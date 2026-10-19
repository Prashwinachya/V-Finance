import { useState } from 'react';
import { UserPlus, User, Mail, Lock, Shield, Eye, EyeOff, Building, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const CreateUserCard = ({ onCreateUser, isSuperAdmin, busy }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    portal: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please provide a full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      await onCreateUser(formData);
      setSuccessMsg(`User ${formData.name} created successfully!`);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        portal: 'student',
      });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to create user.');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/90 bg-white/95 p-6 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.07),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
      {/* Top Banner Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100/80 pb-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 text-white shadow-md shadow-pink-500/20">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
              Create New User Account
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Provision credentials, configure roles, and assign student or business portals.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-pink-100 bg-pink-50/70 px-3 py-1 text-xs font-bold text-pink-700 sm:self-auto">
          <Sparkles className="h-3.5 w-3.5 text-pink-500" />
          <span>Real-time Provisioning</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-2.5 text-xs font-semibold text-rose-700">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Modern Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Name Field */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Full Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Johnson"
                required
                className="input-soft w-full pl-10"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@vfinance.com"
                required
                className="input-soft w-full pl-10"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Temporary Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                className="input-soft w-full pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Role Field */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              System Role
            </label>
            <div className="relative">
              <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-soft w-full pl-10"
              >
                <option value="user">Standard User</option>
                {isSuperAdmin && <option value="admin">Admin</option>}
                {isSuperAdmin && <option value="student">Student Account</option>}
                {isSuperAdmin && <option value="business_user">Business User</option>}
              </select>
            </div>
          </div>

          {/* Portal Mode */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Assigned Portal
            </label>
            <div className="relative">
              <Building className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                name="portal"
                value={formData.portal}
                onChange={handleChange}
                className="input-soft w-full pl-10"
              >
                <option value="student">Student Portal (Campus Mode)</option>
                <option value="business_user">Business Portal (Commercial Mode)</option>
              </select>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy}
              className="btn-gradient w-full py-2.5 text-sm font-bold shadow-lg shadow-pink-500/25"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create User Account</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateUserCard;
