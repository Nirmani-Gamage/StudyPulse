import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { TopNav } from '../components/layout/TopNav';
import { useStudyData } from '../../context/StudyContext';
import { AlertCircle } from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { error, refreshData, subjects, goals, sessions, events, isLoading } = useStudyData();

  const hasData = subjects.length > 0 || goals.length > 0 || sessions.length > 0 || events.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-color)] text-[var(--text-primary)]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {error && hasData && (
              <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-[var(--radius-base)] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{error}</span>
                </div>
                <button 
                  onClick={() => refreshData()}
                  disabled={isLoading}
                  className="px-3 py-1 bg-white text-red-700 border border-red-200 rounded text-sm hover:bg-red-50 font-semibold disabled:opacity-50"
                >
                  {isLoading ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            )}

            {error && !hasData && !isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-red-100 rounded-lg bg-red-50/50 mt-8">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <h2 className="text-xl font-bold text-red-800 mb-2">Unable to load your study data.</h2>
                <p className="text-red-600 mb-6 max-w-md">Please check your connection and try again.</p>
                <button 
                  onClick={() => refreshData()}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium shadow-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
