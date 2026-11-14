'use client';

import { useState, useTransition } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PARTS_OF_SPEECH } from '@/lib/validation/vocabulary';

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldInput({ name, type = 'text', placeholder, defaultValue, required, autoComplete, className = '' }) {
  return (
    <input
      name={name}
      type={type}
      required={required}
      autoComplete={autoComplete}
      placeholder={placeholder}
      defaultValue={defaultValue || ''}
      className={`w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all ${className}`}
    />
  );
}

function FieldTextarea({ name, placeholder, defaultValue, rows = 3 }) {
  return (
    <textarea
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue || ''}
      rows={rows}
      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
    />
  );
}

/**
 * Reusable word form for both adding personal words and proposing words.
 * `action` is a server action function.
 * `defaultValues` pre-populates the form (for editing).
 * `showExplanation` shows the optional explanation field for submissions.
 */
export function WordForm({ action, defaultValues = {}, submitLabel = 'Submit', showExplanation = false }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const result = await action(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-5 shadow-sm"
    >
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* English Word */}
      <div>
        <FieldLabel required>English Word or Phrase</FieldLabel>
        <FieldInput
          name="headword"
          placeholder="e.g. accomplish"
          defaultValue={defaultValues.headword}
          required
        />
      </div>

      {/* Bulgarian Translation */}
      <div>
        <FieldLabel required>Bulgarian Translation</FieldLabel>
        <FieldInput
          name="translation"
          placeholder="e.g. постигам, осъществявам"
          defaultValue={defaultValues.translation}
          required
        />
        <p className="text-xs text-slate-400 mt-1">
          Separate multiple accepted translations with a comma.
        </p>
      </div>

      {/* Part of Speech */}
      <div>
        <FieldLabel required>Part of Speech</FieldLabel>
        <select
          name="part_of_speech"
          required
          defaultValue={defaultValues.part_of_speech || ''}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
        >
          <option value="" disabled>Select part of speech...</option>
          {PARTS_OF_SPEECH.map((p) => (
            <option key={p} value={p}>{capitalize(p)}</option>
          ))}
        </select>
      </div>

      {/* Definition (optional) */}
      <div>
        <FieldLabel>Definition (optional)</FieldLabel>
        <FieldTextarea
          name="definition"
          placeholder="A short English definition or usage note..."
          defaultValue={defaultValues.definition}
        />
      </div>

      {/* English Example */}
      <div>
        <FieldLabel>Example Sentence in English (optional)</FieldLabel>
        <FieldInput
          name="example_en"
          placeholder='e.g. "She accomplished all her goals this year."'
          defaultValue={defaultValues.example_en}
        />
      </div>

      {/* Bulgarian Example */}
      <div>
        <FieldLabel>Example Sentence in Bulgarian (optional)</FieldLabel>
        <FieldInput
          name="example_bg"
          placeholder="e.g. Тя постигна всичките си цели тази година."
          defaultValue={defaultValues.example_bg}
        />
      </div>

      {/* Explanation — only for proposal submissions */}
      {showExplanation && (
        <div>
          <FieldLabel>Notes for the Admin (optional)</FieldLabel>
          <FieldTextarea
            name="explanation"
            placeholder="Why should this word be added to the core dictionary?"
            defaultValue={defaultValues.explanation}
          />
        </div>
      )}

      <div className="pt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <Button type="submit" disabled={isPending || !!success}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
