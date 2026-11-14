'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';

export function TTSButton({ text, lang = 'en-US', className = '' }) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS error:', err);
      setSpeaking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title="Listen to pronunciation (browser synthesis)"
      aria-label={`Listen to ${text}`}
      className={`inline-flex items-center justify-center p-2 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        speaking ? 'text-indigo-600 bg-indigo-50 animate-pulse' : ''
      } ${className}`}
    >
      <Volume2 className="w-5 h-5" />
    </button>
  );
}
