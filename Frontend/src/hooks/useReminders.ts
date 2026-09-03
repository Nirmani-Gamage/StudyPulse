import { useState, useEffect } from 'react';
import { useStudyData } from '../context/StudyContext';
import { useProfile } from './useProfile';
import { useAuth } from '../context/AuthContext';

export interface Reminder {
  id: string;
  type: 'study' | 'goal';
  title: string;
  message: string;
  timestamp: string;
}

export function useReminders() {
  const { goals, events } = useStudyData();
  const { isAuthenticated } = useAuth();
  
  // Only fetch profile settings if authenticated to avoid unnecessary requests
  const { notificationPrefs } = useProfile(isAuthenticated);
  
  const [shownReminders, setShownReminders] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('studypulse_shown_reminders');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem('studypulse_shown_reminders', JSON.stringify(shownReminders));
  }, [shownReminders]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const newReminders: Reminder[] = [];
    
    // Use consistent date handling (YYYY-MM-DD)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Goal Reminders
    if (notificationPrefs.goalReminders) {
      goals.forEach(goal => {
        if (!goal.isCompleted) {
          if (goal.deadline < todayStr) {
            newReminders.push({
              id: `goal-overdue-${goal.id}-${todayStr}`, // include date to renew reminder each day if needed, or just goal.id to only show once ever
              type: 'goal',
              title: '🎯 Goal Reminder',
              message: `Your "${goal.title}" goal is overdue.`,
              timestamp: new Date().toISOString()
            });
          } else if (goal.deadline === todayStr) {
            newReminders.push({
              id: `goal-due-today-${goal.id}`,
              type: 'goal',
              title: '🎯 Goal Reminder',
              message: `Your "${goal.title}" goal is due today.`,
              timestamp: new Date().toISOString()
            });
          } else if (goal.deadline === tomorrowStr) {
            newReminders.push({
              id: `goal-due-tomorrow-${goal.id}`,
              type: 'goal',
              title: '🎯 Goal Reminder',
              message: `Your "${goal.title}" goal is due tomorrow.`,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    }

    // Study Reminders
    if (notificationPrefs.studyReminders) {
      events.forEach(event => {
        if (event.type === 'study') {
          if (event.date === todayStr) {
            newReminders.push({
              id: `study-today-${event.id}`,
              type: 'study',
              title: '📚 Study Reminder',
              message: `You planned to study "${event.title}" today.`,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    }

    // Filter out dismissed
    const currentActive = newReminders.filter(r => !dismissed[r.id]);
    setActiveReminders(currentActive);

    // Browser Notifications (only trigger for newly shown ones)
    if ('Notification' in window && Notification.permission === 'granted') {
      currentActive.forEach(r => {
        if (!shownReminders[r.id]) {
          new Notification(r.title, { body: r.message });
          setShownReminders(prev => ({ ...prev, [r.id]: true }));
        }
      });
    } else {
       // Even if no browser notification, mark as shown so we don't spam if they ever grant it later
       currentActive.forEach(r => {
         if (!shownReminders[r.id]) {
           setShownReminders(prev => ({ ...prev, [r.id]: true }));
         }
       });
    }

  }, [goals, events, notificationPrefs, isAuthenticated, shownReminders, dismissed]);

  const dismissReminder = (id: string) => {
    setDismissed(prev => ({ ...prev, [id]: true }));
  };

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  return { activeReminders, dismissReminder, requestPermission };
}
