import React from 'react';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-500 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xl shadow-amber-500/10 border border-amber-400 animate-bounce">
      <WifiOff className="w-4 h-4 text-white shrink-0 animate-pulse" />
      <span>Mode Offline — Menggunakan data lokal cache.</span>
    </div>
  );
};
