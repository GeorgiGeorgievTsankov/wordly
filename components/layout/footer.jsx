import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { STRINGS } from '@/lib/constants/strings';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">
              {STRINGS.appName}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {STRINGS.nav.login}
            </Link>
            <Link href="/register" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {STRINGS.nav.register}
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>English vocabulary for Bulgarian speakers</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-500">
            &copy; {year} {STRINGS.appName}. {STRINGS.common.allRightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}

