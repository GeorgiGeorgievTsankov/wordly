import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { STRINGS } from '@/lib/constants/strings';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:bg-brand-700 transition-colors">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            {STRINGS.appName}
          </span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-3xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}

