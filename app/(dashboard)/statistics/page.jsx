import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Learning Statistics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed metrics, retention curve, and study history.
        </p>
      </div>

      <Card className="p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Charts & Trends</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Comprehensive Recharts visual analytics will be activated in Phase 5.
        </p>
      </Card>
    </div>
  );
}

