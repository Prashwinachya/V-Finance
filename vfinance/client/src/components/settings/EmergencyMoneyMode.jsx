import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, Wallet, CreditCard, PauseCircle } from 'lucide-react';
import api from '../../api/client';
import { formatINR } from '../../utils/format';

const EmergencyMoneyMode = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmergencyData();
  }, []);

  const loadEmergencyData = async () => {
    try {
      const res = await api.get('/emergency-mode');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load emergency data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse text-slate-500">Activating Emergency Mode...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-amber-500 p-1 shadow-lg shadow-amber-500/20">
        <div className="rounded-[22px] bg-slate-900 text-white p-6 md:p-8">

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500 rounded-lg text-slate-900 animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-500 tracking-tight">EMERGENCY MONEY MODE</h2>
              <p className="text-sm text-slate-400">All optional spending recommendations are hidden.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Safe to spend */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Safe Liquid Balance</p>
              <p className="text-4xl font-black text-white">{formatINR(data?.safe_to_spend || 0)}</p>
              <p className="text-xs text-slate-500 mt-2">After reserving funds for essential upcoming payments.</p>
            </div>

            {/* Coverage */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Survival Runway</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-emerald-400">{data?.coverage_days || 0}</p>
                <p className="text-lg font-bold text-slate-500">Days</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">Estimated coverage for basic expenses with zero income.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-sm mb-4">Financial Triage</h3>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-700 rounded-lg text-slate-300"><Wallet className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-slate-200">Total Liquid Funds</p>
                  <p className="text-sm text-slate-400">Total available across all wallets</p>
                </div>
              </div>
              <p className="font-bold text-white">{formatINR(data?.liquid_balance || 0)}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-rose-900/20 rounded-xl border border-rose-900/50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-rose-900/50 rounded-lg text-rose-400"><CreditCard className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-slate-200">Essential Upcoming Payments</p>
                  <p className="text-sm text-slate-400">Loan EMIs and critical bills</p>
                </div>
              </div>
              <p className="font-bold text-rose-400">-{formatINR(data?.essential_payments || 0)}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-900/20 rounded-xl border border-amber-900/50">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-900/50 rounded-lg text-amber-400"><PauseCircle className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-slate-200">Pauseable Subscriptions</p>
                    <p className="text-sm text-slate-400">Cancel these to save cash</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-amber-400">{formatINR(data?.pauseable_subscriptions_amount || 0)}/mo</p>
                <button className="px-3 py-1.5 bg-amber-500 text-slate-900 text-xs font-bold rounded-lg hover:bg-amber-400">Review</button>
              </div>
            </div>

          </div>

          <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex gap-3">
            <Shield className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              While Emergency Mode is active, we temporarily require PIN authentication for ALL outbound transfers, regardless of amount, to prevent accidental spending.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmergencyMoneyMode;
