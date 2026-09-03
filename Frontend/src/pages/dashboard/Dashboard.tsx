import { useMemo, useState, useEffect } from 'react';
import { 
  Clock, Flame, Target, Zap, Calendar as CalendarIcon, 
  Timer, BookOpen, AlertCircle, Play, PlusCircle, BarChart2, Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStudyData } from '../../context/StudyContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBestStudyTime } from '../../lib/insights';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { sessions, goals, events, subjects } = useStudyData();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric' 
    }));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const todaySessions = sessions.filter(s => s.startTime.startsWith(todayStr));
    const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const todayStudyTime = `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`;
    
    // Calculate yesterday for comparison
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

    return {
      todayStudyTime,
      studyStreak: streak,
      goalsProgress,
      focusScore,
      recentSessions,
      upcomingEvents,
      activeGoals,
      diffText,
      goalsText: totalGoalsCount > 0 ? `${completedGoalsCount} of ${totalGoalsCount} goals completed` : 'No goals yet',
      nextDeadline,
      deadlineDays,
      bestTimeInsight
    };
  }, [sessions, goals, events]);

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

  const getEventColor = (type: string) => {
    switch (type) {
      case 'exam': return 'text-[var(--color-error)] bg-[var(--color-error)]/10';
      case 'assignment': return 'text-[var(--color-warning)] bg-[var(--color-warning)]/10';
      case 'study': return 'text-[var(--color-primary)] bg-[var(--color-primary)]/10';
      case 'goal': return 'text-[var(--color-success)] bg-[var(--color-success)]/10';
      default: return 'text-[var(--text-secondary)] bg-[var(--bg-color)]';
    }
  };

  return (
    <motion.div 
      className="space-y-8 pb-12"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Greeting Section */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
        <p className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">{currentDate}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          {greeting}, {user?.name || profile.name || 'Student'} <span className="inline-block origin-bottom-right hover:animate-wave">👋</span>
        </h1>
        <p className="text-[var(--text-secondary)] mt-1 text-lg">Ready to make progress today?</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Today's Study Time</p>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">{stats.todayStudyTime}</h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-4">{stats.diffText}</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Study Streak</p>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">{stats.studyStreak} days</h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[var(--color-warning)]/10 flex items-center justify-center text-[var(--color-warning)]">
                  <Flame className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-4">
                {stats.studyStreak > 0 ? "Keep it going!" : "Start a session today!"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Goals Progress</p>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">{stats.goalsProgress}%</h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)]">
                  <Target className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-4">{stats.goalsText}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Focus Score</p>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">{stats.focusScore}/100</h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                  <Zap className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-4">
                {stats.focusScore >= 80 ? "Great focus today!" : stats.focusScore >= 50 ? "Good effort today" : "Room for more focus"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Learning Insight Preview */}
      <motion.div variants={itemVariants}>
        <Card className="border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] shrink-0">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Learning Insight 💡</h4>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{stats.bestTimeInsight.value} {stats.bestTimeInsight.description}</p>
              </div>
            </div>
            <Link to="/dashboard/analytics">
              <Button variant="outline" size="sm" className="shrink-0 w-full sm:w-auto">View All Insights</Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { icon: Play, label: 'Start Session', path: '/dashboard/sessions', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: Timer, label: 'Start Timer', path: '/dashboard/pomodoro', color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { icon: PlusCircle, label: 'Add Subject', path: '/dashboard/subjects', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { icon: Target, label: 'Add Goal', path: '/dashboard/goals', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { icon: CalendarIcon, label: 'Open Calendar', path: '/dashboard/calendar', color: 'text-pink-500', bg: 'bg-pink-500/10' },
            { icon: BarChart2, label: 'View Analytics', path: '/dashboard/analytics', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          ].map((action, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center justify-center gap-3 p-4 rounded-[var(--radius-card)] bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-colors shadow-soft focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-color)]"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${action.bg} ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)] text-center">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <motion.div variants={itemVariants} className="flex h-full">
          <Card className="w-full flex flex-col">
            <CardHeader className="border-b border-[var(--border-color)] pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-[var(--color-primary)]" /> Recent Sessions</CardTitle>
              <Link to="/dashboard/sessions">
                <Button variant="ghost" size="sm" className="h-8 text-[var(--color-primary)] -mr-2 text-xs font-medium">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {stats.recentSessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
                  <div className="h-12 w-12 rounded-full bg-[var(--border-color)]/30 flex items-center justify-center mb-3">
                    <BookOpen className="h-6 w-6 text-[var(--text-secondary)]" />
                  </div>
                  <p className="text-[var(--text-primary)] font-medium mb-1">No study sessions yet</p>
                  <p className="text-[var(--text-secondary)] text-sm">Start your first study session to begin tracking your progress.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border-color)] flex-1">
                  {stats.recentSessions.map((session) => {
                    const subject = subjects.find(s => s.id === session.subjectId);
                    const isToday = session.startTime.startsWith(new Date().toISOString().split('T')[0]);
                    const startTime = new Date(session.startTime);
                    const dateText = isToday ? 'Today' : startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const timeText = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    
                    const now = new Date();
                    const endTime = new Date(startTime.getTime() + session.durationMinutes * 60000);
                    let statusText = 'Completed';
                    let statusColor = 'text-[var(--color-success)]';
                    
                    if (now < startTime) {
                      statusText = 'Scheduled';
                      statusColor = 'text-[var(--color-primary)]';
                    } else if (now >= startTime && now <= endTime) {
                      statusText = 'In Progress';
                      statusColor = 'text-[var(--color-warning)]';
                    }
                    
                    return (
                      <li key={session.id} className="p-4 hover:bg-[var(--bg-color)]/50 transition-colors flex items-center justify-between group">
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-[var(--text-primary)] text-sm">{subject?.name || 'Unknown Subject'}</p>
                          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <span>{dateText} &middot; {timeText}</span>
                            <span>&bull;</span>
                            <span>{session.durationMinutes}m</span>
                            <span>&bull;</span>
                            <span className={`${statusColor} font-medium`}>{statusText}</span>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Events & Deadlines */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          {/* Next Deadline Highlight */}
          <Card className="bg-[var(--card-bg)] overflow-hidden border-[var(--border-color)] shadow-soft relative">
            {stats.nextDeadline && <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-error)]"></div>}
            <CardContent className="p-5 flex items-center justify-between pl-6 relative">
              {stats.nextDeadline ? (
                <div>
                  <p className="text-xs font-bold text-[var(--color-error)] tracking-wider uppercase mb-1">Next {stats.nextDeadline.type}</p>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{stats.nextDeadline.title}</h3>
                  <p className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    {stats.deadlineDays === 0 ? 'Today' : stats.deadlineDays === 1 ? 'Tomorrow' : `${stats.deadlineDays} days remaining`}
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">No upcoming deadlines</h3>
                  <p className="text-sm text-[var(--text-secondary)]">You're all caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar Preview */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b border-[var(--border-color)] pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-[var(--color-primary)]" /> Upcoming Events</CardTitle>
              <Link to="/dashboard/calendar">
                <Button variant="ghost" size="sm" className="h-8 text-[var(--color-primary)] -mr-2 text-xs font-medium">
                  Open Calendar
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {stats.upcomingEvents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[140px]">
                  <div className="h-10 w-10 rounded-full bg-[var(--border-color)]/30 flex items-center justify-center mb-3">
                    <CalendarIcon className="h-5 w-5 text-[var(--text-secondary)]" />
                  </div>
                  <p className="text-[var(--text-primary)] font-medium mb-1">No events scheduled</p>
                  <p className="text-[var(--text-secondary)] text-sm">Add events to your calendar to keep track.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border-color)] flex-1">
                  {stats.upcomingEvents.map((event) => {
                    const isToday = event.date === new Date().toISOString().split('T')[0];
                    const dateText = isToday ? 'Today' : new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    return (
                      <li key={event.id} className="p-4 hover:bg-[var(--bg-color)]/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getEventColor(event.type)}`}>
                            {event.type}
                          </div>
                          <p className="font-medium text-[var(--text-primary)] text-sm">{event.title}</p>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] font-medium">{dateText}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Goal Progress Preview */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="border-b border-[var(--border-color)] pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-[var(--color-success)]" /> Active Goals</CardTitle>
            <Link to="/dashboard/goals">
              <Button variant="ghost" size="sm" className="h-8 text-[var(--color-primary)] -mr-2 text-xs font-medium">
                View All Goals
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.activeGoals.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-8 text-center">
                 <div className="h-12 w-12 rounded-full bg-[var(--border-color)]/30 flex items-center justify-center mb-3">
                   <Target className="h-6 w-6 text-[var(--text-secondary)]" />
                 </div>
                 <p className="text-[var(--text-primary)] font-medium mb-1">No active goals</p>
                 <p className="text-[var(--text-secondary)] text-sm mb-4">Create your first goal to start tracking progress.</p>
                 <Link to="/dashboard/goals">
                   <Button variant="outline" size="sm">Add Goal</Button>
                 </Link>
               </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.activeGoals.map(goal => {
                  const subject = subjects.find(s => s.id === goal.subjectId);
                  const progress = Math.min(100, Math.round((goal.completedHours / goal.targetHours) * 100));
                  
                  return (
                    <div key={goal.id} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-[var(--text-primary)] text-sm leading-tight">{goal.title}</h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">{subject?.name || 'General'}</p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] uppercase">
                          {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-[var(--text-secondary)]">{goal.completedHours} / {goal.targetHours}h</span>
                          <span className="text-[var(--text-primary)]">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--bg-color)] rounded-full overflow-hidden border border-[var(--border-color)]/50">
                          <motion.div 
                            className="h-full" 
                            style={{ backgroundColor: subject ? subject.color : 'var(--color-primary)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
