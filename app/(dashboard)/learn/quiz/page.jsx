'use client';

import { useState, useEffect, useCallback, useTransition, useMemo, Suspense } from 'react';
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
import { shuffleArray } from '@/lib/services/session-generator';
import { GRADES } from '@/lib/services/srs';

const FALLBACK_DISTRACTORS = [
  'време', 'свят', 'живот', 'работа', 'къща', 'човек', 'ден', 'път',
  'приятел', 'начало', 'край', 'вода', 'място', 'книга', 'дума',
];

function QuizContent() {
  const searchParams = useSearchParams();
  const wordSource = searchParams?.get('source') || 'all';
  const categoryId = searchParams?.get('category') || null;
  const sessionSize = parseInt(searchParams?.get('size') || '10', 10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
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
    setSelectedAnswer(null);
    setHasAnswered(false);

    try {
      const res = await startStudySessionAction({
        mode: 'quiz',
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

  // Generate 4 randomized unique options for the current question
  const currentOptions = useMemo(() => {
    if (!currentWord || !words.length) return [];

    const correctAnswer = currentWord.translation;
    const optionSet = new Set([correctAnswer]);

    const otherTranslations = words
      .filter((w) => w.id !== currentWord.id && w.translation && w.translation !== correctAnswer)
      .map((w) => w.translation);

    const shuffledOthers = shuffleArray(otherTranslations);
    for (const distractor of shuffledOthers) {
      if (optionSet.size >= 4) break;
      optionSet.add(distractor);
    }

    if (optionSet.size < 4) {
      const shuffledFallbacks = shuffleArray(FALLBACK_DISTRACTORS);
      for (const item of shuffledFallbacks) {
        if (optionSet.size >= 4) break;
        optionSet.add(item);
      }
    }

    return shuffleArray(Array.from(optionSet));
  }, [currentWord, words]);

  const handleSelectOption = (option) => {
    if (hasAnswered || isSubmitting || !currentWord) return;

    setSelectedAnswer(option);
    setHasAnswered(true);

    const isCorrect = option === currentWord.translation;
    const grade = isCorrect ? GRADES.GOOD : GRADES.AGAIN;

    startTransition(async () => {
      const res = await submitReviewAction({
        sessionId,
        wordId: currentWord.id,
        isCustom: currentWord.isCustom,
        grade,
        reviewMode: 'quiz',
      });

      const earned = res?.xpEarned || 0;
      setSessionStats((prev) => ({
        ...prev,
        correct: prev.correct + (isCorrect ? 1 : 0),
        totalXp: prev.totalXp + earned,
      }));
    });
  };

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setSelectedAnswer(null);
      setHasAnswered(false);
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
        <p className="text-sm font-medium text-slate-500">Preparing multiple choice quiz...</p>
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-5">
        <Card className="p-8 space-y-5">
          <p className="text-sm font-medium text-slate-700">{error || 'No words found for quiz.'}</p>
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
        modeName="Multiple Choice"
        sourceLabel={sourceBadge}
        totalXp={sessionStats.totalXp}
      />

      {/* Question Card */}
      <Card className="p-8 text-center space-y-4 border-slate-200/80 shadow-md">
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

        <div className="py-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Select the correct translation
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

      {/* 4 Options */}
      <div className="grid grid-cols-1 gap-3">
        {currentOptions.map((option, idx) => {
          let btnStyle = 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800';

          if (hasAnswered) {
            if (option === currentWord.translation) {
              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
            } else if (option === selectedAnswer) {
              btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 line-through';
            } else {
              btnStyle = 'opacity-40 border-slate-200 text-slate-500';
            }
          }

          return (
            <button
              key={`${option}-${idx}`}
              type="button"
              disabled={hasAnswered}
              onClick={() => handleSelectOption(option)}
              className={`p-4 rounded-2xl border-2 text-left font-medium text-base sm:text-lg transition-all flex items-center justify-between ${btnStyle}`}
            >
              <span>{option}</span>
              {hasAnswered && option === currentWord.translation && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              {hasAnswered && option === selectedAnswer && option !== currentWord.translation && (
                <XCircle className="w-5 h-5 text-rose-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback / Next */}
      {hasAnswered && (
        <div className="pt-2 space-y-3 animate-in fade-in duration-200">
          {currentWord.definition && (
            <p className="text-xs text-center text-slate-500 italic">
              Definition: {currentWord.definition}
            </p>
          )}

          <Button onClick={handleNext} className="w-full py-3">
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading quiz...</p>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
