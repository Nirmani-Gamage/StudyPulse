import { useState, useMemo } from 'react';
import { useStudyData } from '../../context/StudyContext';
import type { DailyTask } from '../../types';
import { DailyTaskProgress } from '../../components/daily-tasks/DailyTaskProgress';
import { DailyTaskCard } from '../../components/daily-tasks/DailyTaskCard';
import { DailyTaskForm } from '../../components/daily-tasks/DailyTaskForm';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';

export default function DailyTasks() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const {
    dailyTasks,
    subjects,
    addDailyTask,
    updateDailyTask,
    toggleDailyTask,
    deleteDailyTask,
  } = useStudyData();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<DailyTask | null>(null);

  // Filter tasks by selected date (YYYY-MM-DD string match)
  const dateTasks = useMemo(() => {
    return dailyTasks.filter((t) => {
      if (!t.date) return false;
      const tDateStr = typeof t.date === 'string' ? t.date.split('T')[0] : '';
      return tDateStr === selectedDate;
    });
  }, [dailyTasks, selectedDate]);

  // Priority groupings & sorting: incomplete tasks first, completed tasks second
  const priorityGroups = useMemo(() => {
    const sortTasks = (tasks: DailyTask[]) => {
      return [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1; // Incomplete first
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    };

    const high = sortTasks(dateTasks.filter((t) => t.priority === 'high'));
    const medium = sortTasks(dateTasks.filter((t) => t.priority === 'medium'));
    const low = sortTasks(dateTasks.filter((t) => t.priority === 'low'));

    return { high, medium, low };
  }, [dateTasks]);

  const completedCount = useMemo(() => {
    return dateTasks.filter((t) => t.completed).length;
  }, [dateTasks]);

  const handleOpenAddForm = () => {
    setTaskToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (task: DailyTask) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };

  const handleSaveTask = async (taskData: {
    title: string;
    description?: string;
    subjectId?: string;
    date: string;
    priority: 'low' | 'medium' | 'high';
    estimatedMinutes?: number;
    source: 'manual' | 'goal' | 'ai' | 'exam';
  }) => {
    if (taskToEdit) {
      await updateDailyTask(taskToEdit.id, taskData);
    } else {
      await addDailyTask(taskData);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Daily Tasks
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Organize your daily study workload and check off your completed tasks.
          </p>
        </div>

        {selectedDate >= getTodayStr() && (
          <Button onClick={handleOpenAddForm} className="flex items-center gap-2 font-bold shadow-md">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        )}
      </div>

      {/* Progress & Date Bar Component */}
      <DailyTaskProgress
        currentDate={selectedDate}
        onDateChange={setSelectedDate}
        totalTasks={dateTasks.length}
        completedTasks={completedCount}
      />

      {/* Tasks List or Empty State */}
      <div className="space-y-8 mt-6">
        {dateTasks.length === 0 ? (
          <div className="p-12 text-center bg-[var(--card-bg)] border border-dashed border-[var(--border-color)] rounded-[var(--radius-card)]">
            <p className="text-[var(--text-primary)] font-medium text-lg mb-2">No tasks scheduled for this day</p>
            {selectedDate >= getTodayStr() ? (
              <Button variant="ghost" onClick={handleOpenAddForm} className="text-[var(--color-primary)] font-bold hover:underline p-0 h-auto hover:bg-transparent">
                Add a new task to get started
              </Button>
            ) : (
              <p className="text-[var(--text-secondary)] text-sm">Past days cannot be modified.</p>
            )}
          </div>
        ) : (
          <>
            {/* High Priority Group */}
            {priorityGroups.high.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--border-color)]">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                    High Priority ({priorityGroups.high.length})
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {priorityGroups.high.map((task) => (
                    <DailyTaskCard
                      key={task.id}
                      task={task}
                      subject={subjects.find((s) => s.id === task.subjectId)}
                      onToggle={toggleDailyTask}
                      onEdit={handleOpenEditForm}
                      onDelete={deleteDailyTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Medium Priority Group */}
            {priorityGroups.medium.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--border-color)]">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                    Medium Priority ({priorityGroups.medium.length})
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {priorityGroups.medium.map((task) => (
                    <DailyTaskCard
                      key={task.id}
                      task={task}
                      subject={subjects.find((s) => s.id === task.subjectId)}
                      onToggle={toggleDailyTask}
                      onEdit={handleOpenEditForm}
                      onDelete={deleteDailyTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Low Priority Group */}
            {priorityGroups.low.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--border-color)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                    Low Priority ({priorityGroups.low.length})
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {priorityGroups.low.map((task) => (
                    <DailyTaskCard
                      key={task.id}
                      task={task}
                      subject={subjects.find((s) => s.id === task.subjectId)}
                      onToggle={toggleDailyTask}
                      onEdit={handleOpenEditForm}
                      onDelete={deleteDailyTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Add Task Action */}
            {selectedDate >= getTodayStr() && (
              <div className="pt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleOpenAddForm}
                  className="flex items-center gap-2 font-bold px-6"
                >
                  <Plus className="h-4 w-4" /> Add Task
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <DailyTaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        subjects={subjects}
        initialDate={selectedDate}
      />
    </div>
  );
}
