import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, ShieldAlert, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const FinancialAutopilot = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAutopilotData();
  }, []);

  const loadAutopilotData = async () => {
    try {
      const res = await api.get('/financial-autopilot');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load autopilot data', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-50';
    if (score >= 50) return 'bg-amber-50';
    return 'bg-rose-50';
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse text-slate-500">Analyzing your financial data...</div>;
  }

  const score = data?.score || 0;
  const recommendations = data?.recommendations || [];

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <div className="flex items-center gap-3 mb-1">
          <Activity className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Financial Safety Autopilot</h2>
        </div>
        <p className="text-sm text-slate-500 mb-8">AI-driven analysis of your spending, debt, and liquid reserves.</p>

        {/* Score Dashboard */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className={`md:col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center border border-slate-100 shadow-sm ${getScoreBg(score)}`}>
            <p className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Safety Score</p>
            <div className={`text-6xl font-black tracking-tighter ${getScoreColor(score)}`}>
              {score}
            </div>
            <p className="text-xs text-slate-500 mt-2">out of 100</p>
          </div>

          <div className="md:col-span-2 rounded-3xl border border-slate-100 p-6 flex flex-col justify-center">
            <h3 className="font-bold text-slate-800 mb-2">What does this mean?</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {score >= 80 ? 'Your financial safety is excellent. You have strong liquid reserves, low debt ratio, and healthy spending patterns.' :
                score >= 50 ? 'Your financial safety is moderate. You are doing okay, but there are clear areas for improvement in building reserves or reducing debt.' :
                  'Your financial safety is at risk. You may not have enough liquid cash to cover sudden emergencies or your debt utilization is too high.'}
            </p>
            <p className="text-xs text-slate-400 mt-4 italic">
              Last updated: {new Date(data?.last_updated).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <h3 className="font-bold text-slate-900 mb-4 text-lg">Actionable Recommendations</h3>
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="p-6 text-center bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <p className="font-semibold">No critical actions needed right now.</p>
              <p className="text-sm mt-1">Keep up the good financial habits!</p>
            </div>
          ) : (
            recommendations.map(rec => (
              <div key={rec.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition group">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${rec.risk_level === 'high' ? 'bg-rose-500' :
                    rec.risk_level === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                <div className="p-5 pl-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-800">{rec.title}</h4>
                        {rec.risk_level === 'high' && <ShieldAlert className="h-4 w-4 text-rose-500" />}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{rec.message}</p>

                      <div className="bg-slate-50 rounded-lg p-3 mt-3">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Impact: <span className="font-normal text-slate-600">{rec.impact}</span></p>
                        <p className="text-xs text-slate-500 italic">"Why am I seeing this?" — {rec.explanation}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Link to={rec.action_target} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition">
                        {rec.action_text}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialAutopilot;
