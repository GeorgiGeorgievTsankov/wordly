'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { parseCSV, SAMPLE_CSV_CONTENT } from '@/lib/utils/csv';
import { importWordsBatchAction } from '@/lib/actions/admin';

const SAMPLE_JSON = `[
  {
    "headword": "accomplish",
    "part_of_speech": "verb",
    "difficulty": "intermediate",
    "translation": "постигам",
    "accepted_translations": ["осъществявам", "изпълнявам"],
    "example_en": "She accomplished her goal of learning 1,000 words.",
    "example_bg": "Тя постигна целта си да научи 1000 думи.",
    "category": "Verbs"
  }
]`;

export default function AdminImportPage() {
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' | 'json'
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef(null);

  // Handle CSV file selection and parsing
  const handleProcessFile = (file) => {
    if (!file) return;
    setError(null);
    setResult(null);

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a valid .csv file.');
      return;
    }

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const res = parseCSV(text);
        if (res.rows.length === 0) {
          setError('No valid rows found in CSV. Please ensure the file has "headword" and "translation" columns.');
          setParsedData(null);
        } else {
          setParsedData(res);
        }
      } catch (err) {
        setError(`Failed to parse CSV: ${err.message}`);
        setParsedData(null);
      }
    };
    reader.onerror = () => {
      setError('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleProcessFile(file);
  };

  // Submit CSV batch import
  const handleImportCSV = () => {
    if (!parsedData || parsedData.rows.length === 0) {
      setError('No parsed rows to import.');
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      const res = await importWordsBatchAction({
        filename: csvFile?.name || 'uploaded_batch.csv',
        format: 'csv',
        rows: parsedData.rows,
      });

      if (!res.success) {
        setError(res.error || 'Import failed.');
      } else {
        setResult(res.summary);
      }
    });
  };

  // Submit JSON batch import
  const handleImportJSON = () => {
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

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'wordly_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Admin</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Batch Vocabulary Import
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Bulk import English vocabulary with translations, synonyms, and example sentences directly into the core dictionary.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="shrink-0 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Download CSV Template</span>
          </Button>
        </div>
      </div>

      {/* Success Result Card */}
      {result && (
        <Card className="p-6 border-emerald-200 bg-emerald-50/50 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base">Import Completed Successfully!</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/words">
                <Button size="sm" variant="outline" className="bg-white">
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-600" />
                  <span>View in Dictionary</span>
                </Button>
              </Link>
              <Link href="/learn">
                <Button size="sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  <span>Start Practice</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs">
              <div className="text-2xl font-black text-emerald-600">{result.importedWords || 0}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">New Words Added</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs">
              <div className="text-2xl font-black text-indigo-600">{result.meaningsAdded || 0}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Meanings Inserted</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs">
              <div className="text-2xl font-black text-amber-600">{result.updatedWords || 0}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Words Updated</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs">
              <div className="text-2xl font-black text-slate-600">{result.duplicates || 0}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Duplicate Meanings</div>
            </div>
          </div>

          {result.errors > 0 && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800">
              <span className="font-bold">{result.errors} rows had issues:</span>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-amber-700">
                {result.errorDetails?.map((err, i) => (
                  <li key={i}>Row {err.row}: {err.error}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Error Card */}
      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50/70 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-700">
            <p className="font-bold">Import failed</p>
            <p className="text-rose-600 mt-0.5">{error}</p>
          </div>
        </Card>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'csv'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Upload CSV File</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'json'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paste JSON</span>
        </button>
      </div>

      {/* CSV TAB CONTENT */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          {/* Drag & Drop Card */}
          <Card
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  {csvFile ? csvFile.name : 'Choose a CSV file or drag & drop it here'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supports standard CSV files (UTF-8, Excel, comma-separated)
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" className="pointer-events-none mt-2">
                Browse CSV File
              </Button>
            </div>
          </Card>

          {/* Parsed Preview Card */}
          {parsedData && (
            <Card className="p-6 space-y-4 border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span>Parsed Preview</span>
                    <Badge variant="brand">{parsedData.totalParsed} valid words</Badge>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    File: <span className="font-mono">{csvFile?.name}</span> ({Math.round(csvFile?.size / 1024)} KB)
                  </p>
                </div>
                <Button
                  onClick={handleImportCSV}
                  disabled={isPending}
                  className="flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Importing words...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Confirm & Import to Core Dictionary</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Sample Preview Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Headword</th>
                      <th className="py-2.5 px-3">Part of Speech</th>
                      <th className="py-2.5 px-3">Translation</th>
                      <th className="py-2.5 px-3">Alternatives</th>
                      <th className="py-2.5 px-3">English Example</th>
                      <th className="py-2.5 px-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {parsedData.rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-bold text-slate-900">{row.headword}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                            {row.part_of_speech || 'noun'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-indigo-700">{row.translation}</td>
                        <td className="py-2 px-3 text-slate-500">{row.accepted_translations || '—'}</td>
                        <td className="py-2 px-3 italic text-slate-600 max-w-xs truncate">{row.example_en || '—'}</td>
                        <td className="py-2 px-3">{row.category || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedData.totalParsed > 5 && (
                <p className="text-xs text-slate-400 italic text-right">
                  Showing first 5 rows of {parsedData.totalParsed} total rows...
                </p>
              )}
            </Card>
          )}

          {/* Guidelines Box */}
          <Card className="p-5 border-slate-200 bg-slate-50/50 space-y-2 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 text-sm">Supported CSV Columns:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div><strong className="text-slate-900 font-sans">headword:</strong> English word (required)</div>
              <div><strong className="text-slate-900 font-sans">translation:</strong> Bulgarian translation (required)</div>
              <div><strong className="text-slate-900 font-sans">part_of_speech:</strong> noun, verb, adjective, etc.</div>
              <div><strong className="text-slate-900 font-sans">accepted_translations:</strong> pipe-separated (вещ|работа)</div>
              <div><strong className="text-slate-900 font-sans">example_en:</strong> English example sentence</div>
              <div><strong className="text-slate-900 font-sans">example_bg:</strong> Bulgarian sentence translation</div>
              <div><strong className="text-slate-900 font-sans">category:</strong> Nouns, Verbs, Adjectives, etc.</div>
              <div><strong className="text-slate-900 font-sans">difficulty:</strong> beginner, intermediate, advanced</div>
            </div>
          </Card>
        </div>
      )}

      {/* JSON TAB CONTENT */}
      {activeTab === 'json' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>JSON Payload Import</CardTitle>
              <CardDescription>
                Paste a JSON array of word objects matching the schema.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setJsonText(SAMPLE_JSON)}>
              Load Sample JSON
            </Button>
          </div>

          <textarea
            rows={12}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="[ { headword: '...', translation: '...' } ]"
            className="w-full font-mono text-xs p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          <div className="flex justify-end">
            <Button onClick={handleImportJSON} disabled={isPending || !jsonText.trim()}>
              {isPending ? 'Importing JSON...' : 'Import JSON Payload'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
