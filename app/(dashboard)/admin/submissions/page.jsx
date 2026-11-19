'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, Layers, Clock } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAdminSubmissionsAction, moderateSubmissionAction } from '@/lib/actions/admin';

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [isPending, startTransition] = useTransition();

  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminSubmissionsAction();
      if (!res.success) {
        setError(res.error || 'Failed to load submissions');
      } else {
        setSubmissions(res.submissions || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleModerate = (submissionId, action) => {
    startTransition(async () => {
      setActionMessage(null);
      const res = await moderateSubmissionAction({ submissionId, action });
      if (res.success) {
        setActionMessage(
          action === 'approve'
            ? 'Word approved and added to core dictionary!'
            : 'Submission marked as rejected.'
        );
        loadSubmissions();
      } else {
        setError(res.error || 'Operation failed');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to Admin</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Word Submissions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review community vocabulary proposals and promote them to the core dictionary.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          {actionMessage}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 mx-auto rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <CardTitle>No Submissions Found</CardTitle>
          <CardDescription>
            There are currently no proposals in the queue.
          </CardDescription>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const isPendingStatus = sub.status === 'pending';

            return (
              <Card key={sub.id} className="p-6 space-y-4 border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-black text-slate-900">{sub.headword}</span>
                    <Badge variant="brand">{sub.part_of_speech}</Badge>
                    <Badge
                      variant={
                        sub.status === 'approved'
                          ? 'success'
                          : sub.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {sub.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                    {sub.profiles?.display_name && (
                      <span>by {sub.profiles.display_name}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block">Bulgarian Translation</span>
                    <p className="font-bold text-slate-900 text-base">{sub.translation}</p>
                    {sub.definition && (
                      <p className="text-xs text-slate-500 italic mt-1">{sub.definition}</p>
                    )}
                  </div>

                  {sub.example_sentence && (
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">Example Context</span>
                      <p className="text-slate-800 text-xs italic">“{sub.example_sentence}”</p>
                      {sub.example_translation && (
                        <p className="text-slate-500 text-xs mt-0.5">“{sub.example_translation}”</p>
                      )}
                    </div>
                  )}
                </div>

                {isPendingStatus && (
                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleModerate(sub.id, 'reject')}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      <span>Reject</span>
                    </Button>

                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleModerate(sub.id, 'approve')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      <span>Approve to Dictionary</span>
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

