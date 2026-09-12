import { useState } from 'react';
import { aiPlannerApi } from '../../services/aiPlannerApi';
import type { AIPlan } from '../../services/aiPlannerApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Bot, Clock, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudyData } from '../../context/StudyContext';

export function AIDailyPlanner() {
  const [availableMinutes, setAvailableMinutes] = useState(180);
  const [status, setStatus] = useState<'initial' | 'loading' | 'generated' | 'adding' | 'success' | 'error'>('initial');
  const [plan, setPlan] = useState<AIPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { refreshData } = useStudyData();

  const timeOptions = [
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
    { label: '4 hours', value: 240 }
  ];

  const handleGenerate = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const response = await aiPlannerApi.generateDailyPlan(availableMinutes);
      if (response.success && response.plan) {
        setPlan(response.plan);
        setStatus('generated');
      } else {
        throw new Error(response.message || 'Failed to generate plan');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'We couldn\'t generate your study plan right now. Please try again.');
      setStatus('error');
    }
  };

  const handleAddToTasks = async () => {
    if (!plan) return;
    setStatus('adding');
    setErrorMessage('');
    try {
      const response = await aiPlannerApi.addToTasks(plan.items);
      if (response.success) {
        setStatus('success');
        let msg = `✓ Added ${response.created} task${response.created !== 1 ? 's' : ''}`;
        if (response.skipped > 0) {
          msg += `\n${response.skipped} task${response.skipped !== 1 ? 's' : ''} already in Today's Tasks.`;
        }
        setSuccessMessage(msg);
        
        // Refresh the global study data context so the tasks appear in the Daily Tasks UI instantly
        await refreshData();
      } else {
        throw new Error(response.message || 'Failed to add to tasks');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'We couldn\'t add the plan to Today\'s Tasks. Please try again.');
      setStatus('error');
    }
  };

  return (
    <Card className="border-[var(--color-primary)]/30 shadow-md bg-gradient-to-br from-[var(--bg-main)] to-[var(--color-primary)]/5 relative overflow-hidden">
      <CardHeader className="pb-3 border-b border-[var(--border-color)]/50 relative z-10">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
          <Bot className="h-5 w-5 text-[var(--color-primary)]" /> 
          AI Daily Planner
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* INITIAL STATE */}
          {status === 'initial' && (
            <motion.div 
              key="initial"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-[var(--text-secondary)]">
                Plan your study time intelligently based on your goals, exams, recent activity, and available time.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="space-y-2 w-full sm:w-auto">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Available Time</label>
                  <select 
                    className="w-full sm:w-48 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-sm font-medium"
                    value={availableMinutes}
                    onChange={(e) => setAvailableMinutes(Number(e.target.value))}
                  >
                    {timeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleGenerate} className="w-full sm:w-auto flex-1 font-bold shadow-sm" variant="primary">
                  Generate Today's Plan
                </Button>
              </div>
            </motion.div>
          )}

          {/* LOADING STATE */}
          {status === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 space-y-4 text-center"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-[var(--color-primary)]/20"></div>
                <div className="h-12 w-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                  <Bot className="h-6 w-6 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Creating your study plan...</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Analyzing your goals, exams and recent study activity...</p>
              </div>
            </motion.div>
          )}

          {/* ADDING STATE */}
          {status === 'adding' && (
            <motion.div 
              key="adding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 space-y-4 text-center"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Adding to Today's Tasks...</h3>
            </motion.div>
          )}

          {/* GENERATED STATE */}
          {status === 'generated' && plan && (
            <motion.div 
              key="generated"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-[var(--text-primary)] text-lg mb-1">{plan.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">{plan.summary}</p>
                
                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-[var(--border-color)]/50 mb-5 pl-8">
                  {plan.items.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-9 top-1 h-6 w-6 rounded-full bg-[var(--bg-main)] border-2 border-[var(--color-primary)] text-xs font-bold flex items-center justify-center text-[var(--text-primary)] z-10 shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--color-primary)]/30 transition-colors p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div>
                            <p className="text-xs font-bold text-[var(--color-primary)] mb-0.5">{item.subject}</p>
                            <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{item.activity}</h4>
                          </div>
                          <span className="shrink-0 flex items-center gap-1 px-2 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-md text-xs font-bold">
                            <Clock className="h-3 w-3" /> {item.durationMinutes}m
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[var(--border-color)]/50 gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      Total planned: <span className={plan.totalMinutes > availableMinutes ? 'text-[var(--color-error)]' : 'text-[var(--color-primary)]'}>{plan.totalMinutes} min</span>
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Available: {availableMinutes} min</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => setStatus('initial')} className="flex-1 sm:flex-none">
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddToTasks} className="flex-1 sm:flex-none font-bold gap-2 shadow-sm">
                      <Plus className="h-4 w-4" /> Add to Tasks
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SUCCESS STATE */}
          {status === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 space-y-4 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/20"
            >
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <div>
                <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400 whitespace-pre-line">{successMessage}</h3>
                <p className="text-sm text-emerald-600/80 dark:text-emerald-500/80 mt-1">
                  You can view them in the Daily Tasks tab.
                </p>
              </div>
              <Button variant="outline" onClick={() => setStatus('initial')} className="mt-2 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                Plan Another Day
              </Button>
            </motion.div>
          )}

          {/* ERROR STATE */}
          {status === 'error' && (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 space-y-4 text-center bg-red-500/5 rounded-xl border border-red-500/20"
            >
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 max-w-md">{errorMessage}</p>
              </div>
              <Button variant="outline" onClick={() => setStatus('initial')} className="text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/10">
                Try Again
              </Button>
            </motion.div>
          )}
          
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
