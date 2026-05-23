import { useState } from 'react';

interface AvatarProps {
  photoUrl?: string;
  name?: string;
  imgClassName: string;
  initialsClassName: string;
}

const PALETTE = ['#b87c7c', '#7cb8b8', '#b8b87c', '#b87ca8', '#7ca8b8', '#a8b87c'];

function getInitials(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : '?';
}

function getColorFromName(name: string): string {
  if (!name) {
    return '#999';
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({ photoUrl, name, imgClassName, initialsClassName }: AvatarProps) {
  const [erroredUrl, setErroredUrl] = useState<string | null>(null);

  const displayName = name ?? '';
  const showPhoto = photoUrl !== undefined && erroredUrl !== photoUrl;

  if (showPhoto) {
    return (
      <img
        src={photoUrl}
        alt={displayName}
        className={imgClassName}
        onError={() => setErroredUrl(photoUrl)}
      />
    );
  }

  return (
    <div
      className={initialsClassName}
      style={{ backgroundColor: getColorFromName(displayName) }}
    >
      {displayName ? getInitials(displayName) : '?'}
    </div>
  );
}
