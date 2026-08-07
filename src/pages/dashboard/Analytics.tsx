import { useMemo } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Flame, Target, Calendar, Clock, Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics() {
  const { sessions, subjects, goals } = useStudyData();

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const firstDayOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    // Streak
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

    // Monthly Time
    const monthSessions = sessions.filter(s => s.startTime >= firstDayOfMonthStr);
    const monthMinutes = monthSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const monthlyTime = `${Math.floor(monthMinutes / 60)}h ${monthMinutes % 60}m`;

    // Avg Daily Time
    const activeDaysCount = uniqueDays.length || 1;
    const totalMinutesAllTime = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const avgDailyMinutes = Math.floor(totalMinutesAllTime / activeDaysCount);
    const avgDailyTime = `${Math.floor(avgDailyMinutes / 60)}h ${avgDailyMinutes % 60}m`;

    // Goals progress
    const totalGoalHours = goals.reduce((acc, g) => acc + g.targetHours, 0);
    const totalCompletedHours = goals.reduce((acc, g) => acc + g.completedHours, 0);
    const goalsProgress = totalGoalHours === 0 ? 0 : Math.round((totalCompletedHours / totalGoalHours) * 100);

    // Weekly Chart Data
    const weekLabels = [];
    const weekData = [];
    for(let i=6; i>=0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      weekLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      const dStr = d.toISOString().split('T')[0];
      const mins = sessions.filter(s => s.startTime.startsWith(dStr)).reduce((a, s) => a + s.durationMinutes, 0);
      weekData.push(Math.round((mins / 60) * 10) / 10);
    }

    // Subject Chart Data
    const subjectNames: string[] = [];
    const subjectTimes: number[] = [];
    const subjectColors: string[] = [];
    
    subjects.forEach(sub => {
      const mins = sessions.filter(s => s.subjectId === sub.id).reduce((a, s) => a + s.durationMinutes, 0);
      if (mins > 0) {
        subjectNames.push(sub.name);
        subjectTimes.push(Math.round((mins / 60) * 10) / 10);
        subjectColors.push(sub.color);
      }
    });
    
    if (subjectNames.length === 0) {
      subjectNames.push('No Data');
      subjectTimes.push(1);
      subjectColors.push('#374151');
    }

    // Recent Timeline
    const timeline = [...sessions].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5);

    return {
      streak,
      monthlyTime,
      avgDailyTime,
      goalsProgress,
      weekLabels,
      weekData,
      subjectNames,
      subjectTimes,
      subjectColors,
      timeline
    };
  }, [sessions, subjects, goals]);

  return (
    <div className="space-y-6 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Analytics</h1>
        <p className="text-[var(--text-secondary)] mt-1">Deep dive into your study patterns and habits.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">Study Streak</p>
                <h3 className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{stats.streak} Days</h3>
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
                <p className="text-sm font-medium text-[var(--text-secondary)]">Monthly Time</p>
                <h3 className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{stats.monthlyTime}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">Avg Daily</p>
                <h3 className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{stats.avgDailyTime}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">Goal Progress</p>
                <h3 className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{stats.goalsProgress}%</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)]">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Study Time (Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Bar 
                data={{
                  labels: stats.weekLabels,
                  datasets: [{
                    label: 'Hours',
                    data: stats.weekData,
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderRadius: 4
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                     y: { beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.1)' }, ticks: { color: 'rgba(156, 163, 175, 0.8)' } },
                     x: { grid: { display: false }, ticks: { color: 'rgba(156, 163, 175, 0.8)' } }
                  },
                  plugins: {
                    legend: { display: false },
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subject Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex justify-center pb-6">
              <Pie 
                data={{
                  labels: stats.subjectNames,
                  datasets: [{
                    data: stats.subjectTimes,
                    backgroundColor: stats.subjectColors,
                    borderWidth: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right', labels: { color: 'rgba(156, 163, 175, 0.8)' } }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-[var(--color-primary)]"/> Recent Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.timeline.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm text-center py-8">No recent activity.</p>
            ) : (
              <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--border-color)] before:to-transparent">
                {stats.timeline.map((session) => {
                  const sub = subjects.find(s => s.id === session.subjectId);
                  return (
                    <div key={session.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-[var(--card-bg)] bg-[var(--color-primary)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" style={{ backgroundColor: sub?.color }}></div>
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--bg-color)] shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-[var(--text-primary)] text-sm">{sub?.name || 'Unknown'}</div>
                          <time className="font-mono text-xs text-[var(--color-primary)]">{session.durationMinutes}m</time>
                        </div>
                        <div className="text-[var(--text-secondary)] text-xs">
                          {new Date(session.startTime).toLocaleString()} {session.type === 'pomodoro' ? ' (Pomodoro)' : ''}
                        </div>
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
  );
}
