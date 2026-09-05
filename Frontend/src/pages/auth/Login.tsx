import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (/[A-Z]/.test(email)) {
      setError('Email cannot contain capital letters');
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
      <div className="rounded-[var(--radius-card)] bg-[var(--card-bg)] p-8 shadow-soft border border-[var(--border-color)] w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login to StudyPulse</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[var(--radius-base)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-shadow"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[var(--radius-base)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-shadow"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[var(--color-primary)] text-white py-2 rounded-[var(--radius-btn)] font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Don't have an account? <Link to="/register" className="text-[var(--color-primary)] hover:underline">Register here</Link>
        </p>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
