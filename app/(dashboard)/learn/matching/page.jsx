'use client';

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Timer, CheckCircle2, RotateCcw, PlusCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SessionComplete } from '@/components/learning/session-complete';
import { startStudySessionAction, submitReviewAction, completeStudySessionAction } from '@/lib/actions/learning';
import { shuffleArray } from '@/lib/services/session-generator';
import { GRADES } from '@/lib/services/srs';

export default function MatchingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [words, setWords] = useState([]);

  // Tiles state
  const [tiles, setTiles] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [wrongPair, setWrongPair] = useState(null);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedTile(null);
    setMatchedIds(new Set());
    setWrongPair(null);
    setElapsedSec(0);
    setMistakes(0);
    setTotalXp(0);
    setIsCompleted(false);

    try {
      const res = await startStudySessionAction({ mode: 'matching', sessionSize: 6 });
      if (!res.success) {
        setError(res.error || 'Failed to initialize session');
      } else if (!res.words || res.words.length < 2) {
        setError('At least 2 vocabulary words are required for speed matching. Add personal words to continue!');
      } else {
        const sessionWords = res.words.slice(0, 8); // max 8 pairs
        setSessionId(res.sessionId);
        setWords(sessionWords);

        // Generate tiles
        const enTiles = sessionWords.map((w) => ({
          id: `en-${w.id}`,
          wordId: w.id,
          type: 'en',
          text: w.headword,
          isCustom: w.isCustom,
        }));

        const bgTiles = sessionWords.map((w) => ({
          id: `bg-${w.id}`,
          wordId: w.id,
          type: 'bg',
          text: w.translation,
          isCustom: w.isCustom,
        }));

        setTiles(shuffleArray([...enTiles, ...bgTiles]));
      }
    } catch (err) {
      setError(err.message || 'Error loading session');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Timer interval
  useEffect(() => {
    if (loading || isCompleted || tiles.length === 0) return;
    const interval = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, isCompleted, tiles.length]);

  const handleTileClick = (tile) => {
    if (matchedIds.has(tile.wordId) || wrongPair || isSubmitting) return;

    if (!selectedTile) {
      setSelectedTile(tile);
      return;
    }

    // Tapping the same tile deselects it
    if (selectedTile.id === tile.id) {
      setSelectedTile(null);
      return;
    }

    // Both must be opposite types (one English, one Bulgarian)
    if (selectedTile.type === tile.type) {
      setSelectedTile(tile);
      return;
    }

    // Check match
    if (selectedTile.wordId === tile.wordId) {
      // MATCH!
      const newMatched = new Set(matchedIds);
      newMatched.add(tile.wordId);
      setMatchedIds(newMatched);
      setSelectedTile(null);

      startTransition(async () => {
        const res = await submitReviewAction({
          sessionId,
          wordId: tile.wordId,
          isCustom: tile.isCustom,
          grade: GRADES.GOOD,
          reviewMode: 'matching',
        });

        const earned = res?.xpEarned || 5;
        setTotalXp((xp) => xp + earned);

        // Check if all matched
        if (newMatched.size === words.length) {
          await completeStudySessionAction({
            sessionId,
            totalQuestions: words.length,
            correctAnswers: words.length,
            durationSeconds: elapsedSec,
          });

          setTotalXp((xp) => xp + 10);
          setIsCompleted(true);
        }
      });
    } else {
      // MISMATCH
      setMistakes((m) => m + 1);
      setWrongPair([selectedTile.id, tile.id]);

      // Shake effect then clear
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTile(null);
      }, 700);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-500">Preparing speed matching grid...</p>
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-5">
        <Card className="p-8 space-y-5">
          <p className="text-sm font-medium text-slate-700">{error || 'Not enough words for matching.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/words/personal/new">
              <Button size="sm" className="w-full">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                <span>Add Personal Word</span>
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={loadSession}>
              <span>Try Again</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <SessionComplete
        totalWords={words.length}
        correctCount={words.length}
        xpEarned={totalXp}
        onRestart={loadSession}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Session Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/learn"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Exit
        </Link>

        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <Timer className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span>{formatTime(elapsedSec)}</span>
          </div>

          {totalXp > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-400" />
              +{totalXp} XP
            </span>
          )}
        </div>

        <span className="text-sm font-semibold text-slate-700">
          Matched: {matchedIds.size} / {words.length}
        </span>
      </div>

      {/* Grid of Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tiles.map((tile) => {
          const isMatched = matchedIds.has(tile.wordId);
          const isSelected = selectedTile?.id === tile.id;
          const isWrong = wrongPair?.includes(tile.id);

          let tileClass = 'border-slate-200 hover:border-indigo-400 hover:shadow-md bg-white text-slate-800';

          if (isMatched) {
            tileClass = 'border-emerald-200 bg-emerald-50/60 text-emerald-600 opacity-40 pointer-events-none scale-95';
          } else if (isWrong) {
            tileClass = 'border-rose-400 bg-rose-50 text-rose-800 animate-shake';
          } else if (isSelected) {
            tileClass = 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-md ring-2 ring-indigo-500';
          }

          return (
            <button
              key={tile.id}
              type="button"
              disabled={isMatched}
              onClick={() => handleTileClick(tile)}
              className={`p-4 min-h-[90px] rounded-2xl border-2 flex items-center justify-center text-center text-sm sm:text-base font-semibold transition-all duration-150 select-none ${tileClass}`}
            >
              <span>{tile.text}</span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 font-medium">
        Tap an English word and its Bulgarian translation to clear the board.
      </p>
    </div>
  );
}

