import { useMemo, useState, useEffect } from 'react';
import { 
  Clock, Flame, Target, Calendar as CalendarIcon, 
  Timer, BookOpen, Play, PlusCircle, Lightbulb, X, Square, ChevronRight, Pause, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStudyData } from '../../context/StudyContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getBestStudyTime } from '../../lib/insights';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';
import { DashboardRecommendations } from '../../components/recommendations/DashboardRecommendations';
import { AIDailyPlanner } from '../../components/ai-planner/AIDailyPlanner';

export default function Dashboard() {
  const { user } = useAuth();
  const { sessions, goals, events, subjects, dailyTasks } = useStudyData();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  
  const [activeTab, setActiveTab] = useState<'activity' | 'goals'>('activity');
  const [showInsight, setShowInsight] = useState(true);

  // Mini Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [expectedEndTime, setExpectedEndTime] = useState<number | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric' 
    }));
  }, []);

  // Timer init from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('studyPulse_timers');
    if (stored) {
      try {
        const timers = JSON.parse(stored);
        const general = timers['general'];
        if (general) {
           setTimeLeft(general.timeLeft);
           if (general.isActive && general.expectedEndTime) {
              const remaining = Math.max(0, Math.round((general.expectedEndTime - Date.now()) / 1000));
              setTimeLeft(remaining);
              setIsTimerActive(true);
              setExpectedEndTime(general.expectedEndTime);
           }
        }
      } catch (e) {}
    }
  }, []);

  // Timer interval logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerActive && expectedEndTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.round((expectedEndTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          setIsTimerActive(false);
          setExpectedEndTime(null);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, expectedEndTime]);

  const toggleMiniTimer = () => {
    if (!isTimerActive) {
      const end = Date.now() + timeLeft * 1000;
      setExpectedEndTime(end);
      setIsTimerActive(true);
      
      const stored = localStorage.getItem('studyPulse_timers');
      let timers: any = {};
      if (stored) { try { timers = JSON.parse(stored); } catch (e) {} }
      timers['general'] = {
        ...(timers['general'] || { goalId: 'general', subjectId: '', customMinutes: 25 }),
        timeLeft,
        isActive: true,
        expectedEndTime: end,
        lastUpdated: Date.now()
      };
      localStorage.setItem('studyPulse_timers', JSON.stringify(timers));
    } else {
      setIsTimerActive(false);
      setExpectedEndTime(null);
      
      const stored = localStorage.getItem('studyPulse_timers');
      if (stored) {
        try {
          const timers = JSON.parse(stored);
          if (timers['general']) {
            timers['general'].isActive = false;
            timers['general'].expectedEndTime = null;
            timers['general'].timeLeft = timeLeft;
            localStorage.setItem('studyPulse_timers', JSON.stringify(timers));
          }
        } catch (e) {}
      }
    }
  };

  const resetMiniTimer = () => {
    setIsTimerActive(false);
    setTimeLeft(25 * 60);
    setExpectedEndTime(null);
    const stored = localStorage.getItem('studyPulse_timers');
    if (stored) {
      try {
        const timers = JSON.parse(stored);
        if (timers['general']) {
          timers['general'].isActive = false;
          timers['general'].expectedEndTime = null;
          timers['general'].timeLeft = 25 * 60;
          localStorage.setItem('studyPulse_timers', JSON.stringify(timers));
        }
      } catch (e) {}
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const todaySessions = sessions.filter(s => s.startTime.startsWith(todayStr));
    const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const todayStudyTime = `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`;
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdaySessions = sessions.filter(s => s.startTime.startsWith(yesterdayStr));
    const yesterdayMinutes = yesterdaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const diffMinutes = todayMinutes - yesterdayMinutes;
    const diffText = diffMinutes > 0 
      ? `+${diffMinutes}m compared with yesterday`
      : diffMinutes < 0 ? `${diffMinutes}m compared with yesterday` : 'Same as yesterday';

    let streak = 0;
    const uniqueDays = [...new Set(sessions.map(s => s.startTime.split('T')[0]))].sort().reverse();
    let currentCheck = new Date(todayStr);
    
    if (uniqueDays.includes(todayStr)) {
      streak = 1;
      currentCheck.setDate(currentCheck.getDate() - 1);
    }
    
    for (let i = 0; i < uniqueDays.length; i++) {
       const day = uniqueDays[i];
       const checkStr = currentCheck.toISOString().split('T')[0];
       if (day === checkStr) {
         if (streak === 0) streak = 1;
         else streak++;
         currentCheck.setDate(currentCheck.getDate() - 1);
       } else if (day > checkStr) {
         continue;
       } else {
         break;
       }
    }
    if(streak === 0 && uniqueDays.includes(todayStr)) streak = 1;

    const totalGoalHours = goals.reduce((acc, g) => acc + g.targetHours, 0);
    const totalCompletedHours = goals.reduce((acc, g) => acc + g.completedHours, 0);
    const goalsProgress = totalGoalHours === 0 ? 0 : Math.round((totalCompletedHours / totalGoalHours) * 100);
    
    const completedGoalsCount = goals.filter(g => g.isCompleted).length;
    const totalGoalsCount = goals.length;
    
    const focusScore = Math.min(100, Math.floor(todayMinutes / 6) * 5);
    const focusHours = (todayMinutes / 60).toFixed(1);

    const recentSessions = [...sessions].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 4);

    const activeGoals = [...goals].filter(g => !g.isCompleted).sort((a,b) => a.deadline.localeCompare(b.deadline)).slice(0, 3);
    
    const upcomingEvents = [...events].filter(e => e.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 4);
    
    const nextDeadline = [...events].filter(e => ['exam', 'assignment'].includes(e.type) && e.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date))[0];
    
    let deadlineDays = -1;
    if (nextDeadline) {
      const deadlineDate = new Date(nextDeadline.date);
      const todayDate = new Date(todayStr);
      deadlineDays = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 3600 * 24));
    }

    const bestTimeInsight = getBestStudyTime(sessions);
    const todayTasks = (dailyTasks || []).filter(t => t.date === todayStr);

    return {
      todayStudyTime,
      studyStreak: streak,
      goalsProgress,
      focusScore,
      focusHours,
      recentSessions,
      upcomingEvents,
      activeGoals,
      diffText,
      goalsText: totalGoalsCount > 0 ? `${completedGoalsCount} of ${totalGoalsCount} goals completed` : 'No goals yet',
      nextDeadline,
      deadlineDays,
      bestTimeInsight,
      todayTasks
    };
  }, [sessions, goals, events, dailyTasks]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-8 pb-12"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* HEADER & QUICK ACTIONS */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">{currentDate}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
            {greeting}, {user?.name || profile.name || 'Student'} <span className="inline-block origin-bottom-right hover:animate-wave">👋</span>
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 text-lg">Ready to make progress today?</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2 shrink-0 bg-[var(--card-bg)] shadow-sm hover:border-[var(--color-primary)] transition-colors" onClick={() => navigate('/dashboard/subjects')}>
            <PlusCircle className="h-4 w-4 text-purple-500" />
            <span className="hidden sm:inline">Add Subject</span>
          </Button>
          <Button variant="outline" className="gap-2 shrink-0 bg-[var(--card-bg)] shadow-sm hover:border-[var(--color-primary)] transition-colors" onClick={() => navigate('/dashboard/sessions')}>
            <Play className="h-4 w-4 text-blue-500" />
            <span className="hidden sm:inline">Start Session</span>
          </Button>
          <Button variant="outline" className="gap-2 shrink-0 bg-[var(--card-bg)] shadow-sm hover:border-[var(--color-primary)] transition-colors" onClick={() => navigate('/dashboard/goals')}>
            <Target className="h-4 w-4 text-emerald-500" />
            <span className="hidden sm:inline">Add Goal</span>
          </Button>
          <Button variant="outline" className="gap-2 shrink-0 bg-[var(--card-bg)] shadow-sm hover:border-[var(--color-primary)] transition-colors" onClick={() => navigate('/dashboard/calendar')}>
            <CalendarIcon className="h-4 w-4 text-pink-500" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
        </div>
      </motion.div>

      {/* AI DAILY PLANNER */}
      <motion.div variants={itemVariants}>
        <AIDailyPlanner />
      </motion.div>

      {/* SMART RECOMMENDATIONS */}
      <motion.div variants={itemVariants}>
        <DashboardRecommendations />
      </motion.div>

      {/* MAIN CONTENT + SMART SIDEBAR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* MAIN CONTENT (~65%) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* KPI Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3 mb-3">
                 <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                   <Clock className="h-4 w-4" />
                 </div>
                 <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Study Time</p>
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{stats.todayStudyTime}</h3>
                 <p className="text-xs text-[var(--text-secondary)] mt-1 truncate" title={stats.diffText}>{stats.diffText}</p>
               </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3 mb-3">
                 <div className="p-1.5 rounded-lg bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                   <Flame className="h-4 w-4" />
                 </div>
                 <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Streak</p>
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{stats.studyStreak} <span className="text-sm font-medium text-[var(--text-secondary)]">days</span></h3>
                 <p className="text-xs text-[var(--text-secondary)] mt-1">Keep it going!</p>
               </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3 mb-3">
                 <div className="p-1.5 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)]">
                   <Target className="h-4 w-4" />
                 </div>
                 <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Goals</p>
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{stats.goalsProgress}%</h3>
                 <p className="text-xs text-[var(--text-secondary)] mt-1 truncate" title={stats.goalsText}>{stats.goalsText}</p>
               </div>
            </Card>
          </motion.div>

          {/* Learning Insight Banner */}
          <AnimatePresence>
            {showInsight && stats.bestTimeInsight.value !== 'Not enough data' && (
              <motion.div 
                variants={itemVariants} 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              >
                <div className="flex items-center justify-between p-4 rounded-[var(--radius-card)] bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                      <Lightbulb className="h-5 w-5 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">Learning Insight</h4>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">{stats.bestTimeInsight.value}. {stats.bestTimeInsight.description}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowInsight(false)} className="h-8 w-8 rounded-full hover:bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabbed Widget: Activity & Goals */}
          <motion.div variants={itemVariants} className="flex-1">
            <Card className="h-full flex flex-col shadow-soft border-[var(--border-color)]">
              <div className="flex border-b border-[var(--border-color)] px-2 pt-2 bg-[var(--bg-main)]/50 rounded-t-[calc(var(--radius-card)-1px)]" role="tablist">
                <button 
                  className={`flex-1 py-3 px-4 text-sm font-bold transition-all relative ${activeTab === 'activity' ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  onClick={() => setActiveTab('activity')}
                  role="tab"
                  aria-selected={activeTab === 'activity'}
                >
                  Activity
                  {activeTab === 'activity' && (
                    <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
                  )}
                </button>
                <button 
                  className={`flex-1 py-3 px-4 text-sm font-bold transition-all relative ${activeTab === 'goals' ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  onClick={() => setActiveTab('goals')}
                  role="tab"
                  aria-selected={activeTab === 'goals'}
                >
                  Goals
                  {activeTab === 'goals' && (
                    <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
                  )}
                </button>
              </div>
              
              <CardContent className="p-0 flex-1 relative min-h-[350px]">
                {activeTab === 'activity' ? (
                  <motion.div 
                    key="activity"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col h-full absolute inset-0"
                  >
                    {stats.recentSessions.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-[var(--border-color)]/30 flex items-center justify-center mb-3">
                          <BookOpen className="h-6 w-6 text-[var(--text-secondary)]" />
                        </div>
                        <p className="text-[var(--text-primary)] font-medium mb-1">No study sessions yet</p>
                        <Link to="/dashboard/sessions" className="text-sm text-[var(--color-primary)] hover:underline">Start your first study session &rarr;</Link>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                          {stats.recentSessions.map(session => {
                            const sub = subjects.find(s => s.id === session.subjectId);
                            return (
                              <div key={session.id} className="flex items-center justify-between p-4 rounded-[var(--radius-base)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--color-primary)]/50 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${sub?.color || '#3B82F6'}15`, color: sub?.color || '#3B82F6' }}>
                                    <BookOpen className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-[var(--text-primary)]">{sub?.name || 'Unknown'}</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                      {new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-sm font-bold bg-[var(--bg-color)] px-3 py-1 rounded-full border border-[var(--border-color)] text-[var(--text-primary)] shrink-0">
                                  {session.durationMinutes}m
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="p-4 border-t border-[var(--border-color)] mt-auto bg-[var(--bg-main)]/50 rounded-b-[calc(var(--radius-card)-1px)]">
                          <Link to="/dashboard/sessions">
                            <Button variant="ghost" className="w-full text-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 font-medium gap-2">
                              View all activity <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="goals"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col h-full absolute inset-0"
                  >
                    {stats.activeGoals.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-[var(--border-color)]/30 flex items-center justify-center mb-3">
                          <Target className="h-6 w-6 text-[var(--text-secondary)]" />
                        </div>
                        <p className="text-[var(--text-primary)] font-medium mb-1">No active goals</p>
                        <Link to="/dashboard/goals" className="text-sm text-[var(--color-primary)] hover:underline">Create your first goal &rarr;</Link>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                          {stats.activeGoals.map(goal => {
                            const progress = goal.targetHours > 0 ? Math.min(100, Math.round((goal.completedHours / goal.targetHours) * 100)) : 0;
                            const sub = subjects.find(s => s.id === goal.subjectId);
                            return (
                              <div key={goal.id} className="p-4 rounded-[var(--radius-base)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--color-primary)]/50 transition-colors space-y-3">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <p className="text-sm font-bold text-[var(--text-primary)] line-clamp-1">{goal.title}</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{sub?.name || 'General Goal'}</p>
                                  </div>
                                  <div className="text-sm font-bold text-[var(--color-primary)] shrink-0">{progress}%</div>
                                </div>
                                <div className="h-2 w-full bg-[var(--border-color)]/50 rounded-full overflow-hidden">
                                  <div className="h-full bg-[var(--color-success)] rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="p-4 border-t border-[var(--border-color)] mt-auto bg-[var(--bg-main)]/50 rounded-b-[calc(var(--radius-card)-1px)]">
                          <Link to="/dashboard/goals">
                            <Button variant="ghost" className="w-full text-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 font-medium gap-2">
                              View all goals <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* SMART SIDEBAR (~35%) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Mini Study Timer */}
          <motion.div variants={itemVariants}>
            <Card className="border-[var(--color-primary)]/20 shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--text-secondary)]">
                  <Timer className="h-4 w-4" /> Focus Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-2 pb-6">
                <div className="text-6xl font-extrabold tracking-tighter tabular-nums mb-6 text-[var(--text-primary)]">
                  {formatTime(timeLeft)}
                </div>
                <div className="flex w-full gap-3 mb-6">
                  <Button 
                    onClick={toggleMiniTimer} 
                    className={`flex-1 h-12 text-sm font-bold shadow-sm transition-all ${isTimerActive ? 'bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90 text-white' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white'}`}
                  >
                    {isTimerActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {isTimerActive ? 'Pause' : 'Start Focus'}
                  </Button>
                  <Button 
                    onClick={resetMiniTimer} 
                    variant="outline" 
                    className="h-12 w-12 shrink-0 border-[var(--border-color)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] hover:border-[var(--color-error)]/30 transition-colors"
                    title="Reset Timer"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
                <Link to="/dashboard/pomodoro" className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--color-primary)] flex items-center gap-1 transition-colors">
                  Open full timer <ChevronRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div variants={itemVariants} className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col shadow-soft border-[var(--border-color)]">
              <CardHeader className="pb-4 border-b border-[var(--border-color)]">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--text-secondary)]">
                  <CalendarIcon className="h-4 w-4" /> Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-[250px]">
                {stats.upcomingEvents.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">No upcoming deadlines</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 p-5 space-y-4">
                      {stats.upcomingEvents.map(event => {
                        const eventDate = new Date(event.date);
                        const isUrgent = (eventDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 3;
                        
                        return (
                          <div key={event.id} className="flex items-start gap-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isUrgent ? 'bg-[var(--color-error)]/10 text-[var(--color-error)]' : 'bg-[var(--bg-main)] text-[var(--color-primary)]'}`}>
                              <CalendarIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-sm font-bold text-[var(--text-primary)] truncate">{event.title}</p>
                              <p className={`text-xs font-medium mt-0.5 ${isUrgent ? 'text-[var(--color-error)]' : 'text-[var(--text-secondary)]'}`}>
                                {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {isUrgent && ' (Soon)'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-4 border-t border-[var(--border-color)] mt-auto bg-[var(--bg-main)]/50 rounded-b-[calc(var(--radius-card)-1px)]">
                      <Link to="/dashboard/calendar" className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center justify-center gap-1">
                        View calendar <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Tasks */}
          <motion.div variants={itemVariants} className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col shadow-soft border-[var(--border-color)]">
              <CardHeader className="pb-4 border-b border-[var(--border-color)]">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--text-secondary)]">
                  <CheckCircle className="h-4 w-4" /> Today's Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-[250px]">
                {stats.todayTasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">No tasks for today</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Ready to plan your day?</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 p-5 space-y-4">
                      {stats.todayTasks.slice(0, 4).map(task => (
                        <div key={task.id} className="flex items-start gap-3">
                          <div className={`mt-0.5 shrink-0 ${task.completed ? 'text-[var(--color-success)]' : 'text-[var(--text-secondary)]'}`}>
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${task.completed ? 'text-[var(--text-secondary)] line-through' : 'text-[var(--text-primary)]'}`}>
                              {task.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-[var(--border-color)] mt-auto bg-[var(--bg-main)]/50 rounded-b-[calc(var(--radius-card)-1px)]">
                      <Link to="/dashboard/tasks" className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center justify-center gap-1">
                        Manage daily tasks <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
