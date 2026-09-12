import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface DailyTaskEmptyStateProps {
  onAddTask: () => void;
}

export function DailyTaskEmptyState({ onAddTask }: DailyTaskEmptyStateProps) {
  return (
    <div className="bg-[var(--card-bg)] border border-dashed border-[var(--border-color)] rounded-[var(--radius-card)] p-12 text-center flex flex-col items-center justify-center my-6">
      <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-4">
        <CheckSquare className="h-8 w-8" />
      </div>

      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
        Your day is clear
      </h3>

      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
        Add a few study tasks to organize your day and build your learning streak.
      </p>

      <Button onClick={onAddTask} className="flex items-center gap-2 font-bold shadow-md">
        <Plus className="h-4 w-4" /> Add Task
      </Button>
    </div>
  );
}
