const rawApiUrl = String(import.meta.env.VITE_API_URL || '').trim();

const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    if (!rawApiUrl || rawApiUrl === '/api') return '/api';
    if (!rawApiUrl.includes('localhost') && !rawApiUrl.includes('127.0.0.1')) {
      return '/api';
    }
    return rawApiUrl.replace(/\/$/, '');
  }
  return (rawApiUrl || '/api').replace(/\/$/, '');
};

export const apiBaseUrl = getApiBaseUrl();

export const apiOrigin = apiBaseUrl.startsWith('http')
  ? apiBaseUrl.replace(/\/api\/?$/, '')
  : '';

export const resolveApiAssetUrl = (assetPath = '') => {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath)) return assetPath;

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  return apiOrigin ? `${apiOrigin}${normalizedPath}` : normalizedPath;
};