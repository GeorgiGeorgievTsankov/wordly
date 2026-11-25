'use client';

import { useState, useEffect, useCallback, useTransition, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight, PlusCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TTSButton } from '@/components/learning/tts-button';
import { SessionHeader } from '@/components/learning/session-header';
import { SessionComplete } from '@/components/learning/session-complete';
import { startStudySessionAction, submitReviewAction, completeStudySessionAction } from '@/lib/actions/learning';
import { isCorrectAnswer } from '@/lib/validation/vocabulary';
import { GRADES } from '@/lib/services/srs';
import { useAutoSound } from '@/lib/services/tts';

function TypingContent() {
  const searchParams = useSearchParams();
  const wordSource = searchParams?.get('source') || 'all';
  const categoryId = searchParams?.get('category') || null;
  const sessionSize = parseInt(searchParams?.get('size') || '10', 10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [inputVal, setInputVal] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const { autoSound, toggleAutoSound, speak } = useAutoSound();

  const inputRef = useRef(null);

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
    setInputVal('');
    setSubmitted(false);

    try {
      const res = await startStudySessionAction({
        mode: 'typing',
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

  useEffect(() => {
    if (!loading && !submitted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, currentIndex, submitted]);

  const currentWord = words[currentIndex];

  // Auto-pronounce word on display
  useEffect(() => {
    if (autoSound && currentWord?.headword && !sessionStats.completed && !loading) {
      const timer = setTimeout(() => {
        speak(currentWord.headword);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoSound, currentWord?.headword, sessionStats.completed, loading, speak]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!currentWord || submitted || isSubmitting || !inputVal.trim()) return;

    const correct = isCorrectAnswer(
      inputVal,
      currentWord.translation,
      currentWord.accepted_translations
    );

    setIsCorrect(correct);
    setSubmitted(true);

    const grade = correct ? GRADES.GOOD : GRADES.AGAIN;

    startTransition(async () => {
      const res = await submitReviewAction({
        sessionId,
        wordId: currentWord.id,
        isCustom: currentWord.isCustom,
        grade,
        reviewMode: 'typing',
      });

      const earned = res?.xpEarned || 0;
      setSessionStats((prev) => ({
        ...prev,
        correct: prev.correct + (correct ? 1 : 0),
        totalXp: prev.totalXp + earned,
      }));
    });
  };

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setInputVal('');
      setSubmitted(false);
      setIsCorrect(false);
      setCurrentIndex((i) => i + 1);
    } else {
      const durationSec = Math.round((Date.now() - sessionStats.startTime) / 1000);
      completeStudySessionAction({
        sessionId,
        totalQuestions: words.length,
        correctAnswers: sessionStats.correct,
        durationSeconds: durationSec,
      });

      setSessionStats((prev) => ({
        ...prev,
        totalXp: prev.totalXp + 10,
        completed: true,
      }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-500">Preparing active typing session...</p>
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-5">
        <Card className="p-8 space-y-5">
          <p className="text-sm font-medium text-slate-700">{error || 'No words found for typing practice.'}</p>
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
      ? 'Core (500 Words)'
      : wordSource === 'personal'
      ? 'Personal Words'
      : 'All Words';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <SessionHeader
        currentIndex={currentIndex}
        totalWords={words.length}
        modeName="Active Typing"
        sourceLabel={sourceBadge}
        totalXp={sessionStats.totalXp}
        autoSound={autoSound}
        onToggleSound={toggleAutoSound}
      />

      {/* Target Word Card */}
      <Card className="p-8 text-center space-y-3 border-slate-200/80 shadow-md">
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

        <div className="py-3">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Type the Bulgarian translation
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
            {currentWord.headword}
          </h2>
          {currentWord.phonetic_transcription && (
            <p className="text-sm text-slate-500 font-mono mt-1">
              /{currentWord.phonetic_transcription}/
            </p>
          )}
        </div>
      </Card>

      {/* Input Form */}
      <form onSubmit={submitted ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-4">
        <div>
          <input
            ref={inputRef}
            type="text"
            lang="bg"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            disabled={submitted}
            placeholder="Въведи превод на български..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className={`w-full px-5 py-4 text-lg rounded-2xl border-2 transition-all outline-none ${
              submitted
                ? isCorrect
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                  : 'border-rose-500 bg-rose-50 text-rose-950 font-bold'
                : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
            }`}
          />
        </div>

        {/* Feedback Section */}
        {submitted && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-emerald-700">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span className="font-bold text-rose-700">Not quite</span>
                </>
              )}
            </div>

            {!isCorrect && (
              <p className="text-sm text-slate-700">
                Correct answer: <span className="font-bold text-slate-900">{currentWord.translation}</span>
                {currentWord.accepted_translations?.length > 0 && (
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Also accepted: {currentWord.accepted_translations.join(', ')}
                  </span>
                )}
              </p>
            )}

            {currentWord.example_sentence && (
              <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-200/60">
                “{currentWord.example_sentence}”
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        {submitted ? (
          <Button type="button" onClick={handleNext} className="w-full py-3.5">
            <span>Continue (Enter)</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!inputVal.trim() || isSubmitting}
            className="w-full py-3.5"
          >
            <span>Check Answer</span>
          </Button>
        )}
      </form>
    </div>
  );
}

export default function TypingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading typing session...</p>
        </div>
      }
    >
      <TypingContent />
    </Suspense>
  );
}
