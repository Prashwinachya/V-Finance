import { useMemo, useState } from 'react';
import { ShieldCheck, User, KeyRound, Fingerprint, Save } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { user, refreshMe } = useAuth();

  const apiOrigin = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
    return String(base).replace(/\/api\/?$/, '');
  }, []);

  const avatarSrc = useMemo(() => {
    if (!user?.avatarUrl) return '';
    if (user.avatarUrl.startsWith('http')) return user.avatarUrl;
    return `${apiOrigin}${user.avatarUrl}`;
  }, [apiOrigin, user?.avatarUrl]);

  const [name, setName] = useState(user?.name || '');
  const [avatarFile, setAvatarFile] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [requirePin, setRequirePin] = useState(Boolean(user?.requirePaymentPin));
  const [requireFingerprint, setRequireFingerprint] = useState(Boolean(user?.requirePaymentFingerprint));

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const clearAlerts = () => {
    setMessage('');
    setError('');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (busy) return;
    clearAlerts();
    setBusy(true);
    try {
      await api.put('/user/profile', { name });

      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await api.post('/user/avatar', fd);
        setAvatarFile(null);
      }

      await refreshMe();
      setMessage('Profile updated');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update profile');
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (busy) return;
    clearAlerts();

    if (!newPassword || newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setBusy(true);
    try {
      await api.put('/user/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update password');
    } finally {
      setBusy(false);
    }
  };

  const savePin = async (event) => {
    event.preventDefault();
    if (busy) return;
    clearAlerts();

    setBusy(true);
    try {
      await api.put('/user/pin', { pin, confirmPin });
      setPin('');
      setConfirmPin('');
      await refreshMe();
      setRequirePin(true);
      setMessage('Payment PIN enabled');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to set PIN');
    } finally {
      setBusy(false);
    }
  };

  const enableFingerprint = async () => {
    if (busy) return;
    clearAlerts();

    setBusy(true);
    try {
      const optionsRes = await api.get('/security/webauthn/register-options');
      const attResp = await startRegistration(optionsRes.data);
      await api.post('/security/webauthn/register', attResp);
      await refreshMe();
      setRequireFingerprint(true);
      setMessage('Fingerprint enabled');
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Failed to enable fingerprint');
    } finally {
      setBusy(false);
    }
  };

  const saveSecurity = async (event) => {
    event.preventDefault();
    if (busy) return;
    clearAlerts();

    setBusy(true);
    try {
      await api.put('/user/security', {
        requirePaymentPin: requirePin,
        requirePaymentFingerprint: requireFingerprint,
      });
      await refreshMe();
      setMessage('Security settings saved');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to save security settings');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-pink-500/15 p-3 text-pink-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-pink-600">Settings</h1>
          <p className="mt-0.5 text-sm text-slate-500">Profile and security preferences</p>
        </div>
      </div>

      {(message || error) && (
        <div className={`card-soft ${error ? 'border border-rose-100 bg-rose-50/70' : 'border border-emerald-100 bg-emerald-50/70'}`}>
          <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>{error || message}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6 space-y-6">
          <form onSubmit={saveProfile} className="card-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">Profile</p>
                <p className="text-sm text-slate-500">Update your picture and username</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-r from-fuchsia-500 to-violet-500 text-lg font-bold text-white">
                    {(user?.name || 'U')[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile picture</p>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                />
                <p className="mt-1 text-xs text-slate-400">Max 3MB</p>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold text-slate-700">Username</label>
              <input className="input-soft mt-2" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <button type="submit" disabled={busy} className="btn-gradient mt-5 inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Profile
            </button>
          </form>

          <form onSubmit={changePassword} className="card-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">Password</p>
                <p className="text-sm text-slate-500">Change your account password</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <input
                className="input-soft"
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input
                className="input-soft"
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                className="input-soft"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={busy} className="btn-gradient mt-5">
              Update Password
            </button>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <form onSubmit={saveSecurity} className="card-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/15 text-violet-700">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">Security</p>
                <p className="text-sm text-slate-500">Fingerprint + PIN verification for payments</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Fingerprint</p>
                    <p className="text-xs text-slate-500">Use device fingerprint (WebAuthn)</p>
                  </div>

                  {user?.fingerprintEnabled ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Enabled</span>
                  ) : (
                    <button type="button" onClick={enableFingerprint} disabled={busy} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-500 disabled:opacity-60">
                      Enable
                    </button>
                  )}
                </div>

                <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={requireFingerprint}
                    onChange={(e) => setRequireFingerprint(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-200"
                    disabled={!user?.fingerprintEnabled}
                  />
                  Require fingerprint for payments
                </label>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Payment PIN</p>
                    <p className="text-xs text-slate-500">4–6 digit PIN for payments</p>
                  </div>

                  {user?.paymentPinEnabled ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Enabled</span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Not set</span>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input className="input-soft" inputMode="numeric" placeholder="New PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
                  <input className="input-soft" inputMode="numeric" placeholder="Confirm PIN" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={requirePin}
                      onChange={(e) => setRequirePin(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-200"
                      disabled={!user?.paymentPinEnabled}
                    />
                    Require PIN for payments
                  </label>

                  <button type="button" onClick={savePin} disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
                    Set / Change PIN
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-gradient mt-5 w-full">
              Save Security Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
