import { createClient } from '@/lib/supabase/server';
import { ShieldAlert, Users, BookOpen, Layers, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: wordsCount } = await supabase
    .from('words')
    .select('*', { count: 'exact', head: true });

  const { count: submissionsCount } = await supabase
    .from('word_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Platform governance, submissions moderation, and dictionary management.
          </p>
        </div>
        <Badge variant="brand">Administrator Role Verified</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Registered Users
            </span>
            <p className="text-2xl font-bold text-slate-900">{usersCount || 0}</p>
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
            <p className="text-2xl font-bold text-slate-900">{wordsCount || 0}</p>
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
            <p className="text-2xl font-bold text-slate-900">{submissionsCount || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </Card>
      </div>
    </div>
  );
}

