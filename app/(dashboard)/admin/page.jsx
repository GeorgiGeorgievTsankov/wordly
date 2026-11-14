import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ShieldAlert, Users, BookOpen, Layers, UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-500">
          This area is strictly reserved for Wordly administrators. Your role is &lsquo;{profile?.role || 'user'}&rsquo;.
        </p>
      </div>
    );
  }

  // Admin stats
  const [usersRes, wordsRes, submissionsRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('words').select('*', { count: 'exact', head: true }),
    supabase.from('word_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Platform metrics, submissions moderation, and dictionary operations.
          </p>
        </div>
        <Badge variant="brand">Administrator Verified</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Registered Users
            </span>
            <p className="text-2xl font-bold text-slate-900">{usersRes.count || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Core Words
            </span>
            <p className="text-2xl font-bold text-slate-900">{wordsRes.count || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Submissions
            </span>
            <p className="text-2xl font-bold text-slate-900">{submissionsRes.count || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Admin Modules Grid */}
      <h2 className="text-lg font-bold text-slate-900 pt-2">Management Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card hover className="p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <CardTitle>Word Submissions</CardTitle>
            <CardDescription>
              Review proposals submitted by registered learners. Approve or reject with atomic database updates.
            </CardDescription>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <Badge variant="secondary">{submissionsRes.count || 0} Pending</Badge>
            <Link href="/admin/submissions">
              <Button size="sm">
                <span>Moderate Submissions</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card hover className="p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <CardTitle>Batch Vocabulary Import</CardTitle>
            <CardDescription>
              Import core English vocabulary with Bulgarian translations via JSON or CSV format. Automatic duplicate detection.
            </CardDescription>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end">
            <Link href="/admin/import">
              <Button size="sm">
                <span>Open Importer</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
