import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { StudyProvider } from './context/StudyContext';
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

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="studypulse-theme">
      <StudyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Auth Routes */}
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              
              {/* Protected Routes (mocked for now) */}
              <Route path="dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="sessions" element={<StudySessions />} />
                <Route path="pomodoro" element={<Pomodoro />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="goals" element={<Goals />} />
                <Route path="calendar" element={<CalendarView />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </StudyProvider>
    </ThemeProvider>
  );
}

export default App;
