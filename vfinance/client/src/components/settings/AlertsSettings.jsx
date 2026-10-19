import { Bell, AlertTriangle, TrendingUp, CreditCard, ShieldAlert } from 'lucide-react';

const AlertsSettings = ({ settings, updateSetting }) => {
  const alerts = settings?.alerts_config || {};

  const handleToggle = (key) => {
    updateSetting('alerts_config', {
      ...alerts,
      [key]: !alerts[key]
    });
  };

  const handleThreshold = (key, value) => {
    updateSetting('alerts_config', {
      ...alerts,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Financial Alerts</h2>
        <p className="text-sm text-slate-500 mb-6">Configure thresholds for automated financial notifications.</p>

        <div className="space-y-6">

          {/* Transactions */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><CreditCard className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Transaction Alerts</h3>
            </div>

            <div className="space-y-4 ml-11">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Large Transactions</p>
                  <p className="text-xs text-slate-500">Notify when a single transaction exceeds limit</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!alerts.large_tx_enabled} onChange={() => handleToggle('large_tx_enabled')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
              {alerts.large_tx_enabled && (
                <div className="pl-4 border-l-2 border-slate-200">
                  <label className="text-xs font-semibold text-slate-600 mb-1 flex">Threshold Amount (₹)</label>
                  <input type="number" className="input-soft py-1 px-2 text-sm w-32" value={alerts.large_tx_threshold || 10000} onChange={(e) => handleThreshold('large_tx_threshold', e.target.value)} />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Unusual Spending Patterns</p>
                  <p className="text-xs text-slate-500">AI detects deviation from normal spending</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!alerts.unusual_spending} onChange={() => handleToggle('unusual_spending')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Balances */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><AlertTriangle className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Balance & Debt</h3>
            </div>

            <div className="space-y-4 ml-11">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Low Balance Warning</p>
                  <p className="text-xs text-slate-500">When total liquid balance drops below limit</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!alerts.low_balance_enabled} onChange={() => handleToggle('low_balance_enabled')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
              {alerts.low_balance_enabled && (
                <div className="pl-4 border-l-2 border-slate-200">
                  <label className="text-xs font-semibold text-slate-600 mb-1 flex">Minimum Balance (₹)</label>
                  <input type="number" className="input-soft py-1 px-2 text-sm w-32" value={alerts.low_balance_threshold || 5000} onChange={(e) => handleThreshold('low_balance_threshold', e.target.value)} />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700">High Credit Utilization</p>
                  <p className="text-xs text-slate-500">When debt ratio exceeds healthy levels</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!alerts.credit_utilization} onChange={() => handleToggle('credit_utilization')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><ShieldAlert className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Security Alerts</h3>
            </div>

            <div className="space-y-4 ml-11">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">New Login / Device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={alerts.new_login !== false} onChange={() => handleToggle('new_login')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Failed Payments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={alerts.failed_payments !== false} onChange={() => handleToggle('failed_payments')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AlertsSettings;
