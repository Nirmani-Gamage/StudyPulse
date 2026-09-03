import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import type { Subject, Goal, StudySession, CalendarEvent } from '../types';

interface StudyState {
  subjects: Subject[];
  goals: Goal[];
  sessions: StudySession[];
  events: CalendarEvent[];
  
  
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => Promise<void>;
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
  
  isLoading: boolean;
  resetData: () => void;
}

const initialState: StudyState = {
  subjects: [],
  goals: [],
  sessions: [],
  events: [],
  addSubject: async () => {},
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
  isLoading: false,
  resetData: () => {},
};

const StudyContext = createContext<StudyState>(initialState);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated } = useAuth();

  const fetchInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const [subjectsRes, goalsRes, sessionsRes, eventsRes] = await Promise.all([
        api.get('/subjects').catch(() => ({ subjects: [] })),
        api.get('/goals').catch(() => ({ goals: [] })),
        api.get('/sessions').catch(() => ({ sessions: [] })),
        api.get('/events').catch(() => ({ calendarEvents: [] }))
      ]);

      setSubjects(subjectsRes.subjects || []);
      setGoals(goalsRes.goals || []);
      setSessions(sessionsRes.sessions || []);
      setEvents(eventsRes.calendarEvents || []);
    } catch (e) {
      console.error('Failed to fetch study data', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const handleLogout = () => resetData();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt'>) => {
    const data = await api.post('/subjects', subject);
    if (data.subject) setSubjects(prev => [...prev, data.subject]);
  };

  const updateSubject = async (id: string, updates: Partial<Omit<Subject, 'id' | 'createdAt' | 'userId'>>) => {
    const data = await api.put(`/subjects/${id}`, updates);
    if (data.subject) {
      setSubjects(prev => prev.map(s => s.id === id ? data.subject : s));
    }
  };

  const deleteSubject = async (id: string) => {
    await api.delete(`/subjects/${id}`);
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'completedHours' | 'isCompleted'>) => {
    const data = await api.post('/goals', goal);
    if (data.goal) setGoals(prev => [...prev, data.goal]);
  };

  const updateGoal = async (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'userId'>>) => {
    const data = await api.put(`/goals/${id}`, updates);
    if (data.goal) {
      setGoals(prev => prev.map(g => g.id === id ? data.goal : g));
    }
  };

  const updateGoalProgress = async (id: string, hoursToAdd: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    
    const newCompleted = goal.completedHours + hoursToAdd;
    const data = await api.put(`/goals/${id}`, { completedHours: newCompleted });
    
    if (data.goal) {
      setGoals(prev => prev.map(g => g.id === id ? data.goal : g));
    }
  };

  const deleteGoal = async (id: string) => {
    await api.delete(`/goals/${id}`);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addSession = async (session: Omit<StudySession, 'id' | 'createdAt'>) => {
    const data = await api.post('/sessions', session);
    if (data.session) setSessions(prev => [data.session, ...prev]);
  };

  const updateSession = async (id: string, updates: Partial<Omit<StudySession, 'id' | 'createdAt' | 'userId'>>) => {
    const data = await api.put(`/sessions/${id}`, updates);
    if (data.session) {
      setSessions(prev => prev.map(s => s.id === id ? data.session : s));
    }
  };

  const deleteSession = async (id: string) => {
    await api.delete(`/sessions/${id}`);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const data = await api.post('/events', event);
    if (data.calendarEvent) setEvents(prev => [...prev, data.calendarEvent]);
  };

  const updateEvent = async (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'userId'>>) => {
    const data = await api.put(`/events/${id}`, updates);
    if (data.calendarEvent) {
      setEvents(prev => prev.map(e => e.id === id ? data.calendarEvent : e));
    }
  };

  const deleteEvent = async (id: string) => {
    await api.delete(`/events/${id}`);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const resetData = () => {
    setSubjects([]);
    setGoals([]);
    setSessions([]);
    setEvents([]);
  };

  return (
    <StudyContext.Provider value={{
      subjects, goals, sessions, events,
      addSubject, updateSubject, deleteSubject,
      addGoal, updateGoal, updateGoalProgress, deleteGoal,
      addSession, updateSession, deleteSession,
      addEvent, updateEvent, deleteEvent,
      isLoading, resetData
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export const useStudyData = () => useContext(StudyContext);
