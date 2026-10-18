import { useState, useRef, useEffect } from 'react';
import { User, Save, Camera, Upload, Trash2, X, Loader2 } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../UserAvatar';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ProfileSettings = () => {
  const { user, refreshMe } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [city, setCity] = useState(user?.city || '');
  const [bio, setBio] = useState(user?.bio || '');

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const avatarInputRef = useRef(null);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setDateOfBirth(user?.dateOfBirth || '');
    setGender(user?.gender || '');
    setCity(user?.city || '');
    setBio(user?.bio || '');
  }, [user]);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Profile completion % calculation
  const fields = ['name', 'phone', 'dateOfBirth', 'gender', 'city', 'bio', 'avatar_url'];
  const completedFields = fields.filter(f => user?.[f] || (f === 'avatar_url' && (user?.avatarUrl || user?.avatar_url)));
  const completionPercent = Math.round((completedFields.length / fields.length) * 100);

  const validateFile = (file) => {
    if (!file) return 'Please select an image.';
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and WEBP images are supported.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Image size must be less than 2 MB.';
    }
    return null;
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    setAvatarError('');
    setAvatarSuccess('');

    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setAvatarError(validationError);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarFile(file);
  };

  const cancelAvatarSelection = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarError('');
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const uploadAvatarDirectly = async () => {
    if (!avatarFile || uploadingAvatar) return;

    const validationError = validateFile(avatarFile);
    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    setUploadingAvatar(true);
    setAvatarError('');
    setAvatarSuccess('');

    try {
      const fd = new FormData();
      fd.append('avatar', avatarFile);

      await api.post('/user/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await refreshMe();
      setAvatarSuccess('Profile picture updated successfully!');
      cancelAvatarSelection();
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data?.errors?.avatar?.[0] || 'Failed to upload profile picture.';
      setAvatarError(serverMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (uploadingAvatar) return;
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    setUploadingAvatar(true);
    setAvatarError('');
    setAvatarSuccess('');

    try {
      await api.delete('/user/avatar');
      await refreshMe();
      cancelAvatarSelection();
      setAvatarSuccess('Profile picture removed successfully.');
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Failed to remove profile picture.';
      setAvatarError(serverMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (busy || uploadingAvatar) return;
    setError('');
    setMessage('');
    setBusy(true);

    try {
      await api.put('/user/profile', {
        name,
        phone,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        city,
        bio,
      });

      if (avatarFile) {
        const validationError = validateFile(avatarFile);
        if (validationError) {
          setError(validationError);
          setBusy(false);
          return;
        }

        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await api.post('/user/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        cancelAvatarSelection();
      }

      await refreshMe();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setBusy(false);
    }
  };

  const hasExistingAvatar = Boolean(user?.avatarUrl || user?.avatar_url);

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Profile & Identity</h2>
        <p className="text-sm text-slate-500 mb-6">Manage your public information and personal details.</p>

        {/* Profile Completion Bar */}
        <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex justify-between text-sm mb-2 font-semibold">
            <span className="text-slate-700">Profile Completion</span>
            <span className={completionPercent === 100 ? 'text-emerald-600' : 'text-amber-600'}>
              {completionPercent}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${completionPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {(message || error) && (
          <div className={`mb-6 p-3 rounded-xl border text-sm font-semibold ${error ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
            {error || message}
          </div>
        )}

        {/* Avatar Section */}
        <div className="mb-8 p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md relative bg-slate-200">
                <UserAvatar
                  user={user}
                  previewUrl={avatarPreview}
                  size="h-24 w-24"
                  textSize="text-3xl"
                  className="h-full w-full"
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white backdrop-blur-[1px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploadingAvatar}
                onChange={handleAvatarFileChange}
              />

              <button
                type="button"
                aria-label="Choose profile picture"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md hover:bg-slate-800 transition disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
                {avatarPreview && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    Preview (Unsaved)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-2">{user?.email}</p>
              <p className="text-xs text-slate-400">Allowed formats: JPG, PNG, WEBP (Max 2 MB)</p>

              {avatarFile && (
                <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                    {avatarFile.name} ({(avatarFile.size / 1024).toFixed(0)} KB)
                  </span>

                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={uploadAvatarDirectly}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
                  >
                    {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                  </button>

                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={cancelAvatarSelection}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              )}

              {!avatarFile && (
                <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {hasExistingAvatar ? 'Change Photo' : 'Select Photo'}
                  </button>

                  {hasExistingAvatar && (
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 shadow-sm transition disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              )}

              {avatarError && (
                <p className="mt-2 text-xs font-semibold text-rose-600">{avatarError}</p>
              )}
              {avatarSuccess && (
                <p className="mt-2 text-xs font-semibold text-emerald-600">{avatarSuccess}</p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={saveProfile}>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input className="input-soft w-full" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <input className="input-soft w-full" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxxxxx" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date of Birth</label>
              <input className="input-soft w-full" type="date" value={dateOfBirth || ''} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender</label>
              <select className="input-soft w-full" value={gender || ''} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Location / City</label>
              <input className="input-soft w-full" value={city} onChange={(e) => setCity(e.target.value)} placeholder="E.g. Bengaluru" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bio</label>
              <textarea
                className="input-soft w-full resize-none h-24"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short description about yourself..."
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={busy || uploadingAvatar} className="btn-gradient inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              {busy ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;

