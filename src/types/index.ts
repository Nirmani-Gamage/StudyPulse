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
