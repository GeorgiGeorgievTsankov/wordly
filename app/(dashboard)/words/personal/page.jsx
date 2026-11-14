import Link from 'next/link';
import { Bookmark, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PersonalWordsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Personal Vocabulary
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your private collection of custom words and phrases. Strictly visible only to you.
          </p>
        </div>

        <Link href="/words/personal/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Custom Word</span>
          </Button>
        </Link>
      </div>

      <Card className="p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center">
          <Bookmark className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Your Private Dictionary is Ready</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Add your own English words with Bulgarian translations. They plug directly into your spaced repetition study engine.
        </p>
      </Card>
    </div>
  );
}
