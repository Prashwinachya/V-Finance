import { TrendingUp, Target, Bell } from 'lucide-react';

const InvestmentSettings = ({ settings, updateSetting }) => {
  const invest = settings?.investment_config || {};

  const handleToggle = (key) => {
    updateSetting('investment_config', {
      ...invest,
      [key]: !invest[key]
    });
  };

  const handleSelect = (key, value) => {
    updateSetting('investment_config', {
      ...invest,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Investment Settings</h2>
        <p className="text-sm text-slate-500 mb-6">Manage your risk profile, SIP preferences, and portfolio alerts.</p>

        <div className="space-y-6">

          {/* Risk Profile */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Target className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Risk Profile</h3>
            </div>

            <div className="ml-11">
              <select className="input-soft w-full max-w-xs text-sm" value={invest.risk_profile || 'moderate'} onChange={(e) => handleSelect('risk_profile', e.target.value)}>
                <option value="conservative">Conservative (Low Risk, Stable Returns)</option>
                <option value="moderate">Moderate (Balanced Risk/Reward)</option>
                <option value="aggressive">Aggressive (High Risk, High Growth)</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">This helps VFinance tailor investment recommendations to your comfort level.</p>
            </div>
          </div>

          {/* SIP Preferences */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">SIP & Automation</h3>
            </div>

            <div className="space-y-4 ml-11">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Auto-Invest Surplus Cash</p>
                  <p className="text-xs text-slate-500">Automatically move excess cash into liquid funds</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!invest.auto_invest} onChange={() => handleToggle('auto_invest')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Transaction Confirmations</p>
                  <p className="text-xs text-slate-500">Require PIN for every investment execution</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={invest.require_pin !== false} onChange={() => handleToggle('require_pin')} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Bell className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Portfolio Notifications</h3>
            </div>

            <div className="space-y-4 ml-11">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Significant Price Movements</p>
                  <p className="text-xs text-slate-500">Alert me when a holding moves &gt; 5% in a day</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!invest.price_alerts} onChange={() => handleToggle('price_alerts')} />
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

export default InvestmentSettings;
