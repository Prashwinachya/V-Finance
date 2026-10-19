import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  Calendar,
  Clock,
  ShieldCheck,
  Building,
  Key,
  Fingerprint,
  Receipt,
  Wallet,
  Copy,
  Check,
  MapPin,
  Phone,
  Sparkles,
} from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { formatDate } from '../../utils/format';

const UserDetailsModal = ({ user, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !user) return null;

  const handleCopyId = () => {
    if (user.id || user._id) {
      navigator.clipboard.writeText(user.id || user._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSuperAdmin = user.role === 'super_admin' || user.isSuperAdmin;
  const isAdmin = user.role === 'admin';

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
          className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/90 bg-white/95 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur-2xl custom-scrollbar"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3.5">
              <UserAvatar user={user} size="h-14 w-14" textSize="text-xl" className="ring-4 ring-pink-100 shadow-sm" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900">{user.name}</h3>
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                      <Sparkles size={11} className="text-purple-600" />
                      Super Admin
                    </span>
                  ) : isAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                      <ShieldCheck size={11} className="text-rose-600" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-xs font-bold text-pink-700">
                      User
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{user.email}</p>
              </div>
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

          {/* Quick ID Copy Banner */}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-bold uppercase tracking-wider text-slate-400">User ID:</span>
              <code className="font-mono text-slate-800">{user.id || user._id}</code>
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-xs hover:bg-pink-50 hover:text-pink-700 transition"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-pink-100/60 bg-pink-50/40 p-3.5 text-center">
              <Receipt className="mx-auto h-5 w-5 text-pink-600" />
              <p className="mt-2 text-lg font-extrabold text-slate-900">{user.transactionsCount ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transactions</p>
            </div>

            <div className="rounded-2xl border border-purple-100/60 bg-purple-50/40 p-3.5 text-center">
              <Wallet className="mx-auto h-5 w-5 text-purple-600" />
              <p className="mt-2 text-lg font-extrabold text-slate-900">{user.budgetsCount ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Budgets</p>
            </div>

            <div className="rounded-2xl border border-cyan-100/60 bg-cyan-50/40 p-3.5 text-center">
              <Building className="mx-auto h-5 w-5 text-cyan-600" />
              <p className="mt-2 text-xs font-extrabold text-slate-900 capitalize">
                {user.portalRole || user.portal || 'Student'}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Portal Mode</p>
            </div>

            <div className="rounded-2xl border border-emerald-100/60 bg-emerald-50/40 p-3.5 text-center">
              <Fingerprint className="mx-auto h-5 w-5 text-emerald-600" />
              <p className="mt-2 text-lg font-extrabold text-slate-900">
                {user.fingerprintCount || (user.fingerprintEnabled ? 1 : 0)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passkeys</p>
            </div>
          </div>

          {/* Details List */}
          <div className="mt-5 space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Profile</h4>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Calendar size={15} className="text-pink-500 shrink-0" />
                <span>Joined: <strong className="text-slate-800">{formatDate(user.createdAt)}</strong></span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-600">
                <Clock size={15} className="text-purple-500 shrink-0" />
                <span>Last Active: <strong className="text-slate-800">{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</strong></span>
              </div>

              {user.phone && (
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Phone size={15} className="text-slate-400 shrink-0" />
                  <span>Phone: <strong className="text-slate-800">{user.phone}</strong></span>
                </div>
              )}

              {(user.city || user.country) && (
                <div className="flex items-center gap-2.5 text-slate-600">
                  <MapPin size={15} className="text-slate-400 shrink-0" />
                  <span>Location: <strong className="text-slate-800">{[user.city, user.country].filter(Boolean).join(', ')}</strong></span>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-slate-600">
                <Key size={15} className="text-slate-400 shrink-0" />
                <span>Payment PIN: <strong className="text-slate-800">{user.requirePaymentPin || user.paymentPinEnabled ? 'Enforced' : 'Optional'}</strong></span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-600">
                <ShieldCheck size={15} className="text-slate-400 shrink-0" />
                <span>WebAuthn Biometrics: <strong className="text-slate-800">{user.hasBiometricCredential || user.fingerprintEnabled ? 'Active' : 'Not configured'}</strong></span>
              </div>
            </div>

            {user.bio && (
              <div className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                <span className="font-bold text-slate-500 block mb-0.5">Bio:</span>
                <p className="italic text-slate-700">{user.bio}</p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-5 py-2"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserDetailsModal;
