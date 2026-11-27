'use client';

import { useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RotateCw, PlusCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TTSButton } from '@/components/learning/tts-button';
import { SessionHeader } from '@/components/learning/session-header';
import { SessionComplete } from '@/components/learning/session-complete';
import { startStudySessionAction, submitReviewAction, completeStudySessionAction } from '@/lib/actions/learning';
import { GRADES } from '@/lib/services/srs';
import { useAutoSound } from '@/lib/services/tts';

function FlashcardsContent() {
  const searchParams = useSearchParams();
  const wordSource = searchParams?.get('source') || 'all';
  const categoryId = searchParams?.get('category') || null;
  const sessionSize = parseInt(searchParams?.get('size') || '10', 10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const { autoSound, toggleAutoSound, speak } = useAutoSound();

  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    totalXp: 0,
    startTime: Date.now(),
    completed: false,
  });

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setIsFlipped(false);

    try {
      const res = await startStudySessionAction({
        mode: 'flashcards',
        wordSource,
        categoryId,
        sessionSize,
      });

      if (!res.success) {
        setError(res.error || 'Failed to initialize session');
      } else if (!res.words || res.words.length === 0) {
        setError(
          wordSource === 'core'
            ? 'No core vocabulary words found.'
            : wordSource === 'personal'
            ? 'You have not added any personal words yet.'
            : 'No vocabulary words available for study.'
        );
      } else {
        setSessionId(res.sessionId);
        setWords(res.words);
        setSessionStats({
          correct: 0,
          totalXp: 0,
          startTime: Date.now(),
          completed: false,
        });
      }
    } catch (err) {
      setError(err.message || 'Error loading session');
    } finally {
      setLoading(false);
    }
  }, [wordSource, categoryId, sessionSize]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const currentWord = words[currentIndex];

  // Auto-pronounce word on card display
  useEffect(() => {
    if (autoSound && currentWord?.headword && !sessionStats.completed && !loading) {
      const timer = setTimeout(() => {
        speak(currentWord.headword);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoSound, currentWord?.headword, sessionStats.completed, loading, speak]);

  const handleRate = useCallback((grade) => {
    if (!currentWord || isSubmitting) return;

    startTransition(async () => {
      const isSuccess = grade !== GRADES.AGAIN;
      const res = await submitReviewAction({
        sessionId,
        wordId: currentWord.id,
        isCustom: currentWord.isCustom,
        grade,
        reviewMode: 'flashcards',
      });

      const earned = res?.xpEarned || 0;
      setSessionStats((prev) => ({
        ...prev,
        correct: prev.correct + (isSuccess ? 1 : 0),
        totalXp: prev.totalXp + earned,
      }));

      // Advance to next word or complete
      if (currentIndex + 1 < words.length) {
        setIsFlipped(false);
        setCurrentIndex((i) => i + 1);
      } else {
        // Complete session
        const durationSec = Math.round((Date.now() - sessionStats.startTime) / 1000);
        await completeStudySessionAction({
          sessionId,
          totalQuestions: words.length,
          correctAnswers: sessionStats.correct + (isSuccess ? 1 : 0),
          durationSeconds: durationSec,
        });

        setSessionStats((prev) => ({
          ...prev,
          totalXp: prev.totalXp + 10, // session bonus
          completed: true,
        }));
      }
    });
  }, [currentWord, isSubmitting, sessionId, currentIndex, words.length, sessionStats]);

  // Keyboard shortcuts (Space to flip, 1/2/3/4 to rate)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading || sessionStats.completed || !currentWord) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped && !isSubmitting) {
        if (e.key === '1') handleRate(GRADES.AGAIN);
        else if (e.key === '2') handleRate(GRADES.HARD);
        else if (e.key === '3') handleRate(GRADES.GOOD);
        else if (e.key === '4') handleRate(GRADES.EASY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, sessionStats.completed, currentWord, isFlipped, isSubmitting, handleRate]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-500">Preparing your flashcard session...</p>
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-5">
        <Card className="p-8 space-y-5">
          <p className="text-sm font-medium text-slate-700">{error || 'No words found for study.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {wordSource === 'personal' ? (
              <Link href="/words/personal/new">
                <Button size="sm" className="w-full">
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  <span>Add Personal Word</span>
                </Button>
              </Link>
            ) : (
              <Link href="/learn">
                <Button size="sm" className="w-full">
                  <span>Back to Study Modes</span>
                </Button>
              </Link>
            )}
            <Button size="sm" variant="outline" onClick={loadSession}>
              <span>Try Again</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (sessionStats.completed) {
    return (
      <SessionComplete
        totalWords={words.length}
        correctCount={sessionStats.correct}
        xpEarned={sessionStats.totalXp}
        onRestart={loadSession}
      />
    );
  }

  const sourceBadge =
    wordSource === 'core'
      ? 'Core Words'
      : wordSource === 'personal'
      ? 'Personal Words'
      : 'All Words';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <SessionHeader
        currentIndex={currentIndex}
        totalWords={words.length}
        modeName="Flashcards"
        sourceLabel={sourceBadge}
        totalXp={sessionStats.totalXp}
        autoSound={autoSound}
        onToggleSound={toggleAutoSound}
      />

      {/* 3D Flip Card Container */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsFlipped((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsFlipped((prev) => !prev);
          }
        }}
        className="w-full min-h-[340px] cursor-pointer focus:outline-none perspective-1000 select-none"
      >
        <Card className="p-8 min-h-[340px] flex flex-col justify-between border-slate-200/80 shadow-lg hover:shadow-xl transition-all">
          {/* Top metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="brand">{currentWord.part_of_speech}</Badge>
              {currentWord.isCustom ? (
                <Badge variant="secondary">Personal Word</Badge>
              ) : (
                <Badge variant="outline">Core Dictionary</Badge>
              )}
            </div>
            <TTSButton text={currentWord.headword} />
          </div>

          {/* Card Body */}
          <div className="text-center my-auto py-6 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {currentWord.headword}
            </h2>

            {currentWord.phonetic_transcription && (
              <p className="text-base text-slate-500 font-mono">
                /{currentWord.phonetic_transcription}/
              </p>
            )}

            {isFlipped ? (
              <div className="pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                <p className="text-3xl sm:text-4xl font-black text-indigo-600 tracking-tight">
                  {currentWord.translation}
                </p>

                {currentWord.definition && (
                  <p className="text-sm text-slate-600 italic">
                    {currentWord.definition}
                  </p>
                )}

                {currentWord.example_sentence && (
                  <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-left text-xs sm:text-sm text-slate-700 space-y-1">
                    <p className="font-semibold text-slate-900">“{currentWord.example_sentence}”</p>
                    {currentWord.example_translation && (
                      <p className="text-slate-600 font-medium">“{currentWord.example_translation}”</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium pt-8 flex items-center justify-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Tap or press Space to reveal answer</span>
              </p>
            )}
          </div>

          <div className="text-center text-xs text-slate-400">
            {isFlipped ? 'How easily did you remember?' : 'Active Recall (SM-2)'}
          </div>
        </Card>
      </div>

      {/* SRS Rating Actions (Visible when flipped) */}
      {isFlipped ? (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRate(GRADES.AGAIN)}
              className="py-3 px-2 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-extrabold shadow-md shadow-rose-500/25 border-b-4 border-rose-700 transition-all flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <span className="text-sm sm:text-base tracking-wide">Again</span>
              <span className="text-[10px] text-rose-100 font-semibold mt-0.5">Key 1 (Reset)</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRate(GRADES.HARD)}
              className="py-3 px-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold shadow-md shadow-amber-500/25 border-b-4 border-amber-700 transition-all flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <span className="text-sm sm:text-base tracking-wide">Hard</span>
              <span className="text-[10px] text-amber-100 font-semibold mt-0.5">Key 2 (Slow)</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRate(GRADES.GOOD)}
              className="py-3 px-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold shadow-md shadow-emerald-500/25 border-b-4 border-emerald-700 transition-all flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <span className="text-sm sm:text-base tracking-wide">Good</span>
              <span className="text-[10px] text-emerald-100 font-semibold mt-0.5">Key 3 (Normal)</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRate(GRADES.EASY)}
              className="py-3 px-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold shadow-md shadow-indigo-600/25 border-b-4 border-indigo-800 transition-all flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <span className="text-sm sm:text-base tracking-wide">Easy</span>
              <span className="text-[10px] text-indigo-100 font-semibold mt-0.5">Key 4 (Fast)</span>
            </button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsFlipped(true)}
          className="w-full py-3"
        >
          <span>Reveal Meaning</span>
        </Button>
      )}
    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading flashcards...</p>
        </div>
      }
    >
      <FlashcardsContent />
    </Suspense>
  );
}
