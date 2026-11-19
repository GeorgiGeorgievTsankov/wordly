'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, UploadCloud, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { importWordsBatchAction } from '@/lib/actions/admin';

const SAMPLE_JSON = `[
  {
    "headword": "accomplish",
    "part_of_speech": "verb",
    "difficulty": "B1",
    "phonetic_transcription": "əˈkʌm.plɪʃ",
    "translation": "постигам",
    "definition": "to succeed in doing or completing something",
    "example_sentence": "She accomplished her goal of learning 1,000 words.",
    "example_translation": "Тя постигна целта си да научи 1000 думи."
  },
  {
    "headword": "resilient",
    "part_of_speech": "adjective",
    "difficulty": "B2",
    "phonetic_transcription": "rɪˈzɪl.jənt",
    "translation": "устойчив",
    "definition": "able to recover quickly from difficult conditions",
    "example_sentence": "Children are remarkably resilient.",
    "example_translation": "Децата са забележително устойчиви."
  }
]`;

export default function AdminImportPage() {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleImport = () => {
    setError(null);
    setResult(null);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Payload must be a JSON array of word objects.');
      }
    } catch (parseErr) {
      setError(`Invalid JSON syntax: ${parseErr.message}`);
      return;
    }

    startTransition(async () => {
      const res = await importWordsBatchAction({
        filename: 'admin_bulk_import.json',
        format: 'json',
        rows: parsed,
      });

      if (!res.success) {
        setError(res.error || 'Import failed.');
      } else {
        setResult(res.summary);
      }
    });
  };

  const handleLoadSample = () => {
    setJsonText(SAMPLE_JSON);
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Admin</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Batch Vocabulary Import
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Bulk import English words with Bulgarian translations, phonetic transcriptions, and context examples.
        </p>
      </div>

      {result && (
        <Card className="p-6 border-emerald-200 bg-emerald-50/50 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base">Import Batch Completed</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-sm">
            <div className="bg-white p-3 rounded-xl border border-emerald-100">
              <span className="block text-2xl font-black text-emerald-600">{result.imported}</span>
              <span className="text-xs text-slate-500 font-medium">Imported</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100">
              <span className="block text-2xl font-black text-amber-600">{result.duplicates}</span>
              <span className="text-xs text-slate-500 font-medium">Duplicates Skipped</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100">
              <span className="block text-2xl font-black text-rose-600">{result.errors}</span>
              <span className="text-xs text-slate-500 font-medium">Errors</span>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle>JSON Data Payload</CardTitle>
            <CardDescription>Paste an array of word objects matching the schema.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={handleLoadSample}>
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            <span>Load Sample JSON</span>
          </Button>
        </div>

        <textarea
          rows={14}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={`[\n  {\n    "headword": "example",\n    "part_of_speech": "noun",\n    "translation": "пример"\n  }\n]`}
          className="w-full font-mono text-xs p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Duplication check strictly compares (normalized_headword, part_of_speech).
          </span>
          <Button
            disabled={!jsonText.trim() || isPending}
            onClick={handleImport}
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            <span>{isPending ? 'Importing Batch...' : 'Run Import Batch'}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

