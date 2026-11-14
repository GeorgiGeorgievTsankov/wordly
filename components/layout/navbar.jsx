'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Menu, X, ArrowRight } from 'lucide-react';
import { STRINGS } from '@/lib/constants/strings';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/30 group-hover:bg-brand-700 transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            {STRINGS.appName}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link
            href="#features"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {STRINGS.nav.features}
          </Link>
          <Link
            href="#modes"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {STRINGS.nav.learn}
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {STRINGS.nav.howItWorks}
          </Link>
        </nav>

        {/* Desktop CTA actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              {STRINGS.nav.login}
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              <span>{STRINGS.nav.register}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col gap-2 font-medium text-slate-700 dark:text-slate-200">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {STRINGS.nav.features}
            </Link>
            <Link
              href="#modes"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {STRINGS.nav.learn}
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {STRINGS.nav.howItWorks}
            </Link>
          </nav>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                {STRINGS.nav.login}
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full">
                {STRINGS.nav.register}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

