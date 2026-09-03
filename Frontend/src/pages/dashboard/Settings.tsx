import { useState, useEffect } from 'react';

import { 
  User, Mail, Building, GraduationCap, FileText, 
  Moon, Sun, Laptop, AlertTriangle, LogOut,
  Target, Clock, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import { useStudyData } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { resetData } = useStudyData();
  const { 
    profile, studyPrefs, notificationPrefs, 
    updateProfile, updateStudyPrefs, updateNotificationPrefs, getInitials 
  } = useProfile();

  // Local state for profile form
  const [formData, setFormData] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');

  // Local state for modal
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSaveMessage('');
    try {
      await updateProfile(formData);
      setSaveMessage('Profile saved successfully.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = () => {
    resetData();
    setShowResetModal(false);
    window.location.reload(); // Refresh state cleanly
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Settings</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage your profile and StudyPulse preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile */}
        <div className="lg:col-span-2 space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5">This information will be displayed on your dashboard.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-100 text-red-700 rounded text-sm font-medium">
                    {error}
                  </div>
                )}
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="h-20 w-20 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-2xl font-bold">
                    {getInitials()}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">{profile.name || 'Student'}</h3>
                    <p className="text-[var(--text-secondary)]">{profile.degree || 'Add your degree'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Full Name <span className="text-[var(--color-error)]">*</span></label>
                    <Input 
                      name="name" 
                      value={formData.name} 
                      onChange={handleProfileChange} 
                      icon={<User className="h-4 w-4" />}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Email</label>
                    <Input 
                      name="email" 
                      type="email"
                      value={formData.email} 
                      onChange={handleProfileChange} 
                      icon={<Mail className="h-4 w-4" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">University</label>
                    <Input 
                      name="university" 
                      value={formData.university} 
                      onChange={handleProfileChange} 
                      icon={<Building className="h-4 w-4" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Degree / Course</label>
                    <Input 
                      name="degree" 
                      value={formData.degree} 
                      onChange={handleProfileChange} 
                      icon={<GraduationCap className="h-4 w-4" />}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Short Bio</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 text-[var(--text-secondary)]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <textarea 
                      name="bio"
                      value={formData.bio}
                      onChange={handleProfileChange}
                      className="flex min-h-[100px] w-full rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 pl-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-200 resize-y"
                      placeholder="Tell us a bit about your study goals..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                  <p className="text-sm font-medium text-[var(--color-success)] flex items-center gap-1 min-h-[20px]">
                    {saveMessage && <><CheckCircle2 className="h-4 w-4" /> {saveMessage}</>}
                  </p>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Study Preferences</CardTitle>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5">Tailor the app to your learning style.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                  <Target className="h-4 w-4 text-[var(--color-primary)]" />
                  Daily Study Target
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(hours => (
                    <button
                      key={hours}
                      onClick={() => updateStudyPrefs({ dailyTargetHours: hours })}
                      className={`py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
                        studyPrefs.dailyTargetHours === hours 
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' 
                          : 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      {hours} {hours === 5 ? 'hours+' : hours === 1 ? 'hour' : 'hours'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--color-primary)]" />
                  Preferred Study Time
                </label>
                <select 
                  value={studyPrefs.preferredTime}
                  onChange={(e) => updateStudyPrefs({ preferredTime: e.target.value as any })}
                  className="flex h-10 w-full md:max-w-xs items-center justify-between rounded-md border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="any">Anytime</option>
                  <option value="morning">Morning (5 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                  <option value="evening">Evening (5 PM - 9 PM)</option>
                  <option value="night">Night (9 PM - 5 AM)</option>
                </select>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Right Column: Settings & Account */}
        <div className="space-y-8">
          
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5">Customize the interface.</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    theme === 'light' 
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                      : 'border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-color)]'
                  }`}
                >
                  <Sun className="h-5 w-5" />
                  <span className="font-medium">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    theme === 'dark' 
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                      : 'border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-color)]'
                  }`}
                >
                  <Moon className="h-5 w-5" />
                  <span className="font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    theme === 'system' 
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                      : 'border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-color)]'
                  }`}
                >
                  <Laptop className="h-5 w-5" />
                  <span className="font-medium">System</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5">Manage your alerts.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Study Reminders</label>
                  <p className="text-xs text-[var(--text-secondary)]">Daily notifications to study.</p>
                </div>
                <button 
                  onClick={() => updateNotificationPrefs({ studyReminders: !notificationPrefs.studyReminders })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
                    notificationPrefs.studyReminders ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-color)]'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationPrefs.studyReminders ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Goal Deadlines</label>
                  <p className="text-xs text-[var(--text-secondary)]">Alerts for approaching goals.</p>
                </div>
                <button 
                  onClick={() => updateNotificationPrefs({ goalReminders: !notificationPrefs.goalReminders })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
                    notificationPrefs.goalReminders ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-color)]'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationPrefs.goalReminders ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Achievements</label>
                  <p className="text-xs text-[var(--text-secondary)]">Celebrate milestones.</p>
                </div>
                <button 
                  onClick={() => updateNotificationPrefs({ achievementAlerts: !notificationPrefs.achievementAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
                    notificationPrefs.achievementAlerts ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-color)]'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationPrefs.achievementAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

            </CardContent>
          </Card>

          {/* Account */}
          <Card className="border-[var(--color-error)]/20">
            <CardHeader>
              <CardTitle className="text-[var(--color-error)]">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-[var(--text-secondary)]"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-[var(--color-error)] border-[var(--color-error)]/30 hover:bg-[var(--color-error)]/10"
                onClick={() => setShowResetModal(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Reset Study Data
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[var(--radius-card)] shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-[var(--color-error)] mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-bold">Reset All Study Data</h3>
              </div>
              <div className="text-[var(--text-secondary)] text-sm space-y-2">
                <p>Are you absolutely sure you want to do this?</p>
                <p>This action will permanently delete:</p>
                <ul className="list-disc pl-5 font-medium text-[var(--text-primary)]">
                  <li>All study sessions</li>
                  <li>All subjects</li>
                  <li>All goals</li>
                  <li>All calendar events</li>
                </ul>
                <p className="pt-2">Your profile and settings will <span className="font-bold underline">not</span> be deleted.</p>
              </div>
            </div>
            <div className="bg-[var(--bg-color)] p-4 flex justify-end gap-3 border-t border-[var(--border-color)]">
              <Button variant="outline" onClick={() => setShowResetModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleResetData}
                className="bg-[var(--color-error)] hover:bg-[var(--color-error)]/90 text-white"
              >
                Yes, Reset Everything
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
