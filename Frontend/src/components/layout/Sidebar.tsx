import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Library, 
  Target, 
  BarChart2, 
  Calendar, 
  Award, 
  Settings, 
  HelpCircle,
  X,
  Timer
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Study Sessions', icon: BookOpen, path: '/dashboard/sessions' },
  { name: 'Pomodoro', icon: Timer, path: '/dashboard/pomodoro' },
  { name: 'Subjects', icon: Library, path: '/dashboard/subjects' },
  { name: 'Goals', icon: Target, path: '/dashboard/goals' },
  { name: 'Analytics', icon: BarChart2, path: '/dashboard/analytics' },
  { name: 'Calendar', icon: Calendar, path: '/dashboard/calendar' },
  { name: 'Achievements', icon: Award, path: '/dashboard/achievements' },
];

const bottomNavItems = [
  { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  { name: 'Help', icon: HelpCircle, path: '/dashboard/help' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[var(--card-bg)] border-r border-[var(--border-color)] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">StudyPulse</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" 
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-color)] hover:text-[var(--text-primary)]"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--border-color)] space-y-1 shrink-0">
           {bottomNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" 
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-color)] hover:text-[var(--text-primary)]"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
}
