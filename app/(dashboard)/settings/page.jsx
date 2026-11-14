import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Clock, Target, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your study preferences and account profile.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-2xl">
            {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{profile?.display_name || profile?.username}</h2>
            <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            <div className="mt-1">
              <Badge variant={profile?.role === 'admin' ? 'brand' : 'default'} className="text-xs">
                {profile?.role === 'admin' ? 'Administrator' : 'Standard User'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
              <User className="w-3.5 h-3.5" /> Username
            </span>
            <p className="font-medium text-slate-900">@{profile?.username}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
              <Target className="w-3.5 h-3.5" /> Daily Goal
            </span>
            <p className="font-medium text-slate-900">{profile?.daily_goal || 10} words per day</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
              <Clock className="w-3.5 h-3.5" /> Local Timezone
            </span>
            <p className="font-medium text-slate-900">{profile?.timezone || 'Europe/Sofia'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
              <Shield className="w-3.5 h-3.5" /> Role Protection
            </span>
            <p className="font-medium text-emerald-700">Enforced by Postgres Trigger</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
