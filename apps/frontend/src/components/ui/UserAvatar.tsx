interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'W';
}

export function UserAvatar({ name, src, size = 'md', className = '' }: UserAvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-11 w-11 text-xs',
    lg: 'h-20 w-20 text-2xl',
  };
  const shared = `${sizes[size]} shrink-0 rounded-sm border-2 border-ink shadow-[2px_2px_0_#171717] dark:border-gray-300 ${className}`;
  return src ? (
    <img src={src} alt={`Foto ${name}`} className={`${shared} bg-white object-cover`} />
  ) : (
    <div aria-label={`Inisial ${name}`} className={`${shared} flex items-center justify-center bg-brand-500 font-mono font-black text-white`}>
      {initials(name)}
    </div>
  );
}
