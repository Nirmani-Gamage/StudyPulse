import { useMemo } from 'react';
import { Clock, Flame, Target, Zap, Plus, Calendar as CalendarIcon, Timer, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStudyData } from '../../context/StudyContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { sessions, goals, events, subjects } = useStudyData();

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const todaySessions = sessions.filter(s => s.startTime.startsWith(todayStr));
    const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const todayStudyTime = `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`;
    
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekSessions = sessions.filter(s => s.startTime >= oneWeekAgo);
    const weekMinutes = weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const weeklyStudyTime = `${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m`;

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
    
    const upcomingGoal = [...goals].filter(g => !g.isCompleted).sort((a,b) => a.deadline.localeCompare(b.deadline))[0];

    const pomodoroCount = todaySessions.filter(s => s.type === 'pomodoro').length;
    
    const nextExam = [...events].filter(e => e.type === 'exam' && e.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date))[0];
    
    const todayEvents = events.filter(e => e.date === todayStr);

    const focusScore = Math.min(100, Math.floor(todayMinutes / 6) * 5);

    const recentSessions = [...sessions].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 3);

    return {
      todayStudyTime,
      weeklyStudyTime,
      studyStreak: streak,
      goalsProgress,
      focusScore,
      recentSessions,
      pomodoroCount,
      nextExam,
      todayEvents,
      upcomingGoal
    };
  }, [sessions, goals, events]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1">Here is a summary of your learning progress.</p>
        </div>
        <Link to="/dashboard/pomodoro">
          <Button className="shrink-0 gap-2">
            <Plus className="h-4 w-4" />
            Start Session
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">Today's Study</p>
                <h3 className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{stats.todayStudyTime}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">Study Streak</p>
                <h3 className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{stats.studyStreak} Days</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[var(--color-warning)]/10 flex items-center justify-center text-[var(--color-warning)]">
                <Flame className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">Goals Progress</p>
                <h3 className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{stats.goalsProgress}%</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)]">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">Focus Score</p>
                <h3 className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{stats.focusScore}/100</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Quick Highlights */}
        <div className="space-y-4">
           <Card className="h-full">
             <CardHeader className="border-b border-[var(--border-color)] pb-3">
               <CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4 text-[var(--color-primary)]" /> Quick Insights</CardTitle>
             </CardHeader>
             <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-secondary)]">Weekly Study Time</span>
                  <span className="font-semibold text-[var(--text-primary)]">{stats.weeklyStudyTime}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-secondary)]">Pomodoros Today</span>
                  <span className="font-semibold text-[var(--text-primary)]">{stats.pomodoroCount}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-secondary)]">Upcoming Goal</span>
                  <span className="font-semibold text-[var(--text-primary)] text-right max-w-[120px] truncate" title={stats.upcomingGoal?.title}>
                    {stats.upcomingGoal ? stats.upcomingGoal.title : 'None'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-secondary)]">Next Exam</span>
                  <span className="font-semibold text-[var(--color-error)] text-right max-w-[120px] truncate" title={stats.nextExam?.title}>
                    {stats.nextExam ? stats.nextExam.title : 'None'}
                  </span>
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Today's Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border-color)] pb-3">
            <CardTitle className="text-base flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-[var(--color-success)]" /> Today's Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.todayEvents.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-secondary)] text-sm">No events scheduled for today.</div>
            ) : (
              <ul className="divide-y divide-[var(--border-color)]">
                {stats.todayEvents.map((event) => (
                  <li key={event.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--text-primary)] text-sm">{event.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] uppercase mt-0.5">{event.type}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border-color)] pb-3">
            <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-[var(--color-warning)]" /> Recent Sessions</CardTitle>
            <Link to="/dashboard/sessions">
              <Button variant="ghost" size="sm" className="h-8 text-[var(--color-primary)] -mr-2 text-xs">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentSessions.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-secondary)] text-sm">No sessions logged yet.</div>
            ) : (
              <ul className="divide-y divide-[var(--border-color)]">
                {stats.recentSessions.map((session) => {
                  const subject = subjects.find(s => s.id === session.subjectId);
                  return (
                    <li key={session.id} className="p-4 hover:bg-[var(--bg-color)] transition-colors flex items-center justify-between group">
                      <div>
                        <p className="font-medium text-[var(--text-primary)] text-sm group-hover:text-[var(--color-primary)] transition-colors">{subject?.name || 'Subject'}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{new Date(session.startTime).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-md">
                        {session.durationMinutes}m
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
