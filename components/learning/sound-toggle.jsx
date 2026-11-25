'use client';

import { Volume2, VolumeX } from 'lucide-react';

export function SoundToggle({ autoSound, onToggle, className = '' }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      title={autoSound ? 'Auto-pronounce: ON (Click to mute)' : 'Auto-pronounce: OFF (Click to unmute)'}
      aria-label={autoSound ? 'Mute auto-pronunciation' : 'Enable auto-pronunciation'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 select-none ${
        autoSound
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100 shadow-xs'
          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200/80'
      } ${className}`}
    >
      {autoSound ? (
        <>
          <Volume2 className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span className="hidden sm:inline">Sound ON</span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Muted</span>
        </>
      )}
    </button>
  );
}

