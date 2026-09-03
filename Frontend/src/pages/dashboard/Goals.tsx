import { useState } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Target, Plus, Trash2, CheckCircle2, Edit2 } from 'lucide-react';
import type { Goal } from '../../types';

export default function Goals() {
  const { goals, subjects, addGoal, updateGoal, deleteGoal, updateGoalProgress } = useStudyData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [deadline, setDeadline] = useState('');

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const now = new Date();
  const tzoffset = now.getTimezoneOffset() * 60000;
  const todayISO = (new Date(now.getTime() - tzoffset)).toISOString().split('T')[0];

  const openAddModal = () => {
    setEditingGoal(null);
    setTitle('');
    setSubjectId('');
    setTargetHours('');
    setDeadline('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setSubjectId(goal.subjectId || '');
    setTargetHours(goal.targetHours.toString());
    setDeadline(goal.deadline.split('T')[0]); // Ensure date is formatted properly for input type date
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title && targetHours && deadline) {
      setIsSaving(true);
      setError('');
      try {
        const selectedDate = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          setError('Cannot select a deadline in the past');
          setIsSaving(false);
          return;
        }

        const payload = {
          title,
          subjectId: subjectId || undefined, // API handles undefined for unsetting or General
          targetHours: Number(targetHours),
          deadline,
        };

        if (editingGoal) {
          await updateGoal(editingGoal.id, payload);
          setSuccessMsg('Goal updated successfully');
        } else {
          await addGoal(payload);
          setSuccessMsg('Goal added successfully');
        }
        setIsModalOpen(false);
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to save goal');
      } finally {
        setIsSaving(false);
      }
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
        <Button onClick={openAddModal} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {successMsg && (
        <div className="bg-green-100 text-green-700 p-3 rounded-[var(--radius-base)] text-sm font-medium">
          {successMsg}
        </div>
      )}

      {goals.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-transparent shadow-none">
          <div className="h-16 w-16 rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center justify-center mb-4">
             <Target className="h-8 w-8 text-[var(--text-secondary)] opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No goals set</h3>
          <p className="text-[var(--text-secondary)] max-w-sm mb-6">Create a goal to stay focused and track your progress over time.</p>
          <Button onClick={openAddModal}>Create Goal</Button>
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
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[var(--text-secondary)] hover:text-[var(--color-primary)]"
                        onClick={() => openEditModal(goal)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[var(--text-secondary)] hover:text-[var(--color-error)]"
                        onClick={() => setGoalToDelete(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-[var(--text-secondary)]">{goal.completedHours}h completed</span>
                      <span className="text-[var(--text-primary)]">{goal.targetHours}h target</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--bg-color)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${goal.isCompleted ? 'bg-[var(--color-success)]' : (subject ? '' : 'bg-[var(--color-primary)]')}`}
                        style={{ width: `${progress}%`, backgroundColor: (!goal.isCompleted && subject) ? subject.color : undefined }}
                      />
                    </div>
                  </div>
                  

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGoal ? "Edit Goal" : "Add New Goal"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm mb-4">
              {error}
            </div>
          )}
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
                min={todayISO}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : (editingGoal ? 'Update Goal' : 'Save Goal')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!goalToDelete} onClose={() => setGoalToDelete(null)} title="Delete Goal">
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">Are you sure you want to delete this goal? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => setGoalToDelete(null)}>Cancel</Button>
            <Button 
              className="bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90"
              onClick={() => {
                if (goalToDelete) {
                  deleteGoal(goalToDelete);
                  setGoalToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
