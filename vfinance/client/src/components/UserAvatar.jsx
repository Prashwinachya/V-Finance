import { useMemo, useState } from 'react';
import { resolveApiAssetUrl } from '../api/config';

const UserAvatar = ({ user, size = 'h-8 w-8', textSize = 'text-sm', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  const src = useMemo(() => {
    if (!user?.avatarUrl || imageError) return '';
    return resolveApiAssetUrl(user.avatarUrl);
  }, [user?.avatarUrl, imageError]);

  if (src) {
    return (
      <img
        src={src}
        alt="Avatar"
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
      {(user?.name || 'U')[0]}
    </div>
  );
};

export default UserAvatar;
