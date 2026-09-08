import { useState, useEffect, useRef } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Play, Pause, Square, Timer, Target, Search, BookOpen } from 'lucide-react';

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

  // Search state for subjects
  const [subjectSearch, setSubjectSearch] = useState('');
  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase()));

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
    
    try {
      const durationElapsed = customMinutes * 60 - timeLeft;
      const actualMinutes = Math.max(1, Math.round(durationElapsed / 60));
      
      await addSession({
        subjectId,
        startTime: sessionStartTime.toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: actualMinutes,
        type: 'pomodoro',
      });

      if (goalId) {
        try {
          const hours = actualMinutes / 60;
          await updateGoalProgress(goalId, hours);
          setStatus({ type: 'success', message: `Stopped early. Session saved (${actualMinutes}m) and goal updated.` });
        } catch (goalError) {
          setStatus({ type: 'warning', message: `Stopped early. Session saved (${actualMinutes}m), but failed to update Goal.` });
        }
      } else {
        setStatus({ type: 'success', message: `Stopped early. Session saved (${actualMinutes}m).` });
      }
      
      clearDraft();
    } catch (e) {
      console.error('Failed to save manual stop session', e);
      setStatus({ type: 'error', message: 'Failed to save Study Session.' });
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
  
  const selectedSubjectObj = subjects.find(s => s.id === subjectId);
  const selectedGoalObj = goals.find(g => g.id === goalId);
  
  let timerStatus = 'Ready to Focus';
  if (isActive) timerStatus = 'Focusing';
  else if (sessionStartTime && timeLeft > 0) timerStatus = 'Paused';
  else if (sessionStartTime && timeLeft === 0) timerStatus = 'Completed';

  const availableGoals = goals.filter(g => !g.isCompleted && (!subjectId || !g.subjectId || g.subjectId === subjectId));
  const quickDurations = [15, 25, 45, 60];

  const activeGoalsList = goals.filter(g => !g.isCompleted);
  const hasActiveGoalsOrDrafts = activeGoalsList.length > 0 || Object.keys(savedTimers).length > 0;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Study Timer</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-lg">Set up your environment and start focusing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 items-start">
        
        {/* LEFT COLUMN: ACTIVE TIMER */}
        <div className="flex flex-col">
          <Card className="w-full bg-[var(--card-bg)] border-[var(--border-color)] shadow-lg sticky top-6">
            <CardContent className="p-6 sm:p-8 flex flex-col items-center">
               
               {/* Status Pill */}
               <div className={`mb-8 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isActive ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                  <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-[var(--color-warning)] animate-pulse' : 'bg-[var(--color-primary)]'}`}></span>
                  {timerStatus}
               </div>

               {/* Compact Timer Ring */}
               <div className="relative h-48 w-48 rounded-full flex items-center justify-center mb-8 border-[6px] border-[var(--bg-main)] shadow-inner">
                 <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                   <circle
                     cx="96"
                     cy="96"
                     r="90"
                     className="transition-all duration-1000 ease-linear"
                     stroke="var(--color-primary)"
                     strokeWidth="6"
                     fill="none"
                     strokeDasharray={565.48}
                     strokeDashoffset={565.48 - (565.48 * progress) / 100}
                   />
                 </svg>
                 <div className="text-center z-10">
                   <div className="text-5xl font-extrabold text-[var(--text-primary)] tracking-tighter tabular-nums">
                     {formatTime(timeLeft)}
                   </div>
                 </div>
               </div>

               {/* Selected Configuration Context */}
               <div className="w-full text-center mb-8 space-y-1.5 min-h-[60px] flex flex-col justify-center">
                 {subjectId ? (
                   <>
                     <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedSubjectObj?.name}</h3>
                     {selectedGoalObj && <p className="text-sm font-semibold text-[var(--text-secondary)] flex items-center justify-center gap-1.5"><Target className="h-3.5 w-3.5" /> {selectedGoalObj.title}</p>}
                   </>
                 ) : (
                   <p className="text-sm font-medium text-[var(--text-secondary)] italic">Please select a subject to begin</p>
                 )}
               </div>

               {/* Controls */}
               <div className="flex w-full gap-3">
                 <Button 
                   className={`flex-1 h-14 text-lg font-bold shadow-md transition-all ${isActive ? 'bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90 text-white' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white'}`}
                   onClick={toggleTimer}
                   disabled={!subjectId}
                   aria-pressed={isActive}
                 >
                   {isActive ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                   {isActive ? 'Pause' : (sessionStartTime ? 'Resume' : 'Start Focus')}
                 </Button>
                 
                 {sessionStartTime && (
                   <Button 
                     variant="danger"
                     className="h-14 px-5 bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90 shadow-md transition-all"
                     onClick={stopTimer}
                     title="Stop and Save Session"
                   >
                     <Square className="h-5 w-5" />
                   </Button>
                 )}

                 {!sessionStartTime && (
                   <Button 
                     variant="outline"
                     className="h-14 w-14 p-0 shrink-0 border-[var(--border-color)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] hover:border-[var(--color-error)]/30 transition-colors"
                     onClick={resetTimer}
                     disabled={timeLeft === customMinutes * 60}
                     title="Reset Timer"
                   >
                     <Timer className="h-5 w-5" />
                   </Button>
                 )}
               </div>

               {status && (
                  <div className={`w-full mt-6 p-3 rounded-lg text-sm font-bold text-center ${
                    status.type === 'success' ? 'bg-green-100 text-green-700' :
                    status.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {status.message}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: SETUP & GOALS */}
        <div className="flex flex-col gap-8">
          
          {/* SETUP CARD */}
          <Card className="w-full bg-[var(--card-bg)] border-[var(--border-color)] shadow-soft">
            <CardHeader className="pb-4 border-b border-[var(--border-color)]">
              <CardTitle className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                Session Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              
              {/* 1. Subject */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-[var(--text-primary)]">1. Select Subject</label>
                {subjects.length > 8 && (
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                    <input 
                      type="text" 
                      placeholder="Search subjects..." 
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg pl-9 pr-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      disabled={isActive}
                    />
                  </div>
                )}
                {subjects.length === 0 ? (
                  <p className="text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-main)] p-4 rounded-lg border border-dashed border-[var(--border-color)] text-center">
                    No subjects yet. Add a subject from the dashboard to start studying.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 pb-2">
                    {filteredSubjects.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">No subjects found.</p> : null}
                    {filteredSubjects.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSubjectId(s.id); setGoalId(''); }}
                        disabled={isActive}
                        aria-pressed={subjectId === s.id}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border disabled:opacity-50 ${subjectId === s.id ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md' : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--color-primary)]/50 hover:text-[var(--text-primary)]'}`}
                      >
                        {s.name} {subjectId === s.id && '✓'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Goal */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-[var(--text-primary)]">2. Select Goal (Optional)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 pb-2">
                  <button 
                    onClick={() => setGoalId('')}
                    disabled={isActive || !subjectId}
                    aria-pressed={!goalId}
                    className={`p-4 rounded-xl border text-left transition-all disabled:opacity-50 ${!goalId ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-primary)]' : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--color-primary)]/50'}`}
                  >
                    <p className={`text-sm font-bold ${!goalId ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]'}`}>No specific goal</p>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">General study session</p>
                  </button>
                  {availableGoals.map(g => {
                    const progress = g.targetHours > 0 ? Math.min(100, Math.round((g.completedHours / g.targetHours) * 100)) : 0;
                    return (
                      <button
                        key={g.id}
                        onClick={() => {
                          setGoalId(g.id);
                          if (g.subjectId) setSubjectId(g.subjectId);
                        }}
                        disabled={isActive || (!subjectId && g.subjectId !== subjectId)}
                        aria-pressed={goalId === g.id}
                        className={`p-4 rounded-xl border text-left transition-all disabled:opacity-50 ${goalId === g.id ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-primary)]' : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--color-primary)]/50'}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <p className={`text-sm font-bold line-clamp-2 pr-2 ${goalId === g.id ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]'}`}>{g.title}</p>
                          <span className="text-xs font-bold text-[var(--text-secondary)] shrink-0">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--border-color)]/50 rounded-full overflow-hidden">
                           <div className="h-full bg-[var(--color-success)] rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Duration */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-[var(--text-primary)]">3. Duration</label>
                <div className="flex flex-wrap items-center gap-3">
                  {quickDurations.map(d => (
                    <button
                      key={d}
                      onClick={() => {
                         setCustomMinutes(d);
                         if (!isActive) setTimeLeft(d * 60);
                      }}
                      disabled={isActive}
                      aria-pressed={customMinutes === d}
                      className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all border disabled:opacity-50 ${customMinutes === d ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md' : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--color-primary)]/50 hover:text-[var(--text-primary)]'}`}
                    >
                      {d}m {customMinutes === d && '✓'}
                    </button>
                  ))}
                  
                  <div className="flex items-center gap-2 ml-auto bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-color)] focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all">
                    <span className="text-sm font-semibold text-[var(--text-secondary)] pl-3">Custom:</span>
                    <input 
                      type="number"
                      min="1"
                      value={customMinutes}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val) || val < 1) val = 1;
                        setCustomMinutes(val);
                        if (!isActive) setTimeLeft(val * 60);
                      }}
                      disabled={isActive}
                      className="w-16 px-2 py-1.5 text-sm font-bold text-center bg-transparent border-none focus:outline-none focus:ring-0 text-[var(--text-primary)]"
                    />
                    <span className="text-sm font-semibold text-[var(--text-secondary)] pr-3">min</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* ACTIVE GOALS & DRAFTS */}
          <Card className="w-full bg-[var(--card-bg)] border-[var(--border-color)] shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Active Goals & Drafts
              </h3>
            </div>
            <CardContent className="p-0">
              {!hasActiveGoalsOrDrafts ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">No active goals or drafts.</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-color)] max-h-96 overflow-y-auto">
                  {/* General Draft (if exists and no goal draft) */}
                  {savedTimers['general'] && (
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-main)]/30 transition-colors">
                      <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1.5">
                           <Pause className="h-4 w-4 text-[var(--color-warning)]" />
                           <p className="font-bold text-sm text-[var(--text-primary)]">General Session</p>
                         </div>
                         <div className="flex items-center gap-3 text-xs font-semibold text-[var(--text-secondary)]">
                           <span>{subjects.find(s => s.id === savedTimers['general'].subjectId)?.name || 'No Subject'}</span>
                           <span className="w-1 h-1 rounded-full bg-[var(--border-color)]"></span>
                           <span className="text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-2 py-0.5 rounded-full">{Math.ceil(savedTimers['general'].timeLeft / 60)}m remaining</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => clearDraft('general')}
                           className="h-9 px-3 text-[var(--text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 hover:border-[var(--color-error)]/30 transition-colors"
                         >
                           Discard
                         </Button>
                         <Button 
                           size="sm" 
                           className="h-9 px-5 font-bold bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90 text-white transition-colors shadow-sm"
                           onClick={() => {
                             const draft = savedTimers['general'];
                             setGoalId('');
                             setSubjectId(draft.subjectId);
                             setCustomMinutes(draft.customMinutes);
                             setTimeLeft(draft.timeLeft);
                             setSessionStartTime(draft.sessionStartTime ? new Date(draft.sessionStartTime) : null);
                             setExpectedEndTime(draft.expectedEndTime);
                             setIsActive(draft.isActive);
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                           }}
                         >
                           Resume
                         </Button>
                      </div>
                    </div>
                  )}

                  {/* Goal Drafts and Goals */}
                  {activeGoalsList.map(goal => {
                     const s = subjects.find(sub => sub.id === goal.subjectId);
                     const draft = savedTimers[goal.id];
                     
                     let minsLeft = 0;
                     if (draft) {
                       minsLeft = Math.ceil(draft.timeLeft / 60);
                     } else {
                       const remainingHours = Math.max(0, goal.targetHours - goal.completedHours);
                       minsLeft = Math.ceil(remainingHours * 60);
                     }
                     const progress = goal.targetHours > 0 ? Math.min(100, Math.round((goal.completedHours / goal.targetHours) * 100)) : 0;
                     
                     return (
                       <div key={goal.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-main)]/30 transition-colors">
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1.5">
                             {draft ? <Pause className="h-4 w-4 text-[var(--color-warning)]" /> : <Target className="h-4 w-4 text-[var(--color-success)]" />}
                             <p className="font-bold text-sm text-[var(--text-primary)]">{goal.title}</p>
                           </div>
                           <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--text-secondary)]">
                             <span>{s?.name || 'General'}</span>
                             <span className="w-1 h-1 rounded-full bg-[var(--border-color)]"></span>
                             <span className={draft ? 'text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-2 py-0.5 rounded-full' : ''}>{minsLeft}m remaining</span>
                             {!draft && (
                               <>
                                 <span className="w-1 h-1 rounded-full bg-[var(--border-color)] hidden sm:inline"></span>
                                 <span className="hidden sm:inline">{progress}% complete</span>
                               </>
                             )}
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-2 shrink-0">
                           {draft && (
                             <Button 
                               size="sm" 
                               variant="outline"
                               onClick={() => clearDraft(goal.id)}
                               className="h-9 px-3 text-[var(--text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 hover:border-[var(--color-error)]/30 transition-colors"
                               title="Discard Draft"
                             >
                               Discard
                             </Button>
                           )}
                           <Button 
                             size="sm" 
                             className={`h-9 px-5 font-bold shadow-sm transition-colors ${draft ? 'bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90 text-white' : 'bg-[var(--bg-color)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
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
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
