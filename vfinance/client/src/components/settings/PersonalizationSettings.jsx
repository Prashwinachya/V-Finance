import { Sliders, SunMoon, Languages, LayoutGrid } from 'lucide-react';

const PersonalizationSettings = ({ settings, updateSetting }) => {

  const handleSelect = (key, value) => {
    updateSetting(key, value);
  };

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Personalization</h2>
        <p className="text-sm text-slate-500 mb-6">Customize the look and feel of your VFinance experience.</p>

        <div className="grid gap-6 md:grid-cols-2">

          {/* Theme */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-200 rounded-lg text-slate-700"><SunMoon className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Theme</h3>
            </div>

            <select
              className="input-soft w-full text-sm"
              value={settings?.theme || 'system'}
              onChange={(e) => handleSelect('theme', e.target.value)}
            >
              <option value="system">System Default</option>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>

          {/* Currency */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><span className="font-bold font-serif px-1 text-xs">₹</span></div>
              <h3 className="font-semibold text-slate-800">Primary Currency</h3>
            </div>

            <select
              className="input-soft w-full text-sm"
              value={settings?.currency || 'INR'}
              onChange={(e) => handleSelect('currency', e.target.value)}
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          </div>

          {/* Language & Date Format */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700"><Languages className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Region & Language</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Language</label>
                <select
                  className="input-soft w-full text-sm"
                  value={settings?.language || 'en'}
                  onChange={(e) => handleSelect('language', e.target.value)}
                >
                  <option value="en">English (US)</option>
                  <option value="en-in">English (India)</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date Format</label>
                <select
                  className="input-soft w-full text-sm"
                  value={settings?.date_format || 'DD MMM YYYY'}
                  onChange={(e) => handleSelect('date_format', e.target.value)}
                >
                  <option value="DD MMM YYYY">28 Aug 2026</option>
                  <option value="MM/DD/YYYY">08/28/2026</option>
                  <option value="YYYY-MM-DD">2026-08-28</option>
                </select>
              </div>
            </div>
          </div>

          {/* Layout & Density */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-100 rounded-lg text-pink-700"><LayoutGrid className="h-4 w-4" /></div>
              <h3 className="font-semibold text-slate-800">Display Density</h3>
            </div>

            <select
              className="input-soft w-full text-sm"
              value={settings?.layout_density || 'comfortable'}
              onChange={(e) => handleSelect('layout_density', e.target.value)}
            >
              <option value="comfortable">Comfortable (More spacing)</option>
              <option value="compact">Compact (Fit more content)</option>
            </select>
            <p className="text-xs text-slate-500 mt-3">Changes how tightly packed information appears on the dashboard and lists.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PersonalizationSettings;

