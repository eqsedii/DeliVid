export default function LogoSpinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="animate-logospin">
      <defs>
        <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6D5EF6" />
          <stop offset="55%" stopColor="#B15CF6" />
          <stop offset="100%" stopColor="#FF6E6E" />
        </linearGradient>
      </defs>
      <rect className="ls-bar ls-bar1" x="14" y="40" width="6" height="20" rx="3" fill="url(#spinGrad)" />
      <rect className="ls-bar ls-bar2" x="24" y="30" width="6" height="40" rx="3" fill="url(#spinGrad)" />
      <rect className="ls-bar ls-bar3" x="34" y="46" width="6" height="8" rx="3" fill="url(#spinGrad)" opacity="0.85" />
      <path className="ls-play" d="M50 26 L82 50 L50 74 Z" fill="url(#spinGrad)" />
    </svg>
  );
}
