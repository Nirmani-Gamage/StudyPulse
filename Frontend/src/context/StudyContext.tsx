import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import type { Subject, Goal, StudySession, CalendarEvent, DailyTask, JournalEntry } from '../types';

interface StudyState {
  subjects: Subject[];
  goals: Goal[];
  sessions: StudySession[];
  events: CalendarEvent[];
  dailyTasks: DailyTask[];
  journalEntries: JournalEntry[];
  
  error: string | null;
  refreshData: () => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => Promise<Subject | undefined>;
  updateSubject: (id: string, updates: Partial<Omit<Subject, 'id' | 'createdAt' | 'userId'>>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completedHours' | 'isCompleted'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'userId'>>) => Promise<void>;
  updateGoalProgress: (id: string, hoursToAdd: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  addSession: (session: Omit<StudySession, 'id' | 'createdAt'>) => Promise<void>;
  updateSession: (id: string, updates: Partial<Omit<StudySession, 'id' | 'createdAt' | 'userId'>>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'userId'>>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  
  addDailyTask: (task: Omit<DailyTask, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => Promise<DailyTask | undefined>;
  updateDailyTask: (id: string, updates: Partial<Omit<DailyTask, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'completionStatus'>>) => Promise<void>;
  toggleDailyTask: (id: string) => Promise<void>;
  updateTaskOutcome: (id: string, status: 'completed' | 'partial' | 'not_completed') => Promise<void>;
  deleteDailyTask: (id: string) => Promise<void>;

  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<JournalEntry | undefined>;
  updateJournalEntry: (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  isLoading: boolean;
  resetData: () => void;
}

const initialState: StudyState = {
  subjects: [],
  goals: [],
  sessions: [],
  events: [],
  dailyTasks: [],
  journalEntries: [],
  error: null,
  refreshData: async () => {},
  addSubject: async () => undefined,
  updateSubject: async () => {},
  deleteSubject: async () => {},
  addGoal: async () => {},
  updateGoal: async () => {},
  updateGoalProgress: async () => {},
  deleteGoal: async () => {},
  addSession: async () => {},
  updateSession: async () => {},
  deleteSession: async () => {},
  addEvent: async () => {},
  updateEvent: async () => {},
  deleteEvent: async () => {},
  addDailyTask: async () => undefined,
  updateDailyTask: async () => {},
  toggleDailyTask: async () => {},
  updateTaskOutcome: async () => {},
  deleteDailyTask: async () => {},
  addJournalEntry: async () => undefined,
  updateJournalEntry: async () => {},
  deleteJournalEntry: async () => {},
  isLoading: false,
  resetData: () => {},
};

const StudyContext = createContext<StudyState>(initialState);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();

  const fetchInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        api.get('/subjects'),
        api.get('/goals'),
        api.get('/sessions'),
        api.get('/events'),
        api.get('/daily-tasks'),
        api.get('/journal')
      ]);

      let hasError = false;

      if (results[0].status === 'fulfilled') setSubjects(results[0].value.subjects || []);
      else hasError = true;

      if (results[1].status === 'fulfilled') setGoals(results[1].value.goals || []);
      else hasError = true;

      if (results[2].status === 'fulfilled') setSessions(results[2].value.sessions || []);
      else hasError = true;

      if (results[3].status === 'fulfilled') setEvents(results[3].value.calendarEvents || []);
      else hasError = true;

      if (results[4].status === 'fulfilled') setDailyTasks(results[4].value.tasks || []);
      else hasError = true;

      if (results[5].status === 'fulfilled') setJournalEntries(results[5].value.entries || []);
      else hasError = true;

      if (hasError) {
        setError('Unable to load some of your study data. Please try again.');
      }
    } catch (e) {
      setError('Unable to load your study data. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshData = async () => {
    await fetchInitialData();
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const handleLogout = () => resetData();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const resetData = () => {
    setSubjects([]);
    setGoals([]);
    setSessions([]);
    setEvents([]);
    setDailyTasks([]);
    setJournalEntries([]);
    setError(null);
  };

  const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt'>) => {
    setError(null);
    const data = await api.post('/subjects', subject);
    if (data.subject) {
      setSubjects(prev => [...prev, data.subject]);
      return data.subject;
    }
  };

  const updateSubject = async (id: string, updates: Partial<Omit<Subject, 'id' | 'createdAt' | 'userId'>>) => {
    setError(null);
    const data = await api.put(`/subjects/${id}`, updates);
    if (data.subject) {
      setSubjects(prev => prev.map(s => s.id === id ? data.subject : s));
    }
  };

  const deleteSubject = async (id: string) => {
    setError(null);
    await api.delete(`/subjects/${id}`);
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'completedHours' | 'isCompleted'>) => {
    setError(null);
    const data = await api.post('/goals', goal);
    if (data.goal) setGoals(prev => [...prev, data.goal]);
  };

  const updateGoal = async (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'userId'>>) => {
    setError(null);
    const data = await api.put(`/goals/${id}`, updates);
    if (data.goal) {
      setGoals(prev => prev.map(g => g.id === id ? data.goal : g));
    }
  };

  const updateGoalProgress = async (id: string, hoursToAdd: number) => {
    setError(null);
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    
    const newCompleted = goal.completedHours + hoursToAdd;
    const data = await api.put(`/goals/${id}`, { completedHours: newCompleted });
    
    if (data.goal) {
      setGoals(prev => prev.map(g => g.id === id ? data.goal : g));
    }
  };

  const deleteGoal = async (id: string) => {
    setError(null);
    await api.delete(`/goals/${id}`);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addSession = async (session: Omit<StudySession, 'id' | 'createdAt'>) => {
    setError(null);
    const data = await api.post('/sessions', session);
    if (data.session) setSessions(prev => [data.session, ...prev]);
  };

  const updateSession = async (id: string, updates: Partial<Omit<StudySession, 'id' | 'createdAt' | 'userId'>>) => {
    setError(null);
    const data = await api.put(`/sessions/${id}`, updates);
    if (data.session) {
      setSessions(prev => prev.map(s => s.id === id ? data.session : s));
    }
  };

  const deleteSession = async (id: string) => {
    setError(null);
    await api.delete(`/sessions/${id}`);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    setError(null);
    const data = await api.post('/events', event);
    if (data.calendarEvent) setEvents(prev => [...prev, data.calendarEvent]);
  };

  const updateEvent = async (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'userId'>>) => {
    setError(null);
    const data = await api.put(`/events/${id}`, updates);
    if (data.calendarEvent) {
      setEvents(prev => prev.map(e => e.id === id ? data.calendarEvent : e));
    }
  };

  const deleteEvent = async (id: string) => {
    setError(null);
    await api.delete(`/events/${id}`);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addDailyTask = async (task: Omit<DailyTask, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => {
    setError(null);
    const data = await api.post('/daily-tasks', task);
    if (data.task) {
      setDailyTasks(prev => [...prev, data.task]);
      return data.task;
    }
  };

  const updateDailyTask = async (id: string, updates: Partial<Omit<DailyTask, 'id' | 'createdAt' | 'completed' | 'completedAt'>>) => {
    setError(null);
    const data = await api.put(`/daily-tasks/${id}`, updates);
    if (data.task) {
      setDailyTasks(prev => prev.map(t => t.id === id ? data.task : t));
    }
  };

  const toggleDailyTask = async (id: string) => {
    setError(null);
    const data = await api.patch(`/daily-tasks/${id}/toggle`, {});
    if (data.task) {
      setDailyTasks(prev => prev.map(t => t.id === id ? data.task : t));
    }
  };

  const updateTaskOutcome = async (id: string, status: 'completed' | 'partial' | 'not_completed') => {
    setError(null);
    const data = await api.patch(`/daily-tasks/${id}/outcome`, { status });
    if (data.task) {
      setDailyTasks(prev => prev.map(t => t.id === id ? data.task : t));
    }
  };

  const deleteDailyTask = async (id: string) => {
    setError(null);
    await api.delete(`/daily-tasks/${id}`);
    setDailyTasks(prev => prev.filter(t => t.id !== id));
  };

  const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    setError(null);
    const data = await api.post('/journal', entry);
    if (data.entry) {
      setJournalEntries(prev => [data.entry, ...prev]);
      return data.entry;
    }
  };

  const updateJournalEntry = async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>) => {
    setError(null);
    const data = await api.put(`/journal/${id}`, updates);
    if (data.entry) {
      setJournalEntries(prev => prev.map(e => e.id === id ? data.entry : e));
    }
  };

  const deleteJournalEntry = async (id: string) => {
    setError(null);
    await api.delete(`/journal/${id}`);
    setJournalEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <StudyContext.Provider value={{
      subjects, goals, sessions, events, dailyTasks, journalEntries,
      error, refreshData,
      addSubject, updateSubject, deleteSubject,
      addGoal, updateGoal, updateGoalProgress, deleteGoal,
      addSession, updateSession, deleteSession,
      addEvent, updateEvent, deleteEvent,
      addDailyTask, updateDailyTask, toggleDailyTask, updateTaskOutcome, deleteDailyTask,
      addJournalEntry, updateJournalEntry, deleteJournalEntry,
      isLoading, resetData
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export const useStudyData = () => useContext(StudyContext);

