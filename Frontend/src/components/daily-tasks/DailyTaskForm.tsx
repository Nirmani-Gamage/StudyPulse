import { useState, useEffect } from 'react';
import type { DailyTask, Subject } from '../../types';
import { X, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface DailyTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description?: string;
    subjectId?: string;
    date: string;
    priority: 'low' | 'medium' | 'high';
    estimatedMinutes?: number;
    source: 'manual' | 'goal' | 'ai' | 'exam';
  }) => Promise<void>;
  taskToEdit?: DailyTask | null;
  subjects: Subject[];
  initialDate?: string;
}

export function DailyTaskForm({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  subjects,
  initialDate,
}: DailyTaskFormProps) {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [date, setDate] = useState<string>(initialDate || getTodayStr());
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedHours, setEstimatedHours] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setSubjectId(taskToEdit.subjectId || '');
      setDate(taskToEdit.date || initialDate || getTodayStr());
      setPriority(taskToEdit.priority || 'medium');
      setEstimatedHours(taskToEdit.estimatedMinutes ? String(Number(taskToEdit.estimatedMinutes) / 60) : '');
    } else {
      setTitle('');
      setDescription('');
      setSubjectId('');
      setDate(initialDate || getTodayStr());
      setPriority('medium');
      setEstimatedHours('');
    }
    setError('');
  }, [taskToEdit, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    let parsedMins: number | undefined = undefined;
    if (estimatedHours.trim()) {
      const parsedHours = parseFloat(estimatedHours);
      if (isNaN(parsedHours) || parsedHours <= 0) {
        setError('Estimated time must be a positive number of hours.');
        return;
      }
      parsedMins = Math.round(parsedHours * 60);
    }

    try {
      setIsSubmitting(true);
      await onSave({
        title: title.trim(),
        description: description.trim(),
        subjectId: subjectId ? subjectId : undefined,
        date: date || getTodayStr(),
        priority,
        estimatedMinutes: parsedMins,
        source: 'manual',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save daily task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[var(--radius-card)] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
            {taskToEdit ? 'Edit Daily Task' : 'Add New Daily Task'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
            <X className="h-5 w-5 text-[var(--text-secondary)]" />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Task Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Practice 10 Automata questions"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Description <span className="text-[var(--text-secondary)] text-[10px] font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Practice DFA and NFA conversion questions from lecture notes."
              rows={2}
              className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all resize-y"
            />
          </div>

          {/* Subject & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-[var(--border-color)] bg-[var(--bg-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">No subject</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Planned Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={date}
                min={getTodayStr()}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Priority & Estimated Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[var(--bg-color)] p-1 rounded-md border border-[var(--border-color)]">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs font-bold rounded uppercase transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-red-500 text-white shadow-xs'
                          : p === 'medium'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-emerald-500 text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Hours */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Est. Time (Hours)
              </label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="e.g. 1.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : taskToEdit ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
