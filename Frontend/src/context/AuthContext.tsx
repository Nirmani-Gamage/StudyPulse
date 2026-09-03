import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if token exists on mount
    const checkAuth = () => {
      const token = localStorage.getItem('studypulse_token');
      const savedUser = localStorage.getItem('studypulse_user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (e) {
          localStorage.removeItem('studypulse_token');
          localStorage.removeItem('studypulse_user');
        }
      }
      setIsInitializing(false);
    };
    
    checkAuth();

    // Listen for unauthorized events from api.ts
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('studypulse_token', token);
    localStorage.setItem('studypulse_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('studypulse_token');
    localStorage.removeItem('studypulse_user');
    setUser(null);
    setIsAuthenticated(false);
    
    // Dispatch event so other contexts can reset their state
    window.dispatchEvent(new Event('auth:logout'));

    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
