import { useState } from 'react';
import { resolveApiAssetUrl } from '../api/config';

const UserAvatar = ({ user, src: directSrc, previewUrl, size = 'h-8 w-8', textSize = 'text-sm', className = '' }) => {
  const [failedUrl, setFailedUrl] = useState(null);

  const rawSrc = previewUrl || directSrc || (user?.avatarUrl ? resolveApiAssetUrl(user.avatarUrl) : '');
  const hasError = failedUrl === rawSrc;
  const src = !hasError && rawSrc ? rawSrc : '';

  if (src) {
    return (
      <img
        key={src}
        src={src}
        alt={user?.name ? `${user.name}'s Avatar` : 'Avatar'}
        loading="lazy"
        decoding="async"
        onError={() => setFailedUrl(rawSrc)}
        className={`${size} rounded-full object-cover ${className}`.trim()}
      />
    );
  }

  return (
    <div
      className={`grid ${size} place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 font-bold text-white ${textSize} ${className}`.trim()}
      aria-label="Avatar fallback"
    >
      {(user?.name || 'U')[0]?.toUpperCase() || 'U'}
    </div>
  );
};

export default UserAvatar;
