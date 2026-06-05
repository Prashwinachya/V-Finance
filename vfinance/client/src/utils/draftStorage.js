const getUserKey = (user) => {
  if (!user) return 'anon';
  return String(user.id || user._id || user.email || 'anon');
};

const buildKey = (scope, user) => `vfinance:draft:${scope}:${getUserKey(user)}`;

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const loadDraft = (scope, user) => {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(buildKey(scope, user));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.data ?? null;
  } catch (_error) {
    return null;
  }
};

export const saveDraft = (scope, user, data) => {
  if (!canUseStorage()) return;

  const payload = {
    updatedAt: new Date().toISOString(),
    data,
  };

  window.localStorage.setItem(buildKey(scope, user), JSON.stringify(payload));
};

export const clearDraft = (scope, user) => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(buildKey(scope, user));
};
