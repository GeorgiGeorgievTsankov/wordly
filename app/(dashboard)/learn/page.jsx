import Link from 'next/link';
import { Brain, BookOpen, ListChecks, Keyboard, Shuffle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function LearnPage() {
  const modes = [
    {
      title: 'Flashcards',
      description: 'Review vocabulary with active recall and self-assessed SM-2 spaced repetition.',
      href: '/learn/flashcards',
      icon: BookOpen,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Multiple Choice Quiz',
      description: 'Quick-paced recognition practice selecting the correct Bulgarian translation.',
      href: '/learn/quiz',
      icon: ListChecks,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Active Typing',
      description: 'Solidify your memory and spelling by typing translations from scratch.',
      href: '/learn/typing',
      icon: Keyboard,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Speed Matching',
      description: 'Connect English headwords to their Bulgarian counterparts under timed pressure.',
      href: '/learn/matching',
      icon: Shuffle,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Study & Practice Modes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pick a mode to start your adaptive vocabulary session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card key={mode.href} hover className="p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-2xl ${mode.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <CardTitle>{mode.title}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Badge variant="brand">Adaptive SRS</Badge>
                <Link href={mode.href}>
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

