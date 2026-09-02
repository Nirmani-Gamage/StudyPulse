import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface UserProfile {
  name: string;
  email: string;
  university: string;
  degree: string;
  bio: string;
}

export interface StudyPreferences {
  dailyTargetHours: number;
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
}

export interface NotificationPreferences {
  studyReminders: boolean;
  goalReminders: boolean;
  achievementAlerts: boolean;
}

interface ProfileSettings {
  profile: UserProfile;
  studyPrefs: StudyPreferences;
  notificationPrefs: NotificationPreferences;
}

const DEFAULT_SETTINGS: ProfileSettings = {
  profile: {
    name: 'Student',
    email: '',
    university: '',
    degree: '',
    bio: '',
  },
  studyPrefs: {
    dailyTargetHours: 2,
    preferredTime: 'any',
  },
  notificationPrefs: {
    studyReminders: true,
    goalReminders: true,
    achievementAlerts: true,
  }
};

export function useProfile(isAuthenticated: boolean = false) {
  const [settings, setSettings] = useState<ProfileSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const data = await api.get('/user/profile');
      if (data.user) {
        setSettings({
          profile: {
            name: data.user.name,
            email: data.user.email,
            university: data.user.university || '',
            degree: data.user.degree || '',
            bio: data.user.bio || '',
          },
          studyPrefs: data.user.studyPrefs || DEFAULT_SETTINGS.studyPrefs,
          notificationPrefs: data.user.notificationPrefs || DEFAULT_SETTINGS.notificationPrefs,
        });
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const handleLogout = () => {
      setSettings(DEFAULT_SETTINGS);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const updateProfile = async (newProfile: Partial<UserProfile>) => {
    try {
      const data = await api.put('/user/profile', newProfile);
      if (data.user) {
        setSettings(prev => ({
          ...prev,
          profile: { ...prev.profile, ...newProfile }
        }));
      }
    } catch (e) {
      console.error('Failed to update profile', e);
      throw e;
    }
  };

  const updateStudyPrefs = async (newPrefs: Partial<StudyPreferences>) => {
    try {
      const data = await api.put('/user/profile', { studyPrefs: newPrefs });
      if (data.user) {
        setSettings(prev => ({
          ...prev,
          studyPrefs: { ...prev.studyPrefs, ...newPrefs }
        }));
      }
    } catch (e) {
      console.error('Failed to update study prefs', e);
      throw e;
    }
  };

  const updateNotificationPrefs = async (newPrefs: Partial<NotificationPreferences>) => {
    try {
      const data = await api.put('/user/profile', { notificationPrefs: newPrefs });
      if (data.user) {
        setSettings(prev => ({
          ...prev,
          notificationPrefs: { ...prev.notificationPrefs, ...newPrefs }
        }));
      }
    } catch (e) {
      console.error('Failed to update notification prefs', e);
      throw e;
    }
  };

  const resetProfile = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const getInitials = () => {
    const name = settings.profile.name || 'Student';
    return name.substring(0, 2).toUpperCase();
  };

  return {
    profile: settings.profile,
    studyPrefs: settings.studyPrefs,
    notificationPrefs: settings.notificationPrefs,
    isLoading,
    updateProfile,
    updateStudyPrefs,
    updateNotificationPrefs,
    resetProfile,
    getInitials
  };
}
