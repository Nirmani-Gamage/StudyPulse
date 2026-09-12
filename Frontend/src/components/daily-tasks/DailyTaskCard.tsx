import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DailyTask, Subject } from '../../types';
import { CheckSquare, Square, MoreVertical, Edit2, Trash2, Clock, Play } from 'lucide-react';
import { Button } from '../ui/Button';

interface DailyTaskCardProps {
  task: DailyTask;
  subject?: Subject;
  onToggle: (id: string) => Promise<void>;
  onEdit: (task: DailyTask) => void;
  onDelete: (id: string) => Promise<void>;
}

export function DailyTaskCard({ task, subject, onToggle, onEdit, onDelete }: DailyTaskCardProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;
    try {
      setIsToggling(true);
      await onToggle(task.id);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const priorityStyles = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  };

  return (
    <div 
      className={`group relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
        task.completed
          ? 'bg-[var(--bg-color)]/60 border-[var(--border-color)] opacity-75'
          : 'bg-[var(--card-bg)] border-[var(--border-color)] hover:border-[var(--color-primary)]/40 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Interactive Checkbox */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={isToggling}
        className="mt-0.5 text-[var(--text-secondary)] hover:text-[var(--color-primary)] focus:outline-none transition-colors disabled:opacity-50"
        title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
      >
        {task.completed ? (
          <CheckSquare className="h-6 w-6 text-[var(--color-primary)] fill-[var(--color-primary)]/10" />
        ) : (
          <Square className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--color-primary)]" />
        )}
      </button>

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`font-semibold text-base leading-snug break-words ${
              task.completed
                ? 'line-through text-[var(--text-secondary)]'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {task.title}
          </h4>

          {/* Priority Badge */}
          <span
            className={`shrink-0 text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
              priorityStyles[task.priority] || priorityStyles.medium
            }`}
          >
            {task.priority}
          </span>
        </div>

        {/* Task Description */}
        {task.description && (
          <p
            className={`text-xs mt-1 leading-relaxed ${
              task.completed ? 'text-[var(--text-secondary)]/70 line-through' : 'text-[var(--text-secondary)]'
            }`}
          >
            {task.description}
          </p>
        )}

        {/* Metadata Footer: Subject & Estimated Minutes */}
        <div className="flex items-center flex-wrap gap-2 mt-2.5">
          {subject && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs"
              style={{ backgroundColor: subject.color }}
            >
              {subject.name}
            </span>
          )}

          {task.estimatedMinutes && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium bg-[var(--bg-color)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes} min
            </span>
          )}
        </div>

        {/* Task Actions & Status */}
        <div className="mt-3 flex items-center gap-2">
          {task.completionStatus === 'partial' && (
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
              ◐ Partially completed
            </span>
          )}
          {task.completionStatus === 'completed' && (
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              ✓ Completed
            </span>
          )}
          {task.completionStatus !== 'completed' && !task.completed && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-bold gap-1.5 px-3 border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/pomodoro?taskId=${task.id}`);
              }}
            >
              <Play className="h-3 w-3" fill="currentColor" /> Start Session
            </Button>
          )}
        </div>
      </div>

      {/* Menu Actions */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-80 group-hover:opacity-100"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          title="Task options"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsMenuOpen(false)} 
            />
            <div className="absolute right-0 top-9 z-50 w-32 rounded-lg bg-[var(--card-bg)] shadow-lg border border-[var(--border-color)] py-1 text-xs">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(task);
                }}
                className="w-full text-left px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-color)] flex items-center gap-2 font-medium"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleDelete();
                }}
                disabled={isDeleting}
                className="w-full text-left px-3 py-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 flex items-center gap-2 font-medium border-t border-[var(--border-color)]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
