import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Shield, Building, Key, Fingerprint, Loader2 } from 'lucide-react';

const EditUserForm = ({ user, onClose, onSave, isSuperAdmin, busy }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user',
    portal: user?.portalRole || user?.portal || 'student',
    requirePaymentPin: Boolean(user?.requirePaymentPin),
    requirePaymentFingerprint: Boolean(user?.requirePaymentFingerprint),
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Valid email is required.');
      return;
    }

    try {
      await onSave(user.id || user._id, formData);
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to update user.');
    }
  };

  const isTargetSuperAdmin = user?.role === 'super_admin' || user?.isSuperAdmin;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/90 bg-white/95 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur-2xl custom-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Edit User Account</h3>
              <p className="text-xs font-semibold text-slate-500">
                Update account profile and system permissions for <strong className="text-slate-800">{user.name}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-2 text-xs font-semibold text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                  required
                  className="input-soft w-full pl-10"
                />
              </div>
            </div>

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
                  required
                  className="input-soft w-full pl-10"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
                    disabled={!isSuperAdmin || isTargetSuperAdmin}
                    className="input-soft w-full pl-10 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="user">User</option>
                    {isSuperAdmin && <option value="admin">Admin</option>}
                    {isSuperAdmin && <option value="student">Student</option>}
                    {isSuperAdmin && <option value="business_user">Business User</option>}
                    {isTargetSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Target Portal
                </label>
                <div className="relative">
                  <Building className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    name="portal"
                    value={formData.portal}
                    onChange={handleChange}
                    className="input-soft w-full pl-10"
                  >
                    <option value="student">Student Portal</option>
                    <option value="business_user">Business Portal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Options */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Security Enforcements
              </span>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="requirePaymentPin"
                  checked={formData.requirePaymentPin}
                  onChange={handleChange}
                  className="rounded text-pink-600 focus:ring-pink-500 h-4 w-4"
                />
                <Key size={14} className="text-slate-400" />
                <span>Require Payment PIN for all transfers</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="requirePaymentFingerprint"
                  checked={formData.requirePaymentFingerprint}
                  onChange={handleChange}
                  className="rounded text-pink-600 focus:ring-pink-500 h-4 w-4"
                />
                <Fingerprint size={14} className="text-slate-400" />
                <span>Require Biometric Authentication for transactions</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn-gradient px-6"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const EditUserModal = ({ user, isOpen, onClose, onSave, isSuperAdmin, busy }) => {
  if (!isOpen || !user) return null;
  return (
    <EditUserForm
      key={user.id || user._id}
      user={user}
      onClose={onClose}
      onSave={onSave}
      isSuperAdmin={isSuperAdmin}
      busy={busy}
    />
  );
};

export default EditUserModal;

