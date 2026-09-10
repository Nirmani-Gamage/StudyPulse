import { useState, useMemo } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { 
  Flame, Target, Calendar, Clock, Activity, Lightbulb, 
  CheckCircle2, AlertCircle, Info, Filter, Search, ArrowRight,
  TrendingUp, BarChart3, PieChart, Sparkles
} from 'lucide-react';
import { 
  getBestStudyTime, getMostStudiedSubject, getStudyConsistency, 
  getWeeklyEstimate, getGoalRisk, getSubjectBalance, 
  getWeeklyTrend, getSuggestedActions 
} from '../../lib/insights';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type TimeRange = '7d' | '30d' | 'thisMonth' | 'all';
type InsightCategory = 'all' | 'habits' | 'goals' | 'balance';

export default function Analytics() {
  const navigate = useNavigate();
  const { sessions, subjects, goals, events } = useStudyData();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'activity'>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [insightCategory, setInsightCategory] = useState<InsightCategory>('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [activitySubjectFilter, setActivitySubjectFilter] = useState<string>('all');
  const [activityLimit, setActivityLimit] = useState(6);

  const filteredSessions = useMemo(() => {
    if (sessions.length === 0) return [];
    const now = new Date();

    if (timeRange === '7d') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return sessions.filter(s => new Date(s.startTime) >= cutoff);
    }
    if (timeRange === '30d') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return sessions.filter(s => new Date(s.startTime) >= cutoff);
    }
    if (timeRange === 'thisMonth') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return sessions.filter(s => new Date(s.startTime) >= firstOfMonth);
    }
    return sessions;
  }, [sessions, timeRange]);

  const insights = useMemo(() => {
    const consistency = getStudyConsistency(sessions);
    const trend = getWeeklyTrend(sessions);
    const goalRisk = getGoalRisk(goals);
    const balance = getSubjectBalance(sessions, subjects);
    
    return {
      bestTime: getBestStudyTime(sessions),
      mostStudied: getMostStudiedSubject(sessions, subjects),
      consistency,
      estimate: getWeeklyEstimate(sessions),
      goalRisk,
      balance,
      trend,
      suggestions: getSuggestedActions(consistency, trend, goalRisk, balance, events)
    };
  }, [sessions, subjects, goals, events]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const firstDayOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
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
    if (streak === 0 && uniqueDays.includes(todayStr)) streak = 1;

    const rangeMinutes = filteredSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const rangeHoursStr = `${Math.floor(rangeMinutes / 60)}h ${rangeMinutes % 60}m`;

    const monthSessions = sessions.filter(s => s.startTime >= firstDayOfMonthStr);
    const monthMinutes = monthSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const monthlyTime = `${Math.floor(monthMinutes / 60)}h ${monthMinutes % 60}m`;

    const activeDaysCount = new Set(filteredSessions.map(s => s.startTime.split('T')[0])).size || 1;
    const avgDailyMinutes = Math.floor(rangeMinutes / activeDaysCount);
    const avgDailyTime = `${Math.floor(avgDailyMinutes / 60)}h ${avgDailyMinutes % 60}m`;

    const avgSessionMins = filteredSessions.length > 0 ? Math.round(rangeMinutes / filteredSessions.length) : 0;

    let completedGoals = 0;
    let activeGoals = 0;
    let overdueGoals = 0;
    
    goals.forEach(g => {
      if (g.isCompleted) {
        completedGoals++;
      } else {
        if (g.deadline < todayStr) overdueGoals++;
        else activeGoals++;
      }
    });

    const totalGoalHours = goals.reduce((acc, g) => acc + g.targetHours, 0);
    const totalCompletedHours = goals.reduce((acc, g) => acc + g.completedHours, 0);
    const goalsProgress = totalGoalHours === 0 ? 0 : Math.min(100, Math.round((totalCompletedHours / totalGoalHours) * 100));

    const daysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
    const chartLabels = [];
    const chartData = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      chartLabels.push(timeRange === '7d' 
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      );
      const dStr = d.toISOString().split('T')[0];
      const mins = sessions.filter(s => s.startTime.startsWith(dStr)).reduce((a, s) => a + s.durationMinutes, 0);
      chartData.push(Math.round((mins / 60) * 10) / 10);
    }

    const subjectNames: string[] = [];
    const subjectTimes: number[] = [];
    const subjectColors: string[] = [];
    
    let assignedMins = 0;
    subjects.forEach(sub => {
      const mins = filteredSessions.filter(s => s.subjectId === sub.id).reduce((a, s) => a + s.durationMinutes, 0);
      if (mins > 0) {
        subjectNames.push(sub.name);
        subjectTimes.push(Math.round((mins / 60) * 10) / 10);
        subjectColors.push(sub.color);
        assignedMins += mins;
      }
    });

    const unassignedMins = rangeMinutes - assignedMins;
    if (unassignedMins > 0) {
      subjectNames.push('General / Unassigned');
      subjectTimes.push(Math.round((unassignedMins / 60) * 10) / 10);
      subjectColors.push('#9CA3AF');
    }

    let activityLog = [...sessions].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    if (activitySubjectFilter !== 'all') {
      activityLog = activityLog.filter(s => s.subjectId === activitySubjectFilter);
    }
    if (activitySearch.trim()) {
      const query = activitySearch.toLowerCase();
      activityLog = activityLog.filter(s => {
        const sub = subjects.find(sub => sub.id === s.subjectId);
        const subName = sub?.name.toLowerCase() || 'unassigned';
        const notes = (s.notes || '').toLowerCase();
        return subName.includes(query) || notes.includes(query);
      });
    }

    return {
      streak,
      monthlyTime,
      rangeHoursStr,
      rangeMinutes,
      avgDailyTime,
      avgSessionMins,
      goalsProgress,
      completedGoals,
      activeGoals,
      overdueGoals,
      chartLabels,
      chartData,
      subjectNames,
      subjectTimes,
      subjectColors,
      activityLog
    };
  }, [sessions, filteredSessions, subjects, goals, timeRange, activitySubjectFilter, activitySearch]);

  const InsightIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success': 
        return <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="h-5 w-5" /></div>;
      case 'warning': 
        return <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"><AlertCircle className="h-5 w-5" /></div>;
      case 'info': 
        return <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"><Info className="h-5 w-5" /></div>;
      default: 
        return <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"><Info className="h-5 w-5" /></div>;
    }
  };

  const getActionForInsight = (title: string) => {
    if (title.includes('Consistency') || title.includes('Time')) {
      return { label: 'Start Study Session', onClick: () => navigate('/dashboard/pomodoro') };
    }
    if (title.includes('Goal')) {
      return { label: 'Manage Goals', onClick: () => navigate('/dashboard/goals') };
    }
    if (title.includes('Subject') || title.includes('Balance')) {
      return { label: 'View Subjects', onClick: () => navigate('/dashboard/subjects') };
    }
    return { label: 'Open Timer', onClick: () => navigate('/dashboard/pomodoro') };
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[var(--card-bg)] to-[var(--bg-color)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Analytics & Insights</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Sparkles className="h-3.5 w-3.5" /> Intelligence Mode
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Deep dive into your study metrics, trends, and cognitive learning habits.</p>
        </div>

        <div className="flex items-center gap-1.5 bg-[var(--bg-color)] p-1.5 rounded-xl border border-[var(--border-color)] self-start sm:self-auto">
          {[
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'thisMonth', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id as TimeRange)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeRange === t.id
                  ? 'bg-[var(--card-bg)] text-[var(--color-primary)] shadow-sm border border-[var(--border-color)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card className="mt-8 border-dashed border-2">
          <CardContent className="p-16 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-4">
              <Lightbulb className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No study sessions recorded yet</h3>
            <p className="text-[var(--text-secondary)] max-w-md mb-6">
              Complete your first study session or run the Pomodoro timer to generate interactive study insights and visual charts.
            </p>
            <Button onClick={() => navigate('/dashboard/pomodoro')} className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Start First Study Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-px">
            <div className="flex space-x-1 sm:space-x-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'insights', label: 'Learning Insights', icon: Lightbulb },
                { id: 'activity', label: 'Activity Log', icon: Activity },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button 
                    key={tab.id}
                    role="tab" 
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative px-4 py-3 text-sm font-bold flex items-center gap-2 transition-colors outline-none rounded-t-xl ${
                      isActive 
                        ? 'text-[var(--color-primary)] bg-[var(--card-bg)] border-t-2 border-x border-[var(--border-color)] border-t-[var(--color-primary)]' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.id === 'insights' && (
                      <span className="ml-1 text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-extrabold px-2 py-0.5 rounded-full">
                        AI
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'overview' && (
             <motion.div 
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.25 }}
               className="space-y-6"
             >
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-indigo-500">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                            {timeRange === '7d' ? '7-Day Study Time' : timeRange === '30d' ? '30-Day Study Time' : 'Total Study Time'}
                          </p>
                          <h3 className="text-2xl font-extrabold mt-1 text-[var(--text-primary)]">{stats.rangeHoursStr}</h3>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-emerald-500" /> {filteredSessions.length} total sessions
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Calendar className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-blue-500">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Daily Average</p>
                          <h3 className="text-2xl font-extrabold mt-1 text-[var(--text-primary)]">{stats.avgDailyTime}</h3>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-500" /> Avg {stats.avgSessionMins}m / session
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Clock className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-amber-500">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Active Streak</p>
                          <h3 className="text-2xl font-extrabold mt-1 text-[var(--text-primary)]">{stats.streak} Days 🔥</h3>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">Keep studying daily to build streak</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Flame className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-emerald-500">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Goal Progress</p>
                          <h3 className="text-2xl font-extrabold mt-1 text-[var(--text-primary)]">{stats.goalsProgress}%</h3>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                            <Target className="h-3 w-3 text-emerald-500" /> {stats.completedGoals} of {goals.length} completed
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Target className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 <Card className="lg:col-span-7">
                   <CardHeader className="flex flex-row items-center justify-between pb-2">
                     <div>
                       <CardTitle className="text-lg font-bold">Study Time Trend</CardTitle>
                       <p className="text-xs text-[var(--text-secondary)] mt-0.5">Hours logged per day over the selected timeframe</p>
                     </div>
                     <div className="flex items-center gap-1 bg-[var(--bg-color)] p-1 rounded-lg border border-[var(--border-color)]">
                       <button
                         onClick={() => setChartType('bar')}
                         className={`p-1.5 rounded-md text-xs font-medium transition-colors ${chartType === 'bar' ? 'bg-[var(--card-bg)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
                         title="Bar Chart"
                       >
                         <BarChart3 className="h-4 w-4" />
                       </button>
                       <button
                         onClick={() => setChartType('line')}
                         className={`p-1.5 rounded-md text-xs font-medium transition-colors ${chartType === 'line' ? 'bg-[var(--card-bg)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
                         title="Line Chart"
                       >
                         <TrendingUp className="h-4 w-4" />
                       </button>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="h-[280px] w-full pt-4">
                       {chartType === 'bar' ? (
                         <Bar 
                           data={{
                             labels: stats.chartLabels,
                             datasets: [{
                               label: 'Hours',
                               data: stats.chartData,
                               backgroundColor: 'rgba(79, 70, 229, 0.85)',
                               hoverBackgroundColor: 'rgba(79, 70, 229, 1)',
                               borderRadius: 6
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
                               tooltip: {
                                 callbacks: {
                                   label: (context) => ` ${context.parsed.y} Hours Studied`
                                 }
                               }
                             }
                           }}
                         />
                       ) : (
                         <Line 
                           data={{
                             labels: stats.chartLabels,
                             datasets: [{
                               label: 'Hours',
                               data: stats.chartData,
                               borderColor: 'rgba(79, 70, 229, 1)',
                               backgroundColor: 'rgba(79, 70, 229, 0.15)',
                               fill: true,
                               tension: 0.35,
                               pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                               pointRadius: 4
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
                               legend: { display: false }
                             }
                           }}
                         />
                       )}
                     </div>
                   </CardContent>
                 </Card>

                 <Card className="lg:col-span-5 flex flex-col justify-between">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-lg font-bold flex items-center justify-between">
                       <span>Subject Distribution</span>
                       <PieChart className="h-4 w-4 text-[var(--text-secondary)]" />
                     </CardTitle>
                     <p className="text-xs text-[var(--text-secondary)] mt-0.5">Share of time spent per subject</p>
                   </CardHeader>
                   <CardContent className="flex-1 flex flex-col items-center justify-center">
                     {stats.subjectNames.length === 0 ? (
                       <p className="text-xs text-[var(--text-secondary)] text-center py-12">No subject study data available yet.</p>
                     ) : (
                       <div className="h-[240px] w-full flex justify-center items-center">
                         <Pie 
                           data={{
                             labels: stats.subjectNames,
                             datasets: [{
                               data: stats.subjectTimes,
                               backgroundColor: stats.subjectColors,
                               borderWidth: 2,
                               borderColor: 'var(--card-bg)'
                             }]
                           }}
                           options={{
                             responsive: true,
                             maintainAspectRatio: false,
                             plugins: {
                               legend: { 
                                 position: 'bottom', 
                                 labels: { 
                                   color: 'rgba(156, 163, 175, 0.9)',
                                   font: { size: 11, weight: 600 }
                                 } 
                               }
                             }
                           }}
                         />
                       </div>
                     )}
                   </CardContent>
                 </Card>
               </div>
             </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
               {insights.suggestions.length > 0 && (
                <Card className="border-l-4 border-l-[var(--color-primary)] bg-gradient-to-r from-[var(--color-primary)]/10 via-[var(--card-bg)] to-[var(--card-bg)] shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-[var(--text-primary)] font-bold">
                      <Sparkles className="h-5 w-5 text-[var(--color-primary)] animate-pulse" /> Recommended Action Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                      {insights.suggestions.map((sug, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
                          <span className="h-6 w-6 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-[var(--text-primary)] font-semibold leading-snug">{sug}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
               )}

               <div className="flex items-center gap-2 overflow-x-auto pb-1">
                 <span className="text-xs font-semibold text-[var(--text-secondary)] mr-1 flex items-center gap-1">
                   <Filter className="h-3.5 w-3.5" /> Filter:
                 </span>
                 {[
                   { id: 'all', label: 'All Insights' },
                   { id: 'habits', label: 'Habits & Time' },
                   { id: 'goals', label: 'Goals & Consistency' },
                   { id: 'balance', label: 'Subject Balance' },
                 ].map(cat => (
                   <button
                     key={cat.id}
                     onClick={() => setInsightCategory(cat.id as InsightCategory)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                       insightCategory === cat.id
                         ? 'bg-[var(--color-primary)] text-white shadow-sm'
                         : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--color-primary)]'
                     }`}
                   >
                     {cat.label}
                   </button>
                 ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                 {[
                   { ...insights.bestTime, cat: 'habits' },
                   { ...insights.mostStudied, cat: 'balance' },
                   { ...insights.consistency, cat: 'goals' },
                   { ...insights.estimate, cat: 'habits' },
                   { ...insights.goalRisk, cat: 'goals' },
                   { ...insights.balance, cat: 'balance' },
                   { ...insights.trend, cat: 'habits' }
                 ]
                 .filter(item => insightCategory === 'all' || item.cat === insightCategory)
                 .map((insight, idx) => {
                   const action = getActionForInsight(insight.title);
                   return (
                     <Card 
                       key={idx} 
                       className="group h-full flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[var(--border-color)]"
                     >
                       <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
                         <div className="space-y-3">
                           <div className="flex items-start justify-between gap-3">
                             <InsightIcon status={insight.status} />
                             <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[var(--bg-color)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                               {insight.status}
                             </span>
                           </div>
                           
                           <div>
                             <p className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">{insight.title}</p>
                             <h4 className="text-lg font-bold text-[var(--text-primary)] mt-1 leading-snug">{insight.value}</h4>
                           </div>

                           <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{insight.description}</p>
                         </div>

                         <div className="pt-3 border-t border-[var(--border-color)]">
                           <button 
                             onClick={action.onClick}
                             className="w-full flex items-center justify-between text-xs font-bold text-[var(--color-primary)] hover:underline group-hover:translate-x-0.5 transition-transform"
                           >
                             <span>{action.label}</span>
                             <ArrowRight className="h-3.5 w-3.5" />
                           </button>
                         </div>
                       </CardContent>
                     </Card>
                   );
                 })}
               </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search by subject or session notes..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={activitySubjectFilter}
                    onChange={(e) => setActivitySubjectFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-[var(--color-primary)]"/> Goal Completion Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 border border-[var(--border-color)] rounded-xl p-5 bg-[var(--bg-color)]">
                    <div className="text-center">
                      <h4 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.completedGoals}</h4>
                      <p className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase mt-1 tracking-wider">Completed</p>
                    </div>
                    <div className="text-center border-l border-r border-[var(--border-color)]">
                      <h4 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)]">{stats.activeGoals}</h4>
                      <p className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase mt-1 tracking-wider">In Progress</p>
                    </div>
                    <div className="text-center">
                      <h4 className="text-2xl sm:text-3xl font-extrabold text-amber-500">{stats.overdueGoals}</h4>
                      <p className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase mt-1 tracking-wider">Overdue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[var(--color-primary)]"/> Study Session Timeline
                  </CardTitle>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">
                    Showing {Math.min(activityLimit, stats.activityLog.length)} of {stats.activityLog.length} sessions
                  </span>
                </CardHeader>
                <CardContent>
                  {stats.activityLog.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[var(--text-secondary)] text-sm font-medium">No sessions match your search filter.</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => { setActivitySearch(''); setActivitySubjectFilter('all'); }}>
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.activityLog.slice(0, activityLimit).map((session) => {
                        const sub = subjects.find(s => s.id === session.subjectId);
                        return (
                          <div 
                            key={session.id} 
                            className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--bg-color)] transition-colors shadow-sm"
                          >
                            <div className="flex items-center gap-3.5">
                              <div 
                                className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm" 
                                style={{ backgroundColor: sub?.color || '#6366F1' }}
                              >
                                {(sub?.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{sub?.name || 'General Study'}</h4>
                                  {session.type === 'pomodoro' && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                      Pomodoro
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  {new Date(session.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                                {session.notes && (
                                  <p className="text-xs text-[var(--text-secondary)] italic mt-1 bg-[var(--bg-color)] px-2 py-1 rounded-md border border-[var(--border-color)] inline-block">
                                    "{session.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-mono text-sm font-extrabold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-lg">
                                {session.durationMinutes} min
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {stats.activityLog.length > activityLimit && (
                        <div className="pt-4 text-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActivityLimit(prev => prev + 6)}
                            className="font-bold text-xs"
                          >
                            Load More Sessions ({stats.activityLog.length - activityLimit} remaining)
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
