import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, User, KeyRound, Fingerprint, Save, Pencil } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { ensureBiometricSupport, formatBiometricError, getCurrentBiometricHost, needsBiometricReenrollment } from '../utils/paymentVerification';

const AVATAR_SERVER_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'image/avif',
]);

const readImageAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Unable to read image file'));
  reader.readAsDataURL(file);
});

const loadImageElement = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Unable to decode image'));
  image.src = source;
});

const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('Unable to process image'));
      return;
    }
    resolve(blob);
  }, type, quality);
});

const downscaleImageToUpload = async (file) => {
  if (file.type === 'image/svg+xml' && file.size <= AVATAR_SERVER_MAX_BYTES) {
    return file;
  }

  if (file.type === 'image/svg+xml' && file.size > AVATAR_SERVER_MAX_BYTES) {
    throw new Error('Large SVG files are not supported. Please use JPG/PNG/WebP or a smaller SVG.');
  }

  const source = await readImageAsDataUrl(file);
  const image = await loadImageElement(source);

  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to process image on this browser');
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = 0.9;
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality);

  while (blob.size > AVATAR_SERVER_MAX_BYTES && quality > 0.45) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }

  if (blob.size > AVATAR_SERVER_MAX_BYTES) {
    throw new Error('Image is still too large after optimization. Please choose a smaller image.');
  }

  const filenameBase = (file.name || 'avatar').replace(/\.[^.]+$/, '');
  return new File([blob], `${filenameBase}.jpg`, { type: 'image/jpeg' });
};

const getApiErrorMessage = (requestError, fallback) => {
  const responseData = requestError?.response?.data;
  if (responseData?.errors && typeof responseData.errors === 'object') {
    const firstGroup = Object.values(responseData.errors)[0];
    if (Array.isArray(firstGroup) && firstGroup[0]) {
      return firstGroup[0];
    }
  }

  return responseData?.message || requestError?.message || fallback;
};

