'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserStatisticsAction } from '@/lib/actions/progress';

const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981']; // indigo (learning), blue (reviewing), emerald (mastered)

export default function StatisticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getUserStatisticsAction();
        if (res.success) {
          setData(res.stats);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-10 h-10 mx-auto rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading your performance metrics...</p>
      </div>
    );
  }

  const stats = data || {
    streak: 0,
    totalXp: 0,
    totalWordsStudied: 0,
    learningCount: 0,
    reviewingCount: 0,
    masteredCount: 0,
    accuracy: 100,
    dailyGoal: 10,
    todayReviewed: 0,
    last7Days: [],
    hardWordsCount: 0,
  };

  const distributionData = [
    { name: 'Learning', value: stats.learningCount },
    { name: 'Reviewing', value: stats.reviewingCount },
    { name: 'Mastered', value: stats.masteredCount },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Learning Statistics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track your spaced repetition retention, daily streaks, and memory progress.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Streak</p>
            <p className="text-2xl font-black text-slate-900">{stats.streak} Days</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 fill-indigo-400 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total XP</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalXp}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accuracy</p>
            <p className="text-2xl font-black text-slate-900">{stats.accuracy}%</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Studied</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalWordsStudied}</p>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Bar Chart (2 columns wide) */}
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Study Volume</CardTitle>
              <CardDescription>Number of words reviewed per day over the last 7 days</CardDescription>
            </div>
            <Badge variant="secondary">Words Reviewed</Badge>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.last7Days}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs rounded-xl p-2.5 shadow-lg space-y-1">
                          <p className="font-bold">{p.date}</p>
                          <p className="text-indigo-300">Reviewed: {p.reviewed} words</p>
                          <p className="text-amber-300">XP: +{p.xp}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="reviewed" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Word Status Breakdown Pie Chart */}
        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <CardTitle>Vocabulary Mastery</CardTitle>
            <CardDescription>Progress through SM-2 stages</CardDescription>
          </div>

          {distributionData.length > 0 ? (
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No words in progress yet. Start a study session!
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
            <div>
              <span className="block font-bold text-indigo-600">{stats.learningCount}</span>
              <span className="text-slate-400">Learning</span>
            </div>
            <div>
              <span className="block font-bold text-blue-600">{stats.reviewingCount}</span>
              <span className="text-slate-400">Reviewing</span>
            </div>
            <div>
              <span className="block font-bold text-emerald-600">{stats.masteredCount}</span>
              <span className="text-slate-400">Mastered</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
