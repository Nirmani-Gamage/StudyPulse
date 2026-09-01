import { createContext, useContext, useEffect, useState } from 'react';
import type { Subject, Goal, StudySession, CalendarEvent } from '../types';

interface StudyState {
  subjects: Subject[];
  goals: Goal[];
  sessions: StudySession[];
  events: CalendarEvent[];
  
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => void;
  deleteSubject: (id: string) => void;
  
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completedHours' | 'isCompleted'>) => void;
  updateGoalProgress: (id: string, hoursToAdd: number) => void;
  deleteGoal: (id: string) => void;
  
  addSession: (session: Omit<StudySession, 'id' | 'createdAt'>) => void;
  deleteSession: (id: string) => void;
  
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
  deleteEvent: (id: string) => void;
  
  resetData: () => void;
}

const initialState: StudyState = {
  subjects: [],
  goals: [],
  sessions: [],
  events: [],
  addSubject: () => {},
  deleteSubject: () => {},
  addGoal: () => {},
  updateGoalProgress: () => {},
  deleteGoal: () => {},
  addSession: () => {},
  deleteSession: () => {},
  addEvent: () => {},
  deleteEvent: () => {},
  resetData: () => {},
};

const StudyContext = createContext<StudyState>(initialState);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('studypulse_subjects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('studypulse_goals');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem('studypulse_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('studypulse_events');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('studypulse_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('studypulse_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('studypulse_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('studypulse_events', JSON.stringify(events));
  }, [events]);

  const addSubject = (subject: Omit<Subject, 'id' | 'createdAt'>) => {
    const newSubject: Subject = {
      ...subject,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setSubjects(prev => [...prev, newSubject]);
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt' | 'completedHours' | 'isCompleted'>) => {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      completedHours: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoalProgress = (id: string, hoursToAdd: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const newCompleted = g.completedHours + hoursToAdd;
        return {
          ...g,
          completedHours: newCompleted,
          isCompleted: newCompleted >= g.targetHours,
        };
      }
      return g;
    }));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addSession = (session: Omit<StudySession, 'id' | 'createdAt'>) => {
    const newSession: StudySession = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setSessions(prev => [newSession, ...prev]);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const addEvent = (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const resetData = () => {
    setSubjects([]);
    setGoals([]);
    setSessions([]);
    setEvents([]);
    localStorage.removeItem('studypulse_subjects');
    localStorage.removeItem('studypulse_goals');
    localStorage.removeItem('studypulse_sessions');
    localStorage.removeItem('studypulse_events');
  };

  return (
    <StudyContext.Provider value={{
      subjects, goals, sessions, events,
      addSubject, deleteSubject,
      addGoal, updateGoalProgress, deleteGoal,
      addSession, deleteSession,
      addEvent, deleteEvent,
      resetData
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export const useStudyData = () => useContext(StudyContext);
