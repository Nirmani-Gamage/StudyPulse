import { useState, useEffect, useRef } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Play, Pause, Square, Timer } from 'lucide-react';

export default function Pomodoro() {
  const { subjects, goals, addSession, updateGoalProgress } = useStudyData();
  const [subjectId, setSubjectId] = useState('');
  const [goalId, setGoalId] = useState('');
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  const [status, setStatus] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);
  const isCompletingRef = useRef(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      if (isCompletingRef.current) return;
      isCompletingRef.current = true;
      
      setIsActive(false);
      
      const completeSession = async () => {
        if (subjectId && sessionStartTime) {
          setStatus(null);
          try {
            await addSession({
              subjectId,
              startTime: sessionStartTime.toISOString(),
              endTime: new Date().toISOString(),
              durationMinutes: 25,
              type: 'pomodoro',
            });
            
            if (goalId) {
              try {
                const hours = 25 / 60;
                await updateGoalProgress(goalId, hours);
                setStatus({ type: 'success', message: 'Session completed and goal progress updated!' });
              } catch (goalError) {
                console.error('Goal update failed', goalError);
                setStatus({ type: 'warning', message: 'Session saved, but failed to update Goal progress.' });
              }
            } else {
              setStatus({ type: 'success', message: 'Session completed and saved successfully!' });
            }
          } catch (e) {
            console.error('Failed to save pomodoro session', e);
            setStatus({ type: 'error', message: 'Failed to save Study Session. Please try again.' });
          } finally {
            isCompletingRef.current = false;
          }
        } else {
          isCompletingRef.current = false;
        }
      };

      completeSession();
      setTimeLeft(25 * 60); 
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, subjectId, sessionStartTime, goalId, addSession, updateGoalProgress]);

  const toggleTimer = () => {
    if (!isActive && !sessionStartTime) {
      setSessionStartTime(new Date());
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setSessionStartTime(null);
    setStatus(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="space-y-6 pb-12 flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Pomodoro Timer</h1>
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
              className="h-14 px-8 rounded-full gap-2 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
              onClick={toggleTimer}
              disabled={!subjectId && !isActive && timeLeft === 25 * 60}
            >
              {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {isActive ? 'Pause' : 'Start Focus'}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-14 w-14 rounded-full"
              onClick={resetTimer}
              disabled={timeLeft === 25 * 60}
              title="Reset Timer"
            >
              <Square className="h-5 w-5" />
            </Button>
          </div>
          
          {!subjectId && !isActive && timeLeft === 25 * 60 && (
            <p className="text-sm text-[var(--color-warning)] mt-6 flex items-center gap-2">
              <Timer className="h-4 w-4" /> Please select a subject first.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
