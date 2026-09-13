import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Brain, AlertCircle, Loader2, TrendingUp, CheckCircle, Crosshair } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { aiAnalyzerApi } from '../../services/aiAnalyzerApi';
import type { AIAnalyzerData } from '../../services/aiAnalyzerApi';

export default function AIAnalyzer() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AIAnalyzerData | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await aiAnalyzerApi.getAnalysis(period);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Unable to analyze your study data right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'negative': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--card-bg)] p-6 rounded-[var(--radius-card)] border border-[var(--border-color)] shadow-soft">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">AI Study Analyzer</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Here's what your study data says about you.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value as any)}
            className="h-10 px-3 py-2 bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            disabled={loading}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button onClick={handleAnalyze} disabled={loading} className="gap-2 px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Analyze My Study Data'}
          </Button>
        </div>
      </div>

      {/* Error State */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results State */}
      <AnimatePresence mode="wait">
        {data && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* Insufficient Data State */}
            {data.dataQuality.level === 'limited' && (
              <div className="p-6 bg-[var(--card-bg)] border border-dashed border-[var(--border-color)] rounded-2xl text-center">
                <Bot className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Not enough study data yet</h3>
                <p className="text-[var(--text-secondary)] max-w-md mx-auto">{data.dataQuality.message}</p>
              </div>
            )}

            {data.dataQuality.level !== 'limited' && (
              <>
                {/* Overall Assessment */}
                <div className={`p-6 rounded-2xl border ${getStatusColor(data.overallAssessment.status)}`}>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white/20 rounded-lg shrink-0">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold mb-1">{data.overallAssessment.title}</h2>
                      <p className="opacity-90 leading-relaxed">{data.overallAssessment.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Key Insights Grid */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] px-1">Key Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.insights.map((insight, idx) => (
                      <div key={idx} className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5 rounded-2xl shadow-sm flex flex-col h-full hover:border-[var(--color-primary)]/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded">
                            {insight.category.replace('_', ' ')}
                          </span>
                          {getSeverityIcon(insight.severity)}
                        </div>
                        <h4 className="font-bold text-[var(--text-primary)] mb-2">{insight.title}</h4>
                        <p className="text-sm text-[var(--text-secondary)] mb-4 flex-grow">{insight.observation}</p>
                        <div className="text-xs bg-[var(--bg-color)] border border-[var(--border-color)] p-2.5 rounded-lg text-[var(--text-primary)] font-medium">
                          <span className="text-[var(--text-secondary)] block mb-1 font-bold">Evidence:</span>
                          {insight.evidence}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Strengths */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] px-1 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" /> Strengths
                    </h3>
                    {data.strengths.map((s, i) => (
                      <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-xl shadow-sm">
                        <h4 className="font-bold text-[var(--text-primary)] text-sm mb-1">{s.title}</h4>
                        <p className="text-sm text-[var(--text-secondary)] mb-2">{s.description}</p>
                        <p className="text-xs font-medium text-[var(--text-primary)]">Evidence: {s.evidence}</p>
                      </div>
                    ))}
                  </div>

                  {/* Areas to Improve */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] px-1 flex items-center gap-2">
                      <Crosshair className="w-5 h-5 text-amber-500" /> Areas to Improve
                    </h3>
                    {data.areasToImprove.map((a, i) => (
                      <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-[var(--text-primary)] text-sm">{a.title}</h4>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${a.priority === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {a.priority}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-2">{a.description}</p>
                        <p className="text-xs font-medium text-[var(--text-primary)]">Evidence: {a.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
