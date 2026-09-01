import { Search, Bell, Menu, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { useProfile } from '../../hooks/useProfile';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const { getInitials } = useProfile();
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

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
        
        <Button variant="ghost" size="icon" className="relative text-[var(--text-secondary)]" title="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--color-error)] border-2 border-[var(--card-bg)]"></span>
        </Button>
        
        <div className="h-9 w-9 rounded-full bg-[var(--color-secondary)] overflow-hidden cursor-pointer hover:ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--card-bg)] transition-all ml-1 sm:ml-2">
          <div className="h-full w-full flex items-center justify-center text-white text-sm font-medium">
            {getInitials()}
          </div>
        </div>
      </div>
    </header>
  );
}
