export interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  subjectId?: string; // Optional, can apply to all subjects
  targetHours: number;
  completedHours: number;
  deadline: string; // YYYY-MM-DD
  isCompleted: boolean;
  createdAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  durationMinutes: number;
  type: 'manual' | 'pomodoro';
  taskId?: string;
  notes?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'study' | 'assignment' | 'exam' | 'goal' | 'reminder';
  subjectId?: string;
  createdAt: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  date: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt?: string | null;
  completionStatus?: 'completed' | 'partial' | 'not_completed';
  estimatedMinutes?: number;
  source: 'manual' | 'goal' | 'ai' | 'exam';
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD or ISO String
  title: string;
  content?: string;

  mood: number | null;
  energy: number | null;
  productivity: number | null;

  achievements: string[];
  learnings: string[];
  challenges: string[];
  tomorrowFocus: string[];

  createdAt: string;
  updatedAt: string;
}
