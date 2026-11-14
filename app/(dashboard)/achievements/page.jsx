import { Trophy, Sparkles, BookOpen, Flame, Calendar, Zap, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function AchievementsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .order('name');

  const { data: unlocked } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', user.id);

  const unlockedMap = new Map((unlocked || []).map((u) => [u.achievement_id, u.unlocked_at]));

  const iconMap = {
    Sparkles: Sparkles,
    BookOpen: BookOpen,
    Flame: Flame,
    Trophy: Trophy,
    Calendar: Calendar,
    Zap: Zap,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Milestones & Achievements
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Unlock badges as you study consistently and expand your English mastery.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(achievements || []).map((ach) => {
          const Icon = iconMap[ach.icon] || Trophy;
          const isUnlocked = unlockedMap.has(ach.id);

          return (
            <Card
              key={ach.id}
              className={`p-6 border transition-all ${
                isUnlocked
                  ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
                  : 'border-slate-200 bg-white opacity-85'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isUnlocked
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                {isUnlocked ? (
                  <Badge variant="success" className="text-[11px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Unlocked
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-[11px]">
                    Locked
                  </Badge>
                )}
              </div>

              <div className="mt-4 space-y-1">
                <h3 className="font-bold text-slate-900">{ach.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {ach.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

