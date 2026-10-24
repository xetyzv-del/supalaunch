import { useState } from 'react';
import { initials } from '../lib/format';

interface AvatarProps {
  name: string;
  src?: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
};

export function Avatar({ name, src, photoUrl, size = 'md' }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const label = initials(name);
  const imageSource = src || photoUrl;

  if (imageSource && !imgFailed) {
    return (
      <img
        src={imageSource}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${SIZE_CLASSES[size]} rounded-full object-cover border border-slate-200 shrink-0`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZE_CLASSES[size]} rounded-full bg-amber-100 border border-amber-300/80 text-amber-900 font-bold inline-flex items-center justify-center shrink-0 select-none`}
    >
      {label}
    </span>
  );
}
