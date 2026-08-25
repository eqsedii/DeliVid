"use client";

import { useEffect, useState } from "react";

export default function Splash() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1000);
    const hideTimer = setTimeout(() => setVisible(false), 1400);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0f0f14] transition-opacity duration-400 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <svg width="120" height="120" viewBox="0 0 100 100" className="animate-splash">
        <defs>
          <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6D5EF6" />
            <stop offset="55%" stopColor="#B15CF6" />
            <stop offset="100%" stopColor="#FF6E6E" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" rx="26" fill="#14141c" />
        <rect x="0" y="0" width="100" height="100" rx="26" fill="none" stroke="url(#splashGrad)" strokeWidth="3" />
        <rect className="bar bar1" x="14" y="40" width="6" height="20" rx="3" fill="url(#splashGrad)" />
        <rect className="bar bar2" x="24" y="30" width="6" height="40" rx="3" fill="url(#splashGrad)" />
        <rect className="bar bar3" x="34" y="46" width="6" height="8" rx="3" fill="url(#splashGrad)" opacity="0.85" />
        <path className="play" d="M50 26 L82 50 L50 74 Z" fill="url(#splashGrad)" />
      </svg>
    </div>
  );
}
