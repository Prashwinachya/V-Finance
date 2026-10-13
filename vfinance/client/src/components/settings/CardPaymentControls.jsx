import { CreditCard, Globe, ShoppingBag, ShieldCheck } from 'lucide-react';

const CardPaymentControls = ({ settings, updateSetting }) => {
  const payment = settings?.payment_config || {};

  const handleToggle = (key) => {
    updateSetting('payment_config', {
      ...payment,
      [key]: !payment[key]
    });
  };

  const handleThreshold = (key, value) => {
    updateSetting('payment_config', {
      ...payment,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Card & Payment Controls</h2>
        <p className="text-sm text-slate-500 mb-6">Manage transaction limits and block specific payment types.</p>

        <div className="space-y-6">

          {/* Global Limits */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><CreditCard className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Transaction Limits</h3>
            </div>

            <div className="space-y-4 ml-11">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Enforce Daily Limit</p>
                  <p className="text-xs text-slate-500">Block transactions that exceed your daily allowance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!payment.daily_limit_enabled} onChange={() => handleToggle('daily_limit_enabled')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
              {payment.daily_limit_enabled && (
                <div className="pl-4 border-l-2 border-slate-200">
                  <label className="text-xs font-semibold text-slate-600 mb-1 flex">Daily Limit Amount (₹)</label>
                  <input type="number" className="input-soft py-1 px-2 text-sm w-32" value={payment.daily_limit_amount || 50000} onChange={(e) => handleThreshold('daily_limit_amount', e.target.value)} />
                </div>
              )}
            </div>
          </div>

          {/* Payment Channels */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Globe className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Payment Channels</h3>
            </div>

            <div className="space-y-4 ml-11">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">International Transactions</p>
                    <p className="text-xs text-slate-500">Allow payments outside India</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!payment.international_enabled} onChange={() => handleToggle('international_enabled')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Online/E-commerce</p>
                    <p className="text-xs text-slate-500">Allow payments on websites and apps</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={payment.online_enabled !== false} onChange={() => handleToggle('online_enabled')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Card Freeze */}
          <div className="border border-rose-100 rounded-2xl p-5 bg-rose-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><ShieldCheck className="h-4 w-4" /></div>
                <div>
                  <h3 className="font-semibold text-rose-800">Global Account Freeze</h3>
                  <p className="text-xs text-rose-700/80">Temporarily block all incoming and outgoing transactions.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={!!payment.global_freeze} onChange={() => handleToggle('global_freeze')} />
                <div className="w-9 h-5 bg-rose-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-rose-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CardPaymentControls;
