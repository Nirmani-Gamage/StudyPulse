import { useState, useEffect } from 'react';

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

export function useProfile() {
  const [settings, setSettings] = useState<ProfileSettings>(() => {
    try {
      const saved = localStorage.getItem('studypulse_profile_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
      
      // Fallback to legacy studypulse_user_name if it exists
      const legacyName = localStorage.getItem('studypulse_user_name');
      if (legacyName) {
        const migrated = {
          ...DEFAULT_SETTINGS,
          profile: { ...DEFAULT_SETTINGS.profile, name: legacyName }
        };
        localStorage.setItem('studypulse_profile_settings', JSON.stringify(migrated));
        return migrated;
      }
    } catch (e) {
      console.error('Failed to parse profile settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const saved = localStorage.getItem('studypulse_profile_settings');
        if (saved) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        }
      } catch (e) {
        console.error('Failed to update profile settings from event', e);
      }
    };

    window.addEventListener('studypulse_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('studypulse_profile_updated', handleProfileUpdate);
  }, []);

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    const newSettings = { ...settings, profile: { ...settings.profile, ...newProfile } };
    setSettings(newSettings);
    localStorage.setItem('studypulse_profile_settings', JSON.stringify(newSettings));
    localStorage.setItem('studypulse_user_name', newSettings.profile.name); // Keep legacy in sync
    window.dispatchEvent(new Event('studypulse_profile_updated'));
  };

  const updateStudyPrefs = (newPrefs: Partial<StudyPreferences>) => {
    const newSettings = { ...settings, studyPrefs: { ...settings.studyPrefs, ...newPrefs } };
    setSettings(newSettings);
    localStorage.setItem('studypulse_profile_settings', JSON.stringify(newSettings));
    window.dispatchEvent(new Event('studypulse_profile_updated'));
  };

  const updateNotificationPrefs = (newPrefs: Partial<NotificationPreferences>) => {
    const newSettings = { ...settings, notificationPrefs: { ...settings.notificationPrefs, ...newPrefs } };
    setSettings(newSettings);
    localStorage.setItem('studypulse_profile_settings', JSON.stringify(newSettings));
    window.dispatchEvent(new Event('studypulse_profile_updated'));
  };

  const getInitials = () => {
    const name = settings.profile.name || 'Student';
    return name.substring(0, 2).toUpperCase();
  };

  return {
    profile: settings.profile,
    studyPrefs: settings.studyPrefs,
    notificationPrefs: settings.notificationPrefs,
    updateProfile,
    updateStudyPrefs,
    updateNotificationPrefs,
    getInitials
  };
}
