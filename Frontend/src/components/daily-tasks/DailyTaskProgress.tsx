import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/Button';

interface DailyTaskProgressProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  totalTasks: number;
  completedTasks: number;
}

export function DailyTaskProgress({
  currentDate,
  onDateChange,
  totalTasks,
  completedTasks,
}: DailyTaskProgressProps) {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const isToday = currentDate === getTodayStr();

  // Format date string nicely e.g. "Saturday, September 12"
  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const handlePrevDay = () => {
    const [year, month, day] = currentDate.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const [year, month, day] = currentDate.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[var(--radius-card)] p-6 shadow-sm space-y-5">
      {/* Date Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              {isToday ? "Today's Tasks" : 'Planned Tasks'}
            </span>
            {!isToday && (
              <button
                onClick={() => onDateChange(getTodayStr())}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
              >
                Go to Today
              </button>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mt-0.5">
            {formatDateDisplay(currentDate)}
          </h2>
        </div>

        {/* Date Navigation Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-[var(--bg-color)] p-1 rounded-xl border border-[var(--border-color)]">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="relative flex items-center gap-1.5 px-2 text-xs font-bold text-[var(--text-primary)]">
            <CalendarIcon className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-[var(--text-primary)] cursor-pointer focus:outline-none"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar Section */}
      {totalTasks > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text-secondary)]">Progress</span>
            <span className="text-[var(--text-primary)] font-bold">
              {completedTasks} / {totalTasks} tasks completed ({percentage}%)
            </span>
          </div>

          <div className="h-3 w-full bg-[var(--bg-color)] rounded-full overflow-hidden border border-[var(--border-color)] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-primary)] to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
