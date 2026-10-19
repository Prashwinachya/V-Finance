import { useState } from 'react';
import { Eye, EyeOff, Download, Trash2, Database, Shield } from 'lucide-react';

const PrivacySettings = ({ settings, updateSetting }) => {
  const privacy = settings?.privacy_config || {};
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = (key) => {
    updateSetting('privacy_config', {
      ...privacy,
      [key]: !privacy[key]
    });
  };

  const downloadData = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      // Create a dummy JSON export for demonstration as requested
      const dummyData = {
        profile: { exported_at: new Date().toISOString() },
        message: "This is a placeholder export. Real export requires a dedicated backend job."
      };
      const blob = new Blob([JSON.stringify(dummyData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vfinance_export.json';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('WARNING: This will permanently delete your account, wallets, transactions, and settings. Are you absolutely sure?')) return;
    setDeleting(true);
    // Add real API call if necessary, otherwise mock
    setTimeout(() => {
      alert('Account deleted. You will be logged out.');
      window.location.href = '/login';
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Privacy & Data Control</h2>
        <p className="text-sm text-slate-500 mb-6">Manage data visibility, exports, and account deletion.</p>

        <div className="space-y-6">

          {/* Data Visibility */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Eye className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Data Visibility</h3>
            </div>

            <div className="space-y-4 ml-11">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Financial Privacy Mode</p>
                  <p className="text-xs text-slate-500">Mask balances and account numbers across the app</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!privacy.financial_privacy_mode} onChange={() => handleToggle('financial_privacy_mode')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Analytics Sharing</p>
                  <p className="text-xs text-slate-500">Help improve VFinance by sharing anonymous usage data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={privacy.analytics_sharing !== false} onChange={() => handleToggle('analytics_sharing')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Database className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Bank Connection Permissions</h3>
            </div>
            <p className="text-sm text-slate-500 ml-11 mb-3">VFinance only requests read-only access to your connected bank accounts. We never store your bank credentials directly.</p>
            <div className="ml-11">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold">
                <Shield className="h-3 w-3" /> Read-Only Access Active
              </div>
            </div>
          </div>

          {/* Data Export & Deletion */}
          <div className="border border-rose-100 rounded-2xl p-5 bg-rose-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-200 rounded-lg text-rose-700"><Trash2 className="h-4 w-4" /></div>
              <h3 className="font-semibold text-rose-800">Danger Zone</h3>
            </div>

            <div className="ml-11 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Export Financial Data</p>
                  <p className="text-xs text-slate-600">Download a copy of all your transactions and wallets.</p>
                </div>
                <button onClick={downloadData} disabled={downloading} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 whitespace-nowrap">
                  {downloading ? 'Preparing...' : 'Download JSON'}
                </button>
              </div>

              <div className="w-full h-px bg-rose-200/50"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-rose-800">Delete Account</p>
                  <p className="text-xs text-rose-700/80">Permanently delete all your data from VFinance.</p>
                </div>
                <button onClick={deleteAccount} disabled={deleting} className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 whitespace-nowrap">
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
