import { Search, Bell, Menu, Moon, Sun, X, Check, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { useProfile } from '../../hooks/useProfile';
import { useReminders } from '../../hooks/useReminders';
import { useAuth } from '../../context/AuthContext';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const { getInitials } = useProfile();
  const { activeReminders, dismissReminder, requestPermission } = useReminders();
  const { user, logout } = useAuth();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setShowAvatarMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef, avatarRef]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowAvatarMenu(false);
    if (!showNotifications) {
      requestPermission();
    }
  };

  const handleAvatarClick = () => {
    setShowAvatarMenu(!showAvatarMenu);
    setShowNotifications(false);
  };

  // Determine actual initials using AuthContext user name first, falling back to profile
  const actualInitials = user?.name 
    ? user.name.substring(0, 2).toUpperCase() 
    : getInitials();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-color)] bg-[var(--card-bg)] px-4 sm:px-6">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:block max-w-md w-full">
          <Input 
            placeholder="Search resources, goals, subjects..." 
            icon={<Search className="h-4 w-4" />} 
            className="h-10 bg-[var(--bg-color)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="text-[var(--text-secondary)]"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        
        <div className="relative" ref={notificationRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`relative text-[var(--text-secondary)] ${showNotifications ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : ''}`}
            title="Notifications"
            onClick={handleNotificationClick}
          >
            <Bell className="h-5 w-5" />
            {activeReminders.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-error)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-error)] border border-[var(--card-bg)]"></span>
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-[var(--radius-card)] bg-[var(--card-bg)] shadow-xl border border-[var(--border-color)] overflow-hidden z-50">
              <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-color)]">
                <h3 className="font-bold text-[var(--text-primary)] text-sm">Notifications</h3>
                <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeReminders.length}
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {activeReminders.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center">
                    <Check className="h-8 w-8 text-[var(--color-success)]/50 mb-2" />
                    <p className="text-[var(--text-secondary)] text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-color)]">
                    {activeReminders.map(reminder => (
                      <div key={reminder.id} className="p-4 hover:bg-[var(--bg-color)] transition-colors relative group">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{reminder.title}</h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{reminder.message}</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissReminder(reminder.id);
                          }}
                          className="absolute top-4 right-4 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--color-error)]"
                          title="Dismiss"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="relative" ref={avatarRef}>
          <div 
            onClick={handleAvatarClick}
            className="h-9 w-9 rounded-full bg-[var(--color-secondary)] overflow-hidden cursor-pointer hover:ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--card-bg)] transition-all ml-1 sm:ml-2"
          >
            <div className="h-full w-full flex items-center justify-center text-white text-sm font-medium">
              {actualInitials}
            </div>
          </div>

          {showAvatarMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-[var(--radius-card)] bg-[var(--card-bg)] shadow-xl border border-[var(--border-color)] overflow-hidden z-50 py-1">
              <div className="px-4 py-2 border-b border-[var(--border-color)] mb-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name || 'Student'}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{user?.email || 'No email'}</p>
              </div>
              <button 
                onClick={() => {
                  setShowAvatarMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10 flex items-center transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
