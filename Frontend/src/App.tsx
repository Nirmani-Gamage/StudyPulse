import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudyProvider, useStudyData } from './context/StudyContext';
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
// Phase 3 placeholders
import StudySessions from './pages/dashboard/StudySessions';
import Pomodoro from './pages/dashboard/Pomodoro';
import Subjects from './pages/dashboard/Subjects';
import Goals from './pages/dashboard/Goals';
import CalendarView from './pages/dashboard/Calendar';
import Analytics from './pages/dashboard/Analytics';
import Settings from './pages/dashboard/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const { isLoading: isStudyDataLoading } = useStudyData();

  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center text-[var(--text-secondary)]">Loading application...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isStudyDataLoading) {
    return <div className="flex h-screen items-center justify-center text-[var(--text-secondary)]">Loading your study data...</div>;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="studypulse-theme">
      <BrowserRouter>
        <AuthProvider>
          <StudyProvider>
            <Routes>
            <Route path="/" element={<RootLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Auth Routes */}
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="sessions" element={<StudySessions />} />
                <Route path="pomodoro" element={<Pomodoro />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="goals" element={<Goals />} />
                <Route path="calendar" element={<CalendarView />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
            </Routes>
          </StudyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
