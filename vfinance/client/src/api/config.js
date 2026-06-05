const configuredApiBaseUrl = String(import.meta.env.VITE_API_URL || '/api').trim();

export const apiBaseUrl = (configuredApiBaseUrl || '/api').replace(/\/$/, '');

export const apiOrigin = apiBaseUrl.startsWith('http')
  ? apiBaseUrl.replace(/\/api\/?$/, '')
  : '';

export const resolveApiAssetUrl = (assetPath = '') => {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath)) return assetPath;

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  return apiOrigin ? `${apiOrigin}${normalizedPath}` : normalizedPath;
};