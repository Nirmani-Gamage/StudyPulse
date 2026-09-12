import type { LearningEffectiveness, MetricResult, Recommendation } from '../../services/analyticsApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { AlertCircle, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  data: LearningEffectiveness | null;
  loading: boolean;
}

export function LearningEffectivenessSection({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-[var(--text-secondary)]">
        Failed to load effectiveness data.
      </div>
    );
  }

  if (!data.sufficientData) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Keep Studying to Unlock Insights</h3>
          <p className="text-[var(--text-secondary)] max-w-md">
            There is not enough data in the selected period to calculate your Learning Effectiveness score. Keep using StudyPulse to generate your insights!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { overall, components, recommendations } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 border-l-4 border-l-[var(--color-primary)] bg-gradient-to-br from-[var(--card-bg)] to-[var(--bg-color)] shadow-md">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Overall Effectiveness
            </p>
            <div className="relative mb-2">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="var(--border-color)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="var(--color-primary)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={351.86}
                  strokeDashoffset={351.86 - (351.86 * (overall || 0)) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-extrabold text-[var(--text-primary)]">{overall}</span>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">/ 100</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-[var(--text-secondary)] mt-2">
              Based on your raw learning habits
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Component Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ComponentBar label="Goal Progress" metric={components.goalProgress} />
            <ComponentBar label="Productivity" metric={components.productivity} missingMessage="No journal entries" />
            <ComponentBar label="Consistency" metric={components.consistency} />
            <ComponentBar label="Study Distribution" metric={components.studyDistribution} missingMessage="No subject data" />
            <ComponentBar label="Revision Activity" metric={components.revision} missingMessage="No completed tasks" />
          </CardContent>
        </Card>
      </div>

      {recommendations && recommendations.length > 0 && (
        <Card className="border border-[var(--border-color)]">
          <CardHeader className="pb-3 border-b border-[var(--border-color)]">
            <CardTitle className="text-lg flex items-center gap-2 text-[var(--text-primary)] font-bold">
              <Sparkles className="h-5 w-5 text-amber-500" /> Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {recommendations.map((rec: Recommendation, idx: number) => (
              <div key={idx} className="flex gap-4">
                <div className="shrink-0 mt-1">
                  {rec.priority === 'high' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : rec.priority === 'medium' ? (
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">{rec.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{rec.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ComponentBar({ label, metric, missingMessage = "Not enough data" }: { label: string, metric: MetricResult, missingMessage?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1.5">
        <span className="text-[var(--text-primary)]">{label}</span>
        <span className={metric.available ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>
          {metric.available ? `${metric.score}%` : missingMessage}
        </span>
      </div>
      <div className="w-full h-2.5 bg-[var(--bg-color)] rounded-full overflow-hidden border border-[var(--border-color)]">
        {metric.available && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${metric.score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${getScoreColor(metric.score || 0)}`}
          />
        )}
      </div>
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-indigo-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}
