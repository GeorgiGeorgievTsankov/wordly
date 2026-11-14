'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { PARTS_OF_SPEECH, DIFFICULTIES } from '@/lib/validation/vocabulary';
import { Button } from '@/components/ui/button';

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function VocabularyFilters({ categories = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const pos = searchParams.get('pos') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const category = searchParams.get('category') || '';

  function applyFilter(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // reset to page 1
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    applyFilter('search', search.trim());
  }

  function clearAllFilters() {
    setSearch('');
    router.push(pathname);
  }

  const hasActiveFilters = pos || difficulty || category || searchParams.get('search');

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search English words or translations…"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); applyFilter('search', ''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button type="submit" variant="primary" size="md">
          Search
        </Button>
      </form>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Part of speech */}
        <select
          value={pos}
          onChange={(e) => applyFilter('pos', e.target.value)}
          className="text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Parts of Speech</option>
          {PARTS_OF_SPEECH.map((p) => (
            <option key={p} value={p}>{capitalize(p)}</option>
          ))}
        </select>

        {/* Difficulty */}
        <select
          value={difficulty}
          onChange={(e) => applyFilter('difficulty', e.target.value)}
          className="text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{capitalize(d)}</option>
          ))}
        </select>

        {/* Category */}
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => applyFilter('category', e.target.value)}
            className="text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
