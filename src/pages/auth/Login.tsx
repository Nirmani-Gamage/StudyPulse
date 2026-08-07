export default function Login() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="rounded-[var(--radius-card)] bg-[var(--card-bg)] p-8 shadow-soft border border-[var(--border-color)] min-w-[320px]">
        <h2 className="text-2xl font-bold text-center mb-6">Login to StudyPulse</h2>
        <p className="text-center text-[var(--text-secondary)] mb-4">Mock Auth Form here.</p>
        <button className="w-full bg-[var(--color-primary)] text-white py-2 rounded-[var(--radius-btn)] font-medium hover:bg-[var(--color-secondary)] transition-colors">Login Placeholder</button>
      </div>
    </div>
  );
}
