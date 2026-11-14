'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { STRINGS } from '@/lib/constants/strings';
import { Button } from '@/components/ui/button';
import { signInAction } from '@/lib/actions/auth';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signInAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {STRINGS.auth.signInTitle}
        </h2>
        <p className="text-sm text-slate-500">
          {STRINGS.auth.signInSubtitle}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {STRINGS.auth.emailLabel}
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {STRINGS.auth.passwordLabel}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              {STRINGS.auth.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>{STRINGS.nav.login}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100">
        <Link
          href="/register"
          className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
        >
          {STRINGS.auth.dontHaveAccount}
        </Link>
      </div>
    </div>
  );
}

