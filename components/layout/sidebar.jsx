'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Brain,
  Library,
  Bookmark,
  BarChart3,
  Trophy,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Flame,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOutAction } from '@/lib/actions/auth';

export function Sidebar({ profile }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Learn', href: '/learn', icon: Brain },
    { label: 'Dictionary', href: '/words', icon: Library },
    { label: 'Personal Words', href: '/words/personal', icon: Bookmark },
    { label: 'Statistics', href: '/statistics', icon: BarChart3 },
    { label: 'Achievements', href: '/achievements', icon: Trophy },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  if (profile?.role === 'admin') {
    navLinks.push({ label: 'Admin Panel', href: '/admin', icon: ShieldAlert, admin: true });
  }

  const NavContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Wordly
            </span>
          </Link>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Card */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {profile?.display_name || profile?.username || 'Learner'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {profile?.role === 'admin' ? 'Administrator' : `@${profile?.username}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60 flex-shrink-0">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>0</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  item.admin && !isActive && 'text-amber-700 hover:bg-amber-50'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-brand-600' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sign Out */}
      <div className="pt-4 border-t border-slate-200/80">
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-slate-900">Wordly</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white p-6 fixed inset-y-0 left-0 z-30">
        <NavContent />
      </aside>
    </>
  );
}
