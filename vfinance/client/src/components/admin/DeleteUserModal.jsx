// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

const DeleteUserModal = ({ user, isOpen, onClose, onConfirm, busy, currentUserId }) => {
  if (!isOpen || !user) return null;

  const isSelf = String(currentUserId) === String(user.id || user._id);
  const isSuperAdmin = user.role === 'super_admin' || user.isSuperAdmin;

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
          className="relative z-10 w-full max-w-md rounded-3xl border border-white/90 bg-white/95 p-6 shadow-2xl shadow-rose-900/10 backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm">
              <AlertTriangle className="h-6 w-6" />
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

          <div className="mt-4">
            <h3 className="text-xl font-extrabold text-slate-900">Delete User Account</h3>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">{user.name}</strong> ({user.email})?
            </p>
            <p className="mt-1 text-xs text-rose-600 font-medium">
              This action will permanently purge this user, their linked transactions, and active budgets.
            </p>
          </div>

          {isSelf && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
              You cannot delete your own active administrator account.
            </div>
          )}

          {isSuperAdmin && (
            <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs font-bold text-purple-700">
              Super Admin accounts are protected from direct deletion.
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(user.id || user._id)}
              disabled={busy || isSelf || isSuperAdmin}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-200 transition hover:from-rose-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Confirm Delete</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteUserModal;
