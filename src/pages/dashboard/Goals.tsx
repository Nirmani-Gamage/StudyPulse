import { useState } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Target, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function Goals() {
  const { goals, subjects, addGoal, deleteGoal, updateGoalProgress } = useStudyData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && targetHours && deadline) {
      addGoal({
        title,
        subjectId: subjectId || undefined,
        targetHours: Number(targetHours),
        deadline,
      });
      setTitle('');
      setSubjectId('');
      setTargetHours('');
      setDeadline('');
      setIsModalOpen(false);
    }
  };

  const calculateProgress = (completed: number, target: number) => {
    return Math.min(Math.round((completed / target) * 100), 100);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Goals</h1>
          <p className="text-[var(--text-secondary)] mt-1">Set and track your study targets.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-transparent shadow-none">
          <div className="h-16 w-16 rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center justify-center mb-4">
             <Target className="h-8 w-8 text-[var(--text-secondary)] opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No goals set</h3>
          <p className="text-[var(--text-secondary)] max-w-sm mb-6">Create a goal to stay focused and track your progress over time.</p>
          <Button onClick={() => setIsModalOpen(true)}>Create Goal</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const subject = subjects.find(s => s.id === goal.subjectId);
            const progress = calculateProgress(goal.completedHours, goal.targetHours);
            
            return (
              <Card key={goal.id} className="relative overflow-hidden group">
                {subject && <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: subject.color }} />}
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        {goal.title}
                        {goal.isCompleted && <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {subject ? subject.name : 'General'} • Due {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-secondary)] hover:text-[var(--color-error)]"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-[var(--text-secondary)]">{goal.completedHours}h completed</span>
                      <span className="text-[var(--text-primary)]">{goal.targetHours}h target</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--bg-color)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${goal.isCompleted ? 'bg-[var(--color-success)]' : 'bg-[var(--color-primary)]'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {!goal.isCompleted && (
                    <div className="mt-6 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => updateGoalProgress(goal.id, 1)}>
                        +1 Hour
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Goal">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Goal Title</label>
            <Input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Linear Algebra"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Subject (Optional)</label>
            <select 
              className="flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">-- General Goal --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Target Hours</label>
              <Input 
                required
                type="number"
                min="1"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                placeholder="e.g. 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Deadline</label>
              <Input 
                required
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Goal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
