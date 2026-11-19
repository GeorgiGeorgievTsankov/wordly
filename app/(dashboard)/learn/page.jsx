'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ListChecks, Keyboard, Shuffle, ArrowRight, BrainCircuit, Sparkles, Filter, Database, UserCheck } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function LearnPage() {
  const [wordSource, setWordSource] = useState('core'); // 'core' by default so they practice the 300 verbs!
  const [sessionSize, setSessionSize] = useState('10');

  const modes = [
    {
      title: 'Smart Review',
      description: 'Review words scheduled for today by the SM-2 algorithm, prioritizing overdue and difficult items.',
      slug: 'review',
      icon: BrainCircuit,
      color: 'bg-purple-50 text-purple-600',
      badge: 'Recommended',
    },
    {
      title: 'Flashcards',
      description: 'Review vocabulary with active recall and self-assessed SM-2 spaced repetition.',
      slug: 'flashcards',
      icon: BookOpen,
      color: 'bg-indigo-50 text-indigo-600',
      badge: 'Core SRS',
    },
    {
      title: 'Multiple Choice Quiz',
      description: 'Quick-paced recognition practice selecting the correct Bulgarian translation.',
      slug: 'quiz',
      icon: ListChecks,
      color: 'bg-blue-50 text-blue-600',
      badge: 'Recognition',
    },
    {
      title: 'Active Typing',
      description: 'Solidify your memory and spelling by typing Bulgarian translations from scratch.',
      slug: 'typing',
      icon: Keyboard,
      color: 'bg-emerald-50 text-emerald-600',
      badge: 'Deep Recall',
    },
    {
      title: 'Speed Matching',
      description: 'Connect English headwords to their Bulgarian counterparts under timed pressure.',
      slug: 'matching',
      icon: Shuffle,
      color: 'bg-amber-50 text-amber-600',
      badge: 'Speed & Agility',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Study & Practice Modes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pick a mode and customize your session source to start practicing.
        </p>
      </div>

      {/* Session Customizer Card */}
      <Card className="p-5 border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/30 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Session Customization</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Source Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Vocabulary Source
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWordSource('core')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                  wordSource === 'core'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Core (300 Verbs)</span>
              </button>

              <button
                type="button"
                onClick={() => setWordSource('personal')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                  wordSource === 'personal'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Personal Words</span>
              </button>

              <button
                type="button"
                onClick={() => setWordSource('all')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                  wordSource === 'all'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>All Combined</span>
              </button>
            </div>
          </div>

          {/* Session Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Cards per Session
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['10', '20', '30'].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSessionSize(size)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    sessionSize === size
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 border-2'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {size} Words
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const targetUrl = `/learn/${mode.slug}?source=${wordSource}&size=${sessionSize}`;

          return (
            <Card key={mode.slug} hover className="p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${mode.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <Badge variant={mode.badge === 'Recommended' ? 'brand' : 'secondary'}>
                    {mode.badge}
                  </Badge>
                </div>
                <CardTitle>{mode.title}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  {wordSource === 'core'
                    ? 'Source: 300 Core Verbs'
                    : wordSource === 'personal'
                    ? 'Source: Personal Words'
                    : 'Source: All Words'}
                </span>
                <Link href={targetUrl}>
                  <Button size="sm">
                    <span>Start Session</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
