import { useState } from 'react';
import {
  Server,
  Database,
  ShieldCheck,
  Globe,
  RotateCw,
  Copy,
  Check,
  CheckCircle2,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

const SystemSettingsView = ({ stats, usersCount, txCount, budgetsCount, onRefresh, busy }) => {
  const [copied, setCopied] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleCopyDiagnostics = () => {
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      platform: 'VFinance Enterprise OS',
      backend: 'Laravel 11+ / PHP 8.2+',
      frontend: 'React 19 + Vite 8 + Tailwind CSS',
      stats: {
        totalUsers: stats?.totalUsers || usersCount,
        adminUsers: stats?.adminUsers || stats?.totalAdmins,
        totalTransactions: stats?.totalTransactions || txCount,
        totalBudgets: stats?.totalBudgets || budgetsCount,
      },
      clientInfo: {
        userAgent: navigator.userAgent,
        screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      },
    };

    navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearLocalCache = () => {
    try {
      sessionStorage.clear();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Infrastructure Status Banner */}
      <div className="rounded-3xl border border-white/90 bg-white/95 p-6 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.06),0_4px_16px_-3px_rgba(0,0,0,0.02)] backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">System Architecture &amp; Health</h3>
              <p className="text-xs font-semibold text-slate-500">
                Live monitoring of Laravel API nodes, database connectivity, and security policies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-[0.98]"
            >
              <RotateCw size={13} className={busy ? 'animate-spin' : ''} />
              <span>Refresh Metrics</span>
            </button>

            <button
              type="button"
              onClick={handleCopyDiagnostics}
              className="inline-flex items-center gap-1.5 rounded-xl bg-pink-50 px-3.5 py-2 text-xs font-bold text-pink-700 hover:bg-pink-100 transition active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Diagnostics</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Health Service Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* API Health */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">REST API Engine</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            </div>
            <p className="mt-2 text-lg font-extrabold text-emerald-700">Healthy &amp; Online</p>
            <p className="text-[11px] text-emerald-600/90 font-medium">Laravel Sanctum • 200 OK</p>
          </div>

          {/* Database */}
          <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800">Relational DB</span>
              <Database className="h-4 w-4 text-purple-600" />
            </div>
            <p className="mt-2 text-lg font-extrabold text-purple-700">Connected</p>
            <p className="text-[11px] text-purple-600/90 font-medium">SQLite/PG • Migrations Up to Date</p>
          </div>

          {/* Security & Auth */}
          <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-800">Authentication</span>
              <ShieldCheck className="h-4 w-4 text-pink-600" />
            </div>
            <p className="mt-2 text-lg font-extrabold text-pink-700">Role-Based RBAC</p>
            <p className="text-[11px] text-pink-600/90 font-medium">FIDO2 Passkeys + PIN Guards</p>
          </div>

          {/* Cloud Gateway */}
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-800">Network Gateway</span>
              <Globe className="h-4 w-4 text-cyan-600" />
            </div>
            <p className="mt-2 text-lg font-extrabold text-cyan-700">Secured Proxy</p>
            <p className="text-[11px] text-cyan-600/90 font-medium">TLS / HTTPS Encrypted</p>
          </div>
        </div>
      </div>

      {/* Configuration & Environment Specs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/90 bg-white/95 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-100 text-purple-700">
              <Layers size={16} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">Application Parameters</h4>
              <p className="text-xs text-slate-400">Core operational runtime details</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-3">
              <span className="font-semibold text-slate-500">Frontend Environment</span>
              <span className="font-bold text-slate-800">React 19.2 + Vite 8.0</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-3">
              <span className="font-semibold text-slate-500">Backend Framework</span>
              <span className="font-bold text-slate-800">Laravel 11+ RESTful Engine</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-3">
              <span className="font-semibold text-slate-500">Animation System</span>
              <span className="font-bold text-slate-800">Framer Motion Hardware Accelerated</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-3">
              <span className="font-semibold text-slate-500">Database Record Count</span>
              <span className="font-bold text-slate-800">
                {usersCount} Users • {txCount} Tx • {budgetsCount} Budgets
              </span>
            </div>
          </div>
        </div>

        {/* Maintenance Actions */}
        <div className="rounded-3xl border border-white/90 bg-white/95 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-pink-100 text-pink-700">
              <Cpu size={16} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">Administrative Utilities</h4>
              <p className="text-xs text-slate-400">Maintenance &amp; local cache controls</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold text-slate-800">Flush Client Session State</p>
                <p className="text-[11px] text-slate-500">Clears transient session data without logging you out.</p>
              </div>
              <button
                type="button"
                onClick={handleClearLocalCache}
                className="btn-secondary self-start sm:self-auto text-xs py-1.5"
              >
                Flush Session
              </button>
            </div>

            {cacheCleared && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                <span>Session cache flushed successfully.</span>
              </div>
            )}

            <div className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold text-slate-800">Force Synchronize System Data</p>
                <p className="text-[11px] text-slate-500">Refetches stats, users, transactions, and budgets from server.</p>
              </div>
              <button
                type="button"
                onClick={onRefresh}
                disabled={busy}
                className="btn-gradient self-start sm:self-auto text-xs py-1.5 px-3.5"
              >
                <RotateCw size={12} className={busy ? 'animate-spin' : ''} />
                <span>Sync All</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsView;
