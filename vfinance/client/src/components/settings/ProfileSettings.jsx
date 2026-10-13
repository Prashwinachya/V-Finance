import { useState, useRef, useEffect } from 'react';
import { User, Save, Pencil, Camera } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../UserAvatar';

const ProfileSettings = () => {
  const { user, refreshMe } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [city, setCity] = useState(user?.city || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);

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

  // Profile completion % calculation
  const fields = ['name', 'phone', 'dateOfBirth', 'gender', 'city', 'bio', 'avatar_url'];
  const completedFields = fields.filter(f => user?.[f] || (f === 'avatar_url' && user?.avatarUrl));
  const completionPercent = Math.round((completedFields.length / fields.length) * 100);

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file) setAvatarFile(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setMessage('');
    setBusy(true);

    try {
      await api.put('/user/profile', {
        name, phone, dateOfBirth: dateOfBirth || null, gender: gender || null, city, bio
      });

      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await api.post('/user/avatar', fd);
        setAvatarFile(null);
      }

      await refreshMe();
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setBusy(false);
    }
  };

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

        <form onSubmit={saveProfile}>
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md">
                <UserAvatar user={user} size="h-24 w-24" textSize="text-3xl" className="h-full w-full" />
              </div>
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
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md hover:bg-slate-800 transition"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
              <p className="text-sm text-slate-500">{user?.email}</p>
              {avatarFile && <p className="mt-1 text-xs font-semibold text-emerald-600">New image selected</p>}
            </div>
          </div>

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
            <button type="submit" disabled={busy} className="btn-gradient inline-flex items-center gap-2">
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
