'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Speaks an English text using the browser SpeechSynthesis API.
 */
export function speakText(text, lang = 'en-US', rate = 0.9) {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any currently playing audio
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate; // Slightly slower for crisp learner clarity
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('TTS speakText error:', err);
  }
}

/**
 * Cancels any in-flight browser speech.
 */
export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.warn('TTS cancel error:', err);
    }
  }
}

const STORAGE_KEY = 'wordly_auto_sound';

/**
 * Hook to manage auto-pronunciation preference and actions.
 * Defaults to TRUE (auto-sound on) as requested.
 */
export function useAutoSound() {
  const [autoSound, setAutoSound] = useState(true);

  // Load user preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setAutoSound(stored === 'true');
      }
    } catch {
      // Fallback to default true if localStorage is blocked
    }
  }, []);

  const toggleAutoSound = useCallback(() => {
    setAutoSound((prev) => {
      const next = !prev;
      if (!next) {
        stopSpeech();
      }
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const speak = useCallback((text) => {
    speakText(text);
  }, []);

  return {
    autoSound,
    toggleAutoSound,
    speak,
  };
}

