import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] transition-colors duration-300">
      <Outlet />
    </div>
  );
}
