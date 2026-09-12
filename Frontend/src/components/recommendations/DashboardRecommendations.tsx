import { useEffect, useState } from 'react';
import { recommendationApi } from '../../services/recommendationApi';
import type { Recommendation } from '../../services/recommendationApi';
import { RecommendationCard } from './RecommendationCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

export function DashboardRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await recommendationApi.getRecommendations(3);
        setRecommendations(data);
      } catch (e) {
        console.error('Failed to load recommendations:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-400">You're on track!</h3>
              <p className="text-sm text-emerald-700/80 dark:text-emerald-500/80 mt-0.5">
                No urgent study recommendations right now. Keep following your current study plan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Smart Recommendations</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {recommendations.map((rec, i) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="h-full"
            >
              <RecommendationCard recommendation={rec} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
