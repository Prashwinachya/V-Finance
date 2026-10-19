import { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, Fingerprint, Smartphone, Laptop, Trash2, Lock, SmartphoneNfc, FileKey } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { startRegistration } from '@simplewebauthn/browser';
import { ensureBiometricSupport, formatBiometricError } from '../../utils/paymentVerification';
import { useNavigate } from 'react-router-dom';

const SecuritySettings = () => {
  const { user, refreshMe, logout } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isResettingPin, setIsResettingPin] = useState(false);

  const fingerprintCount = Number(user?.fingerprintCount || (user?.hasBiometricCredential ? 1 : 0));
  const maxFingerprints = 3;
  const canAddFingerprint = fingerprintCount < maxFingerprints;

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data } = await api.get('/settings/sessions');
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  };

  const clearAlerts = () => {
    setMessage('');
    setError('');
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (busy) return;
    clearAlerts();
    if (newPassword !== confirmPassword) return setError('Passwords do not match');

    setBusy(true);
    try {
      await api.put('/user/password/forgot', { newPassword, confirmPassword });
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully');
    } catch (_err) {
      setError('Failed to update password');
    } finally {
      setBusy(false);
    }
  };

  const enableFingerprint = async () => {
    if (busy) return;
    clearAlerts();
    setBusy(true);
    try {
      await ensureBiometricSupport();
      const optionsRes = await api.get('/security/webauthn/register-options');
      const attResp = await startRegistration({ optionsJSON: optionsRes.data });
      await api.post('/security/webauthn/register', attResp);
      await refreshMe();
      setMessage('Passkey/Fingerprint added for this device');
    } catch (err) {
      setError(formatBiometricError(err, 'Failed to add fingerprint'));
    } finally {
      setBusy(false);
    }
  };

  const savePin = async (e) => {
    e.preventDefault();
    if (busy) return;
    clearAlerts();
    if (!/^\d{4}$/.test(pin)) return setError('PIN must be 4 digits');
    if (pin !== confirmPin) return setError('PINs do not match');

    setBusy(true);
    try {
      await api.put('/user/pin', { pin, confirmPin });
      setPin('');
      setConfirmPin('');
      await refreshMe();
      setIsResettingPin(false);
      setMessage('Payment PIN set successfully');
    } catch (_err) {
      setError('Failed to set PIN');
    } finally {
      setBusy(false);
    }
  };

  const revokeSession = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this session?')) return;
    try {
      await api.delete(`/settings/sessions/${id}`);
      await loadSessions();
      setMessage('Session revoked');
    } catch (_err) {
      setError('Failed to revoke session');
    }
  };

  const lockAccount = async () => {
    if (!window.confirm('WARNING: This will log you out immediately and lock all other devices. Proceed?')) return;
    try {
      await api.post('/settings/lock-account');
      logout();
      navigate('/login');
    } catch (_err) {
      setError('Failed to lock account');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Advanced Security</h2>
        <p className="text-sm text-slate-500 mb-6">Manage passkeys, passwords, 2FA, and trusted devices.</p>

        {(message || error) && (
          <div className={`mb-6 p-3 rounded-xl border text-sm font-semibold ${error ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
            {error || message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">

            {/* Password */}
            <div className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><KeyRound className="h-4 w-4" /></div>
                <h3 className="font-semibold text-slate-800">Change Password</h3>
              </div>
              <form onSubmit={changePassword} className="space-y-3">
                <input className="input-soft w-full text-sm" type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                <input className="input-soft w-full text-sm" type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                <button type="submit" disabled={busy} className="btn-gradient w-full py-2 text-sm">Update Password</button>
              </form>
            </div>

            {/* PIN */}
            <div className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Lock className="h-4 w-4" /></div>
                  <h3 className="font-semibold text-slate-800">Transaction PIN</h3>
                </div>
                {user?.paymentPinEnabled && !isResettingPin && (
                  <button onClick={() => setIsResettingPin(true)} className="text-xs font-semibold text-blue-600 hover:underline">Reset</button>
                )}
              </div>

              {(isResettingPin || !user?.paymentPinEnabled) ? (
                <form onSubmit={savePin} className="space-y-3">
                  <input className="input-soft w-full text-sm" type="password" maxLength={4} placeholder="4-Digit PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} required />
                  <input className="input-soft w-full text-sm" type="password" maxLength={4} placeholder="Confirm PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} required />
                  <button type="submit" disabled={busy} className="btn-gradient w-full py-2 text-sm">Save PIN</button>
                </form>
              ) : (
                <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">Your 4-digit Transaction PIN is active and protecting your transfers.</p>
              )}
            </div>

            {/* Passkeys */}
            <div className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg text-violet-600"><Fingerprint className="h-4 w-4" /></div>
                  <h3 className="font-semibold text-slate-800">Passkeys / Biometrics</h3>
                </div>
                <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded-full">{fingerprintCount}/3 Active</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">Use Face ID, Touch ID, or Windows Hello for frictionless authentication.</p>
              <button
                onClick={enableFingerprint}
                disabled={busy || !canAddFingerprint}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                Register New Passkey
              </button>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* 2FA (Mock visual as requested to show capability) */}
            <div className="rounded-2xl border border-slate-100 p-5 opacity-70">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><SmartphoneNfc className="h-4 w-4" /></div>
                  <h3 className="font-semibold text-slate-800">Authenticator App (2FA)</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Coming Soon</span>
              </div>
              <p className="text-sm text-slate-500">Protect your account with time-based one-time passwords (TOTP).</p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-5 opacity-70">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FileKey className="h-4 w-4" /></div>
                  <h3 className="font-semibold text-slate-800">Backup Codes</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Coming Soon</span>
              </div>
              <p className="text-sm text-slate-500">Generate offline recovery codes in case you lose your 2FA device.</p>
            </div>

            {/* Active Sessions */}
            <div className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Active Devices</h3>
                {sessions.length > 1 && (
                  <button onClick={() => revokeSession('all_others')} className="text-xs font-semibold text-rose-600 hover:underline">Revoke All Others</button>
                )}
              </div>
              <div className="space-y-3">
                {sessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      {session.name.toLowerCase().includes('phone') ? <Smartphone className="h-5 w-5 text-slate-400" /> : <Laptop className="h-5 w-5 text-slate-400" />}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{session.name} {session.is_current && <span className="text-xs font-normal text-emerald-600 ml-1">(This Device)</span>}</p>
                        <p className="text-xs text-slate-500">Last active: {new Date(session.last_used_at || session.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <button onClick={() => revokeSession(session.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {sessions.length === 0 && <p className="text-sm text-slate-500 text-center py-2">No active sessions found.</p>}
              </div>
            </div>

            {/* Emergency Lock */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0"><ShieldAlert className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-bold text-rose-800">Emergency Account Lock</h3>
                  <p className="text-sm text-rose-700/80 mt-1 mb-3">If you suspect your account is compromised, lock it immediately. This logs out all devices and freezes all active cards.</p>
                  <button onClick={lockAccount} className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700">Lock Account Now</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
