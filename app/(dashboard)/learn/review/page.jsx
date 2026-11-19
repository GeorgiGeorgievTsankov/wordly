'use client';

import { useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RotateCw, PlusCircle, BrainCircuit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TTSButton } from '@/components/learning/tts-button';
import { SessionHeader } from '@/components/learning/session-header';
import { SessionComplete } from '@/components/learning/session-complete';
import { startStudySessionAction, submitReviewAction, completeStudySessionAction } from '@/lib/actions/learning';
import { GRADES } from '@/lib/services/srs';

function SmartReviewContent() {
  const searchParams = useSearchParams();
  const wordSource = searchParams?.get('source') || 'all';
  const categoryId = searchParams?.get('category') || null;
  const sessionSize = parseInt(searchParams?.get('size') || '15', 10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

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
        mode: 'review',
        wordSource,
        categoryId,
        sessionSize,
      });

      if (!res.success) {
        setError(res.error || 'Failed to initialize smart review session');
      } else if (!res.words || res.words.length === 0) {
        setError('No words due for review right now! Keep studying new words or check back later.');
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

  const handleRate = useCallback((grade) => {
    if (!currentWord || isSubmitting) return;

    startTransition(async () => {
      const isSuccess = grade !== GRADES.AGAIN;
      const res = await submitReviewAction({
        sessionId,
        wordId: currentWord.id,
        isCustom: currentWord.isCustom,
        grade,
        reviewMode: 'review',
      });

      const earned = res?.xpEarned || 0;
      setSessionStats((prev) => ({
        ...prev,
        correct: prev.correct + (isSuccess ? 1 : 0),
        totalXp: prev.totalXp + earned,
      }));

      if (currentIndex + 1 < words.length) {
        setIsFlipped(false);
        setCurrentIndex((i) => i + 1);
      } else {
        const durationSec = Math.round((Date.now() - sessionStats.startTime) / 1000);
        await completeStudySessionAction({
          sessionId,
          totalQuestions: words.length,
          correctAnswers: sessionStats.correct + (isSuccess ? 1 : 0),
          durationSeconds: durationSec,
        });

        setSessionStats((prev) => ({
          ...prev,
          totalXp: prev.totalXp + 10,
          completed: true,
        }));
      }
    });
  }, [currentWord, isSubmitting, sessionId, currentIndex, words.length, sessionStats]);

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
        <p className="text-sm font-medium text-slate-500">Checking your spaced repetition queue...</p>
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-5">
        <Card className="p-8 space-y-5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">{error || 'All caught up on reviews!'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/learn/flashcards?source=core">
              <Button size="sm" className="w-full">
                <span>Study Core Verbs (Flashcards)</span>
              </Button>
            </Link>
            <Link href="/learn">
              <Button size="sm" variant="outline" className="w-full">
                <span>Back to Learn</span>
              </Button>
            </Link>
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
      ? '300 Core Verbs'
      : wordSource === 'personal'
      ? 'Personal Words'
      : 'All Words';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <SessionHeader
        currentIndex={currentIndex}
        totalWords={words.length}
        modeName="Smart SRS Review"
        sourceLabel={sourceBadge}
        totalXp={sessionStats.totalXp}
      />

      {/* Flip Card */}
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
        className="w-full min-h-[340px] cursor-pointer focus:outline-none select-none"
      >
        <Card className="p-8 min-h-[340px] flex flex-col justify-between border-slate-200/80 shadow-lg hover:shadow-xl transition-all">
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
                <p className="text-2xl font-extrabold text-indigo-600">
                  {currentWord.translation}
                </p>

                {currentWord.definition && (
                  <p className="text-sm text-slate-600 italic">
                    {currentWord.definition}
                  </p>
                )}

                {currentWord.example_sentence && (
                  <div className="bg-slate-50 p-3 rounded-xl text-left text-xs sm:text-sm text-slate-700 space-y-1">
                    <p className="font-medium text-slate-900">“{currentWord.example_sentence}”</p>
                    {currentWord.example_translation && (
                      <p className="text-slate-500">“{currentWord.example_translation}”</p>
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
            {isFlipped ? 'Rate your recall to update SRS interval' : 'Memory Retrieval Practice'}
          </div>
        </Card>
      </div>

      {/* SRS Rating Actions */}
      {isFlipped ? (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleRate(GRADES.AGAIN)}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 py-3 flex-col h-auto"
            >
              <span className="font-bold text-sm">Again</span>
              <span className="text-[10px] text-rose-500 font-normal">Key 1 (Reset)</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleRate(GRADES.HARD)}
              className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 py-3 flex-col h-auto"
            >
              <span className="font-bold text-sm">Hard</span>
              <span className="text-[10px] text-amber-500 font-normal">Key 2 (Slow)</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleRate(GRADES.GOOD)}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 py-3 flex-col h-auto"
            >
              <span className="font-bold text-sm">Good</span>
              <span className="text-[10px] text-emerald-500 font-normal">Key 3 (Normal)</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleRate(GRADES.EASY)}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 py-3 flex-col h-auto"
            >
              <span className="font-bold text-sm">Easy</span>
              <span className="text-[10px] text-indigo-500 font-normal">Key 4 (Fast)</span>
            </Button>
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

export default function SmartReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading smart review...</p>
        </div>
      }
    >
      <SmartReviewContent />
    </Suspense>
  );
}
