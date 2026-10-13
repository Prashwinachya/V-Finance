import { useState, useEffect } from 'react';
import {
  ShieldCheck, User, KeyRound, Bell, Eye, CreditCard,
  TrendingUp, Sliders, Activity, AlertTriangle, List, Search
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

import ProfileSettings from '../components/settings/ProfileSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import AlertsSettings from '../components/settings/AlertsSettings';
import PrivacySettings from '../components/settings/PrivacySettings';
import CardPaymentControls from '../components/settings/CardPaymentControls';
import InvestmentSettings from '../components/settings/InvestmentSettings';
import PersonalizationSettings from '../components/settings/PersonalizationSettings';
import FinancialAutopilot from '../components/settings/FinancialAutopilot';
import EmergencyMoneyMode from '../components/settings/EmergencyMoneyMode';
import ActivityAuditLog from '../components/settings/ActivityAuditLog';

const NAV_ITEMS = [
  { id: 'profile', label: 'Profile & Identity', icon: User },
  { id: 'security', label: 'Advanced Security', icon: KeyRound },
  { id: 'autopilot', label: 'Safety Autopilot', icon: Activity, badge: 'NEW' },
  { id: 'emergency', label: 'Emergency Mode', icon: AlertTriangle, color: 'text-amber-500' },
  { id: 'alerts', label: 'Financial Alerts', icon: Bell },
  { id: 'privacy', label: 'Privacy & Data', icon: Eye },
  { id: 'payment', label: 'Card & Payments', icon: CreditCard },
  { id: 'investments', label: 'Investment Settings', icon: TrendingUp },
  { id: 'personalization', label: 'Personalization', icon: Sliders },
  { id: 'audit', label: 'Activity & Audit Log', icon: List },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      await api.put('/settings', updated);
    } catch (err) {
      console.error('Failed to update setting', err);
    }
  };

  const filteredNav = NAV_ITEMS.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-pink-500/15 p-3 text-pink-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financial Control Center</h1>
            <p className="mt-0.5 text-sm text-slate-500">Manage your entire financial identity, security, and preferences.</p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search settings..."
            className="input-soft pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="card-soft p-2 space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${item.color || ''} ${isActive ? 'text-white' : ''}`} />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-pink-100 text-pink-700'
                      }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredNav.length === 0 && (
              <p className="text-sm text-slate-500 p-4 text-center">No matching settings found.</p>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="motion-safe:animate-fade-in">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'autopilot' && <FinancialAutopilot />}
            {activeTab === 'emergency' && <EmergencyMoneyMode />}
            {activeTab === 'alerts' && <AlertsSettings settings={settings} updateSetting={updateSetting} />}
            {activeTab === 'privacy' && <PrivacySettings settings={settings} updateSetting={updateSetting} />}
            {activeTab === 'payment' && <CardPaymentControls settings={settings} updateSetting={updateSetting} />}
            {activeTab === 'investments' && <InvestmentSettings settings={settings} updateSetting={updateSetting} />}
            {activeTab === 'personalization' && <PersonalizationSettings settings={settings} updateSetting={updateSetting} />}
            {activeTab === 'audit' && <ActivityAuditLog />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
