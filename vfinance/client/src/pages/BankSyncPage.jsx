import { useEffect, useState } from 'react';
import { Building2, Link2, RefreshCw, Shield, Star, Trash2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { clearDraft, loadDraft, saveDraft } from '../utils/draftStorage';
import { requestPaymentToken } from '../utils/paymentVerification';

const emptyForm = {
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  accessToken: '',
};

const BankSyncPage = () => {
  const { user } = useAuth();
  const draftScope = 'bank-connect-form-v1';
  const [form, setForm] = useState(emptyForm);
  const [connections, setConnections] = useState([]);
  const [selectedPrimaryIds, setSelectedPrimaryIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadConnections = async () => {
    try {
      const response = await api.get('/banks');
      const items = Array.isArray(response.data) ? response.data : [];
      setConnections(items);
      setSelectedPrimaryIds(items.filter((item) => item.isPrimary).map((item) => item.id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load bank connections');
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    if (!user) return;

    const draft = loadDraft(draftScope, user);
    if (!draft) return;

    const hasContent = Boolean(draft.bankName || draft.accountHolderName || draft.accountNumber || draft.ifscCode || draft.accessToken);
    if (!hasContent) return;

    setForm((prev) => ({ ...prev, ...draft }));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const hasContent = Boolean(form.bankName || form.accountHolderName || form.accountNumber || form.ifscCode || form.accessToken);
    if (!hasContent) {
      clearDraft(draftScope, user);
      return;
    }

    saveDraft(draftScope, user, form);
  }, [form, user]);

  const clearAlerts = () => {
    setMessage('');
    setError('');
  };

  const connectBank = async (event) => {
    event.preventDefault();
    if (busy) return;
    clearAlerts();

    setBusy(true);
    try {
      const pin = window.prompt('Enter your 4-digit payment PIN to connect this bank:');
      const paymentToken = await requestPaymentToken(pin || '');

      await api.post('/banks/connect', {
        ...form,
        verificationToken: paymentToken,
      }, {
        headers: { 'x-payment-token': paymentToken },
      });

      setForm(emptyForm);
      clearDraft(draftScope, user);
      setMessage('Bank linked securely. Start sync to import transactions.');
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Failed to connect bank');
    } finally {
      setBusy(false);
    }
  };

  const runDemoSync = async () => {
    if (busy) return;
    clearAlerts();

    setBusy(true);
    try {
      const response = await api.post('/banks/demo-sync');
      const inserted = response.data?.inserted ?? 0;
      const scanned = response.data?.scanned ?? 0;
      setMessage(`Demo sync complete: ${inserted} new transactions imported from ${scanned} demo feed entries.`);
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to run demo sync');
    } finally {
      setBusy(false);
    }
  };

  const syncConnection = async (id) => {
    if (busy) return;
    clearAlerts();

    setBusy(true);
    try {
      const pin = window.prompt('Enter your 4-digit payment PIN to sync transactions:');
      const paymentToken = await requestPaymentToken(pin || '');
      const response = await api.post(`/banks/${id}/sync`, {
        verificationToken: paymentToken,
      }, {
        headers: { 'x-payment-token': paymentToken },
      });

      const inserted = response.data?.inserted ?? 0;
      const scanned = response.data?.scanned ?? 0;
      setMessage(`Sync complete: ${inserted} new transactions imported from ${scanned} scanned entries.`);
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Failed to sync bank transactions');
    } finally {
      setBusy(false);
    }
  };

  const savePrimarySelection = async () => {
    if (busy) return;
    clearAlerts();

    setBusy(true);
    try {
      await api.put('/banks/primary-selection', {
        primaryBankIds: selectedPrimaryIds.map((id) => Number(id)),
      });
      setMessage(
        selectedPrimaryIds.length > 0
          ? `Primary bank selection saved for ${selectedPrimaryIds.length} account${selectedPrimaryIds.length === 1 ? '' : 's'}.`
          : 'Primary bank selection cleared. Bank-synced transactions will stay hidden until you select primary accounts again.'
      );
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update primary bank selection');
    } finally {
      setBusy(false);
    }
  };

  const syncSelectedPrimaryAccounts = async () => {
    if (busy) return;
    clearAlerts();

    if (selectedPrimaryIds.length === 0) {
      setError('Select at least one primary bank account before syncing.');
      return;
    }

    setBusy(true);
    try {
      const pin = window.prompt('Enter your 4-digit payment PIN to sync selected primary bank accounts:');
      const paymentToken = await requestPaymentToken(pin || '');

      await api.put('/banks/primary-selection', {
        primaryBankIds: selectedPrimaryIds.map((id) => Number(id)),
      });

      const response = await api.post('/banks/sync-primary', {
        verificationToken: paymentToken,
      }, {
        headers: { 'x-payment-token': paymentToken },
      });

      const inserted = response.data?.inserted ?? 0;
      const scanned = response.data?.scanned ?? 0;
      const syncedBanks = Array.isArray(response.data?.syncedBanks) ? response.data.syncedBanks.length : selectedPrimaryIds.length;
      setMessage(`Sync complete: ${syncedBanks} primary account${syncedBanks === 1 ? '' : 's'} processed, ${inserted} new transactions imported from ${scanned} scanned entries.`);
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Failed to sync selected primary bank accounts');
    } finally {
      setBusy(false);
    }
  };

  const removeConnection = async (id) => {
    if (busy) return;
    clearAlerts();

    setBusy(true);
    try {
      await api.delete(`/banks/${id}`);
      setMessage('Bank connection removed');
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to remove bank connection');
    } finally {
      setBusy(false);
    }
  };

  const setPrimary = async (id) => {
    if (busy) return;
    clearAlerts();

    setBusy(true);
    try {
      const response = await api.post(`/banks/${id}/primary`);
      setSelectedPrimaryIds((prev) => {
        if (response.data?.isPrimary) {
          return prev.includes(id) ? prev : [...prev, id];
        }

        return prev.filter((candidateId) => candidateId !== id);
      });
      setMessage(response.data?.message || 'Primary bank selection updated.');
      await loadConnections();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to set primary bank');
    } finally {
      setBusy(false);
    }
  };

  const togglePrimarySelection = (id) => {
    setSelectedPrimaryIds((prev) => (prev.includes(id)
      ? prev.filter((candidateId) => candidateId !== id)
      : [...prev, id]));
  };

  const selectAllAsPrimary = () => {
    setSelectedPrimaryIds(connections.map((connection) => connection.id));
  };

  const clearPrimarySelection = () => {
    setSelectedPrimaryIds([]);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-cyan-700 via-sky-700 to-blue-700 p-6 text-white shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Building2 className="h-3.5 w-3.5" />
              Secure Bank Sync
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Bank Connection</h1>
            <p className="mt-1 text-sm text-white/85">Link multiple accounts, choose any combination as primary, and sync combined transaction history from the selected accounts.</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-xs text-white/90">
            <div className="flex items-center gap-2 font-semibold">
              <Shield className="h-4 w-4" />
              Encrypted at Rest
            </div>
            <p className="mt-1 text-white/80">Sensitive bank fields are encrypted on the server and masked in UI. Connect up to 8 accounts per user.</p>
          </div>
        </div>
      </section>

      {(message || error) && (
        <div className={`card-soft ${error ? 'border border-rose-200 bg-rose-50' : 'border border-emerald-200 bg-emerald-50'}`}>
          <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>{error || message}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <form onSubmit={connectBank} className="card-soft space-y-4 lg:col-span-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-100 text-sky-700">
              <Link2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-semibold text-slate-800">Connect Account</p>
              <p className="text-sm text-slate-500">Add bank credentials securely for multi-account sync</p>
            </div>
          </div>

          <input className="input-soft w-full" placeholder="Bank name" value={form.bankName} onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))} required />
          <input className="input-soft w-full" placeholder="Account holder name" value={form.accountHolderName} onChange={(e) => setForm((prev) => ({ ...prev, accountHolderName: e.target.value }))} required />
          <input className="input-soft w-full" placeholder="Account number" value={form.accountNumber} onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))} required />
          <input className="input-soft w-full" placeholder="IFSC code (optional)" value={form.ifscCode} onChange={(e) => setForm((prev) => ({ ...prev, ifscCode: e.target.value }))} />
          <input className="input-soft w-full" placeholder="Bank API access token (optional)" value={form.accessToken} onChange={(e) => setForm((prev) => ({ ...prev, accessToken: e.target.value }))} />

          <button type="submit" disabled={busy} className="btn-gradient w-full disabled:opacity-60">
            {busy ? 'Connecting...' : 'Securely Connect Bank'}
          </button>

          <button
            type="button"
            onClick={runDemoSync}
            disabled={busy}
            className="w-full rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
          >
            {busy ? 'Running Demo Sync...' : 'Run Demo Sync Dataset'}
          </button>
        </form>

        <div className="space-y-4 lg:col-span-7">
          <div className="card-soft border border-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-slate-800">Primary Account Selection</p>
                <p className="text-sm text-slate-500">Choose one, multiple, or all bank accounts as primary. Only selected primary accounts are synced into the dashboard and transaction history.</p>
              </div>
              <div className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                {selectedPrimaryIds.length} selected primary account{selectedPrimaryIds.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" onClick={selectAllAsPrimary} disabled={busy || connections.length === 0} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60">
                Select All
              </button>
              <button type="button" onClick={clearPrimarySelection} disabled={busy || selectedPrimaryIds.length === 0} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60">
                Clear Selection
              </button>
              <button type="button" onClick={savePrimarySelection} disabled={busy || connections.length === 0} className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60">
                Save Primary Selection
              </button>
              <button type="button" onClick={syncSelectedPrimaryAccounts} disabled={busy || selectedPrimaryIds.length === 0} className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60">
                Sync Selected Primary Accounts
              </button>
            </div>
          </div>

          {connections.length === 0 ? (
            <div className="card-soft text-sm text-slate-500">No bank accounts connected yet.</div>
          ) : (
            connections.map((connection) => (
              <div key={connection.id} className="card-soft border border-slate-100">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_430px] md:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedPrimaryIds.includes(connection.id)}
                          onChange={() => togglePrimarySelection(connection.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-200"
                        />
                        Primary
                      </label>
                      <p className="text-base font-semibold text-slate-800">{connection.bankName}</p>
                      {connection.isPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <Star className="h-3 w-3" />
                          Synced in Dashboard
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{connection.accountHolderName}</p>
                    <p className="text-xs text-slate-400">{connection.maskedAccount}</p>
                    <p className="mt-1 text-xs text-slate-500">Last synced: {connection.lastSyncedAt ? new Date(connection.lastSyncedAt).toLocaleString() : 'Never'}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:w-[430px] md:justify-self-end">
                    <button
                      type="button"
                      onClick={() => setPrimary(connection.id)}
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
                    >
                      <Star className="h-3.5 w-3.5" />
                      {connection.isPrimary ? 'Remove Primary' : 'Add Primary'}
                    </button>
                    <button
                      type="button"
                      onClick={() => syncConnection(connection.id)}
                      disabled={busy || !connection.isPrimary}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {connection.isPrimary ? 'Sync This Primary' : 'Primary Only'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeConnection(connection.id)}
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
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

export default BankSyncPage;
