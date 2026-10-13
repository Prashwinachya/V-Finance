import { useEffect, useState } from 'react';
import { List, ShieldAlert, LogIn, KeyRound, Lock, CreditCard } from 'lucide-react';
import api from '../../api/client';

const ActivityAuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data } = await api.get('/audit-logs');
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (action) => {
    switch (action) {
      case 'login': return <LogIn className="h-4 w-4" />;
      case 'passkey_registered': return <KeyRound className="h-4 w-4" />;
      case 'account_locked': return <Lock className="h-4 w-4 text-rose-600" />;
      case 'card_frozen': return <ShieldAlert className="h-4 w-4 text-rose-600" />;
      case 'transaction_declined': return <CreditCard className="h-4 w-4 text-amber-600" />;
      default: return <List className="h-4 w-4" />;
    }
  };

  const formatActionName = (action) => {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Activity & Audit Log</h2>
        <p className="text-sm text-slate-500 mb-6">Review recent security events and account activity.</p>

        {loading ? (
          <p className="text-sm text-slate-500 p-4 text-center animate-pulse">Loading logs...</p>
        ) : logs.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
            <List className="h-8 w-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6">
            {logs.map((log) => (
              <div key={log.id} className="relative">
                <div className="absolute -left-[35px] bg-white p-1 rounded-full border border-slate-200 text-slate-500">
                  {getLogIcon(log.action)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-slate-800">{formatActionName(log.action)}</p>
                    <span className={`text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(log.created_at).toLocaleString()}
                    {log.ip_address && ` • IP: ${log.ip_address}`}
                    {log.location && ` • ${log.location}`}
                  </p>
                  {log.user_agent && (
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-lg">{log.user_agent}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityAuditLog;
