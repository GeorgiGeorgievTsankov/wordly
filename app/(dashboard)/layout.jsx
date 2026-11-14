import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fallback in case profile record was delayed
  if (!profile) {
    profile = {
      id: user.id,
      username: user.email?.split('@')[0] || 'user',
      display_name: user.email?.split('@')[0] || 'User',
      role: 'user',
      daily_goal: 10,
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Sidebar profile={profile} />
      <div className="flex-1 md:pl-64">
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
