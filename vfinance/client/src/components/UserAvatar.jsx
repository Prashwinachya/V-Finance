import { useEffect, useMemo, useState } from 'react';
import { resolveApiAssetUrl } from '../api/config';

const UserAvatar = ({ user, src: directSrc, previewUrl, size = 'h-8 w-8', textSize = 'text-sm', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  const activeSrc = previewUrl || directSrc;

  useEffect(() => {
    setImageError(false);
  }, [user?.avatarUrl, activeSrc]);

  const src = useMemo(() => {
    if (activeSrc) return activeSrc;
    if (!user?.avatarUrl || imageError) return '';
    return resolveApiAssetUrl(user.avatarUrl);
  }, [activeSrc, user?.avatarUrl, imageError]);

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={user?.name ? `${user.name}'s Avatar` : 'Avatar'}
        onError={() => setImageError(true)}
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
