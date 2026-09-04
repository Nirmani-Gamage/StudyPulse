import { useState, useEffect, useRef } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Play, Pause, Square, Timer, Target } from 'lucide-react';

interface SavedTimer {
  goalId: string;
  subjectId: string;
  customMinutes: number;
  timeLeft: number;
  isActive: boolean;
  sessionStartTime: string | null;
  expectedEndTime: number | null;
  lastUpdated: number;
}

export default function Pomodoro() {
  const { subjects, goals, addSession, updateGoalProgress } = useStudyData();
  const [subjectId, setSubjectId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [customMinutes, setCustomMinutes] = useState(25);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [expectedEndTime, setExpectedEndTime] = useState<number | null>(null);
  
  const [savedTimers, setSavedTimers] = useState<Record<string, SavedTimer>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [status, setStatus] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);
  const isCompletingRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem('studyPulse_timers');
    if (stored) {
      try {
        setSavedTimers(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load saved timers', e);
      }
    }
    setIsInitialized(true);
  }, []);

  const currentKey = goalId || 'general';

  useEffect(() => {
    if (isInitialized && subjectId && sessionStartTime) {
      setSavedTimers(prev => {
        const next = {
          ...prev,
          [currentKey]: {
            goalId: currentKey,
            subjectId,
            customMinutes,
            timeLeft,
            isActive,
            sessionStartTime: sessionStartTime.toISOString(),
            expectedEndTime,
            lastUpdated: Date.now()
          }
        };
        localStorage.setItem('studyPulse_timers', JSON.stringify(next));
        return next;
      });
    }
  }, [timeLeft, isActive, expectedEndTime, customMinutes, subjectId, sessionStartTime, currentKey, isInitialized]);

  const clearDraft = (keyToClear = currentKey) => {
    setSavedTimers(prev => {
      const next = { ...prev };
      delete next[keyToClear];
      localStorage.setItem('studyPulse_timers', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!isInitialized) return;
    
    const key = goalId || 'general';
    const draft = savedTimers[key];
    
    if (draft && !isActive) {
      setCustomMinutes(draft.customMinutes);
      setTimeLeft(draft.timeLeft);
      setSubjectId(draft.subjectId);
      setSessionStartTime(draft.sessionStartTime ? new Date(draft.sessionStartTime) : null);
      setExpectedEndTime(draft.expectedEndTime);
      
      if (draft.isActive && draft.expectedEndTime) {
         const remaining = Math.max(0, Math.round((draft.expectedEndTime - Date.now()) / 1000));
         setTimeLeft(remaining);
         setIsActive(true);
      }
    } else if (!draft && !isActive && goalId) {
      const selectedGoal = goals.find(g => g.id === goalId);
      if (selectedGoal) {
        const remainingHours = Math.max(0, selectedGoal.targetHours - selectedGoal.completedHours);
        const remainingMinutes = Math.ceil(remainingHours * 60);
        if (remainingMinutes > 0) {
          setCustomMinutes(remainingMinutes);
          setTimeLeft(remainingMinutes * 60);
        }
      }
      setSessionStartTime(null);
      setExpectedEndTime(null);
    }
  }, [goalId, goals, isInitialized]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive && expectedEndTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.round((expectedEndTime - Date.now()) / 1000));
        setTimeLeft(remaining);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      if (isCompletingRef.current) return;
      isCompletingRef.current = true;
      
      setIsActive(false);
      setExpectedEndTime(null);
      
      const completeSession = async () => {
        if (subjectId && sessionStartTime) {
          setStatus(null);
          try {
            await addSession({
              subjectId,
              startTime: sessionStartTime.toISOString(),
              endTime: new Date().toISOString(),
              durationMinutes: customMinutes,
              type: 'pomodoro',
            });
            
            if (goalId) {
              try {
                const hours = customMinutes / 60;
                await updateGoalProgress(goalId, hours);
                setStatus({ type: 'success', message: 'Session completed and goal progress updated!' });
              } catch (goalError) {
                console.error('Goal update failed', goalError);
                setStatus({ type: 'warning', message: 'Session saved, but failed to update Goal progress.' });
              }
            } else {
              setStatus({ type: 'success', message: 'Session completed and saved successfully!' });
            }
            clearDraft();
          } catch (e) {
            console.error('Failed to save pomodoro session', e);
            setStatus({ type: 'error', message: 'Failed to save Study Session. Please try again.' });
          } finally {
            isCompletingRef.current = false;
            setExpectedEndTime(null);
          }
        } else {
          isCompletingRef.current = false;
          setExpectedEndTime(null);
        }
      };

      completeSession();
      setTimeLeft(customMinutes * 60); 
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, subjectId, sessionStartTime, goalId, addSession, updateGoalProgress, expectedEndTime, customMinutes]);

  const toggleTimer = () => {
    if (!isActive) {
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
      }
      setExpectedEndTime(Date.now() + timeLeft * 1000);
    } else {
      setExpectedEndTime(null);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(customMinutes * 60);
    setExpectedEndTime(null);
    setSessionStartTime(null);
    setStatus(null);
    clearDraft();
  };

  const stopTimer = async () => {
    if (!sessionStartTime || !subjectId) {
      resetTimer();
      return;
    }
    
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    
    setIsActive(false);
    setExpectedEndTime(null);
    
    const elapsedSeconds = (customMinutes * 60) - timeLeft;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    
    setStatus(null);
    try {
      await addSession({
        subjectId,
        startTime: sessionStartTime.toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: elapsedMinutes,
        type: 'pomodoro',
      });
      
      if (goalId) {
        try {
          const hours = elapsedMinutes / 60;
          await updateGoalProgress(goalId, hours);
          setStatus({ type: 'success', message: 'Session stopped and goal progress updated!' });
        } catch (goalError) {
          console.error('Goal update failed', goalError);
          setStatus({ type: 'warning', message: 'Session saved, but failed to update Goal progress.' });
        }
      } else {
        setStatus({ type: 'success', message: 'Session stopped and saved successfully!' });
      }
      clearDraft();
    } catch (e) {
      console.error('Failed to save session on stop', e);
      setStatus({ type: 'error', message: 'Failed to save Study Session on stop. Please try again.' });
    } finally {
      isCompletingRef.current = false;
      setTimeLeft(customMinutes * 60);
      setExpectedEndTime(null);
      setSessionStartTime(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((customMinutes * 60 - timeLeft) / (customMinutes * 60)) * 100;

  return (
    <div className="space-y-6 pb-12 flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Study Timer</h1>
        <p className="text-[var(--text-secondary)] mt-1">Focus on your studies and automatically track time.</p>
      </div>

      <Card className="w-full max-w-md bg-[var(--card-bg)] border-[var(--border-color)]">
        <CardContent className="p-8 flex flex-col items-center">
          
          {status && (
            <div className={`w-full mb-6 p-3 rounded text-sm font-medium text-center ${
              status.type === 'success' ? 'bg-green-100 text-green-700' :
              status.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {status.message}
            </div>
          )}

          <div className="w-full mb-8">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 text-center">Select Subject to Track</label>
            <select 
              className="flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={isActive}
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full mb-8">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 text-center">Select Goal (Optional)</label>
            <select 
              className="flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              disabled={isActive}
            >
              <option value="">-- No Goal --</option>
              {goals
                .filter(g => !g.isCompleted && (!subjectId || !g.subjectId || g.subjectId === subjectId))
                .map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>

          <div className="w-full mb-8">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 text-center">Session Duration (minutes)</label>
            <input 
              type="number"
              min="1"
              className="flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50 text-center font-semibold"
              value={customMinutes}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setCustomMinutes(val);
                if (!isActive) {
                  setTimeLeft(val * 60);
                }
              }}
              disabled={isActive}
            />
          </div>

          <div className="relative h-64 w-64 rounded-full flex items-center justify-center mb-8 border-[8px] border-[var(--bg-color)] shadow-inner">
             {/* SVG styling requires exact class matching */}
             <svg className="absolute inset-0 h-full w-full transform -rotate-90">
               <circle
                 cx="120"
                 cy="120"
                 r="116"
                 className="transition-all duration-1000 ease-linear"
                 stroke="var(--color-primary)"
                 strokeWidth="8"
                 fill="none"
                 strokeDasharray={728}
                 strokeDashoffset={728 - (728 * progress) / 100}
               />
             </svg>
             <div className="text-center z-10">
               <div className="text-6xl font-bold text-[var(--text-primary)] tracking-tighter tabular-nums">
                 {formatTime(timeLeft)}
               </div>
               <p className="text-[var(--text-secondary)] mt-2 font-medium">Focus</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              size="lg" 
              className="h-14 px-8 rounded-full gap-2 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center"
              onClick={toggleTimer}
              disabled={!subjectId}
            >
              {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span>{isActive ? 'Pause' : 'Start Focus'}</span>
            </Button>
            
            <Button 
              variant="default"
              className="h-14 px-6 rounded-full gap-2 text-md shadow-lg bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90 transition-all flex items-center justify-center"
              onClick={stopTimer}
              disabled={!sessionStartTime}
              title="Stop and Save Session"
            >
              <Square className="h-4 w-4" />
              <span>Stop</span>
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              className="h-14 w-14 rounded-full"
              onClick={resetTimer}
              disabled={timeLeft === customMinutes * 60}
              title="Reset Timer"
            >
              <Timer className="h-5 w-5" />
            </Button>
          </div>
          
          {!subjectId && !isActive && timeLeft === customMinutes * 60 && (
            <p className="text-sm text-[var(--color-warning)] mt-6 flex items-center gap-2">
              <Timer className="h-4 w-4" /> Please select a subject first.
            </p>
          )}

          {/* Active Goals List */}
          {goals.filter(g => !g.isCompleted).length > 0 && (
            <div className="w-full mt-10 pt-8 border-t border-[var(--border-color)] animate-fade-in">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target className="h-4 w-4" /> Active Goals
              </h3>
              <div className="space-y-3">
                {goals.filter(g => !g.isCompleted).map(goal => {
                  const s = subjects.find(sub => sub.id === goal.subjectId);
                  const draft = savedTimers[goal.id];
                  
                  let minsLeft = 0;
                  if (draft) {
                    minsLeft = Math.ceil(draft.timeLeft / 60);
                  } else {
                    const remainingHours = Math.max(0, goal.targetHours - goal.completedHours);
                    minsLeft = Math.ceil(remainingHours * 60);
                  }
                  
                  return (
                    <div key={goal.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[var(--radius-base)] bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-colors gap-4">
                      <div>
                        <p className="font-semibold text-sm text-[var(--text-primary)]">{goal.title}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{s?.name || 'General Subject'} &bull; {minsLeft}m remaining</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {draft && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => clearDraft(goal.id)}
                            className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:text-[var(--color-error)]"
                            title="Discard Draft"
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className="h-8 text-xs font-semibold px-4"
                          onClick={() => {
                            if (draft) {
                              setGoalId(goal.id);
                              setSubjectId(draft.subjectId);
                              setCustomMinutes(draft.customMinutes);
                              setTimeLeft(draft.timeLeft);
                              setSessionStartTime(draft.sessionStartTime ? new Date(draft.sessionStartTime) : null);
                              setExpectedEndTime(draft.expectedEndTime);
                              setIsActive(draft.isActive);
                            } else {
                              setGoalId(goal.id);
                              if (goal.subjectId) setSubjectId(goal.subjectId);
                              setCustomMinutes(minsLeft);
                              setTimeLeft(minsLeft * 60);
                              setSessionStartTime(null);
                              setExpectedEndTime(null);
                              setIsActive(false);
                            }
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          {draft ? 'Resume' : 'Study'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