const SettingsPage = () => {
  const { user, refreshMe } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [city, setCity] = useState(user?.city || '');
  const [avatarFile, setAvatarFile] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isResettingPin, setIsResettingPin] = useState(false);

  const [requireFingerprint, setRequireFingerprint] = useState(Boolean(user?.requirePaymentFingerprint));

  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [profileCompact, setProfileCompact] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const avatarInputRef = useRef(null);
  const currentBiometricHost = getCurrentBiometricHost();
  const biometricNeedsReenrollment = needsBiometricReenrollment(user);
  const fingerprintCount = Number(user?.fingerprintCount || (user?.hasBiometricCredential ? 1 : 0));
  const maxFingerprints = 3;
  const canAddFingerprint = fingerprintCount < maxFingerprints;

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setDateOfBirth(user?.dateOfBirth || '');
    setGender(user?.gender || '');
    setCity(user?.city || '');
    setRequireFingerprint(Boolean(user?.requirePaymentFingerprint || user?.fingerprintEnabled));
    if (!user?.paymentPinEnabled) {
      setIsResettingPin(true);
    }
  }, [
    user?.name,
    user?.phone,
    user?.dateOfBirth,
    user?.gender,
    user?.city,
    user?.paymentPinEnabled,
    user?.requirePaymentFingerprint,
  ]);

  const clearAlerts = () => {
    setMessage('');
    setError('');
  };

  const handleAvatarFileChange = async (event) => {
    clearAlerts();
    const file = event.target.files?.[0] || null;

    if (!file) {
      setAvatarFile(null);
      return;
    }

    if (!AVATAR_ALLOWED_TYPES.has(file.type)) {
      setAvatarFile(null);
      setError('Please upload a valid image (JPG, PNG, WEBP, GIF, SVG, HEIC, HEIF, or AVIF).');
      event.target.value = '';
      return;
    }

    if (file.size > AVATAR_MAX_ORIGINAL_BYTES) {
      setAvatarFile(null);
      setError('Image is too large. Please choose a file smaller than 20 MB.');
      event.target.value = '';
      return;
    }

    setAvatarBusy(true);
    try {
      const optimized = file.size > AVATAR_SERVER_MAX_BYTES
        ? await downscaleImageToUpload(file)
        : file;

      setAvatarFile(optimized);
      if (optimized !== file) {
        setMessage('Large image optimized successfully. Ready to upload.');
      }
    } catch (processError) {
      setAvatarFile(null);
      setError(processError.message || 'Unable to process selected image');
      event.target.value = '';
    } finally {
      setAvatarBusy(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (busy) return;
    clearAlerts();
    setBusy(true);
    try {
      await api.put('/user/profile', {
        name,
        phone,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        city,
      });

      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await api.post('/user/avatar', fd);
        setAvatarFile(null);
      }

      await refreshMe();
      setMessage('Profile updated');
      setProfileCompact(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to update profile'));
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
      await api.put('/user/password/forgot', { newPassword, confirmPassword });
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordReset(false);
      setMessage('Password updated');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to update password'));
    } finally {
      setBusy(false);
    }
  };

  const savePin = async (event) => {
    event.preventDefault();
    if (busy) return;
    clearAlerts();

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN and confirm PIN do not match');
      return;
    }

    setBusy(true);
    try {
      await api.put('/user/pin', { pin, confirmPin });
      setPin('');
      setConfirmPin('');
      await refreshMe();
      setIsResettingPin(false);
      setMessage('Payment PIN enabled for all protected money actions');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to set PIN'));
    } finally {
      setBusy(false);
    }
  };

  const resetPin = async () => {
    if (busy) return;
    clearAlerts();

    setBusy(true);
    try {
      await api.delete('/user/pin');
      setPin('');
      setConfirmPin('');
      setIsResettingPin(true);
      await refreshMe();
      setMessage('Payment PIN reset. Set a new PIN to enable it again.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to reset PIN'));
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
      setRequireFingerprint(true);
      setMessage('Fingerprint added for this device and host');
    } catch (requestError) {
      setError(formatBiometricError(requestError, 'Failed to add fingerprint'));
    } finally {
      setBusy(false);
    }
  };

  const resetFingerprints = async () => {
    if (busy) return;
    clearAlerts();

    const enteredPin = window.prompt('Enter your 4-digit payment PIN to reset all fingerprints:') || '';
    if (!/^\d{4}$/.test(enteredPin)) {
      setError('A valid 4-digit payment PIN is required to reset fingerprints.');
      return;
    }

    setBusy(true);
    try {
      await api.delete('/security/webauthn/reset', {
        data: { pin: enteredPin },
      });
      await refreshMe();
      setRequireFingerprint(false);
      setMessage('All fingerprints were reset successfully.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to reset fingerprints'));
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
        requirePaymentFingerprint: user?.fingerprintEnabled ? true : requireFingerprint,
      });
      await refreshMe();
      setMessage('Fingerprint protection saved');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to save security settings'));
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
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">Profile</p>
                  <p className="text-sm text-slate-500">Update your picture and username</p>
                </div>
              </div>

              {profileCompact ? (
                <button
                  type="button"
                  onClick={() => setProfileCompact(false)}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setProfileCompact(true)}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Collapse
                </button>
              )}
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                <UserAvatar user={user} size="h-16 w-16" textSize="text-lg" className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                {profileCompact ? (
                  <>
                    <p className="text-sm font-semibold text-slate-800">{name || user?.name || 'User'}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {city || 'No city set'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="relative inline-flex items-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile picture</p>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800"
                        aria-label="Edit profile picture"
                        title="Edit profile picture"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{avatarFile ? `Selected: ${avatarFile.name}` : 'Tap pencil icon to choose photo'} | Up to 20MB</p>
                    {avatarBusy && <p className="mt-1 text-xs font-semibold text-slate-500">Optimizing image...</p>}
                  </>
                )}
              </div>
            </div>

            {!profileCompact && (
              <>
                <div className="mt-5">
                  <label className="block text-xs font-semibold text-slate-700">Username</label>
                  <input className="input-soft mt-2 w-full" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700">Phone</span>
                    <input className="input-soft mt-2 w-full" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxxxxx" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700">Date of Birth</span>
                    <input className="input-soft mt-2 w-full" type="date" value={dateOfBirth || ''} onChange={(e) => setDateOfBirth(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700">Gender</span>
                    <select className="input-soft mt-2 w-full" value={gender || ''} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-binary</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700">City</span>
                    <input className="input-soft mt-2 w-full" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bengaluru" />
                  </label>
                </div>

                <button type="submit" disabled={busy || avatarBusy} className="btn-gradient mt-5 inline-flex items-center gap-2 disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  Save Profile
                </button>
              </>
            )}
          </form>

          <form onSubmit={changePassword} className="card-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">Password</p>
                <p className="text-sm text-slate-500">Use forgot password to set a new one</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Quick reset from inside settings.</p>
              <button type="button" onClick={() => setShowPasswordReset((prev) => !prev)} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500">
                Forgot password?
              </button>
            </div>

            {showPasswordReset && (
              <>
                <div className="mt-4 grid gap-3">
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

                <button type="submit" disabled={busy} className="btn-gradient mt-4">
                  Reset Password
                </button>
              </>
            )}
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
                    <p className="text-xs text-slate-500">Use device fingerprint (WebAuthn). Up to 3 fingerprints.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {user?.fingerprintEnabled && !biometricNeedsReenrollment ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Enabled ({fingerprintCount}/{maxFingerprints})</span>
                    ) : biometricNeedsReenrollment ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Add on this host needed</span>
                    ) : null}

                    <button type="button" onClick={enableFingerprint} disabled={busy || (!canAddFingerprint && !biometricNeedsReenrollment)} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-500 disabled:opacity-60">
                      Add Fingerprint
                    </button>

                    <button type="button" onClick={resetFingerprints} disabled={busy || fingerprintCount === 0} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-60">
                      Reset Fingerprints
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-xs font-semibold text-violet-700">
                  Fingerprint is required for every protected transaction once added.
                </p>

                {user?.biometricRpId && (
                  <p className="mt-2 text-xs text-slate-500">
                    Registered host: {user.biometricRpId} {currentBiometricHost ? `| Current host: ${currentBiometricHost}` : ''}
                  </p>
                )}

                {biometricNeedsReenrollment && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    Your current host differs from the saved host. Add a fingerprint on {currentBiometricHost || 'this host'} so transactions, payments, wallet actions, and bank sync can use it.
                  </p>
                )}

                {!canAddFingerprint && (
                  <p className="mt-2 text-xs font-semibold text-rose-700">
                    You already have {maxFingerprints} fingerprints. Reset fingerprints using your PIN to add new ones.
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Payment PIN</p>
                    <p className="text-xs text-slate-500">4-digit PIN for payments</p>
                  </div>

                  {user?.paymentPinEnabled ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Enabled</span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Not set</span>
                  )}
                </div>

                {(isResettingPin || !user?.paymentPinEnabled) ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input
                      className="input-soft"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="New PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                    <input
                      className="input-soft"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Confirm PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-500">PIN is set and hidden for security. Click reset to set a new PIN.</p>
                )}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-600">
                    PIN is mandatory for all protected money actions.
                  </p>

                  <div className="flex items-center gap-2">
                    {user?.paymentPinEnabled && !isResettingPin ? (
                      <button type="button" onClick={resetPin} disabled={busy} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-60">
                        Reset PIN
                      </button>
                    ) : (
                      <button type="button" onClick={savePin} disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
                        Set PIN
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-gradient mt-5 w-full">
              Save Fingerprint Protection
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
