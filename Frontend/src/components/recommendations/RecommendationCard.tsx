import type { Recommendation } from '../../services/recommendationApi';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play, ArrowRight, BookOpen, AlertTriangle, Target, TrendingUp, CheckCircle, Activity, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: Props) {
  const navigate = useNavigate();

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'EXAM_PREPARATION': return <BookOpen className="h-4 w-4" />;
      case 'GOAL_RISK': return <Target className="h-4 w-4" />;
      case 'INACTIVE_SUBJECT': return <AlertTriangle className="h-4 w-4" />;
      case 'REVISION': return <TrendingUp className="h-4 w-4" />;
      case 'CONSISTENCY': return <Activity className="h-4 w-4" />;
      case 'FOCUS': return <Lightbulb className="h-4 w-4" />;
      case 'TASK_PLANNING': return <CheckCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const handleAction = () => {
    const { action } = recommendation;
    if (action.type === 'START_STUDY') {
      let url = '/dashboard/pomodoro';
      if (action.subjectId) url += `?subjectId=${action.subjectId}`;
      navigate(url);
    } else if (action.type === 'VIEW_GOAL') {
      navigate('/dashboard/goals');
    } else if (action.type === 'VIEW_TASK') {
      navigate('/dashboard/tasks');
    } else if (action.type === 'VIEW_SUBJECT') {
      navigate('/dashboard/subjects');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border border-[var(--border-color)]">
      <CardContent className="p-5 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2 py-1 text-xs font-extrabold tracking-wider rounded-md border flex items-center gap-1.5 ${getPriorityStyles(recommendation.priority)}`}>
              {getIcon(recommendation.type)}
              {recommendation.priority} PRIORITY
            </span>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {recommendation.duration} min
            </span>
          </div>

          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            {recommendation.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {recommendation.subject !== recommendation.title && recommendation.subject !== 'General Revision' && recommendation.subject !== 'Study Routine' && recommendation.subject !== 'Focus Session' && recommendation.subject !== 'Study Balance' && recommendation.subject !== 'Task Management'
              ? recommendation.subject
              : null}
          </p>

          <div className="space-y-1.5 mb-5">
            <p className="text-xs font-bold text-[var(--text-primary)] mb-2">Why?</p>
            {recommendation.reason.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)] mt-1.5 shrink-0" />
                <span className="text-sm text-[var(--text-secondary)] leading-tight">{r}</span>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleAction}
          className="w-full flex items-center justify-center gap-2 group"
          variant={recommendation.priority === 'HIGH' ? 'primary' : 'outline'}
        >
          {recommendation.action.type === 'START_STUDY' ? (
            <><Play className="h-4 w-4 group-hover:scale-110 transition-transform" /> Start Study</>
          ) : (
            <><ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /> Take Action</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
