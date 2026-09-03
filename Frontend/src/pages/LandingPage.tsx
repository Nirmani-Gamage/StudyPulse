import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { 
  ChevronRight, BookOpen, Clock, Target, BarChart2, Timer,
  Bell, Flame, Moon, Sun, Calendar, Play, CheckCircle2,
  Menu, X, ArrowRight, Activity, LineChart, Check
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isInitializing) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  // Smooth scroll handler
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans overflow-x-hidden selection:bg-[var(--color-primary)] selection:text-white">
      
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[var(--bg-main)]/90 backdrop-blur-md border-b border-[var(--border-color)] shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-[var(--color-primary)]">
            <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span>StudyPulse</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 font-medium text-[var(--text-secondary)]">
            <button onClick={() => scrollTo('features')} className="hover:text-[var(--text-primary)] transition-colors">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-[var(--text-primary)] transition-colors">How it works</button>
            <button onClick={() => scrollTo('analytics')} className="hover:text-[var(--text-primary)] transition-colors">Analytics</button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-[var(--card-bg)] border border-transparent hover:border-[var(--border-color)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label="Toggle theme">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link to="/login" className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors">Sign In</Link>
            <Link to="/register">
              <Button className="rounded-full shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full text-[var(--text-secondary)]" aria-label="Toggle theme">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[var(--text-primary)] p-2">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[var(--card-bg)] border-b border-[var(--border-color)] shadow-xl flex flex-col p-6 gap-4 md:hidden">
            <button onClick={() => scrollTo('features')} className="text-left font-medium text-lg text-[var(--text-secondary)] hover:text-[var(--color-primary)]">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-left font-medium text-lg text-[var(--text-secondary)] hover:text-[var(--color-primary)]">How it works</button>
            <button onClick={() => scrollTo('analytics')} className="text-left font-medium text-lg text-[var(--text-secondary)] hover:text-[var(--color-primary)]">Analytics</button>
            <hr className="border-[var(--border-color)] my-2" />
            <Link to="/login" className="font-medium text-lg text-center py-3 border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-main)] transition-colors">Sign In</Link>
            <Link to="/register">
              <Button className="w-full text-lg py-6 rounded-xl">Get Started</Button>
            </Link>
          </div>
        )}
      </nav>

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--color-primary)]/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
            <div className="flex-1 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm font-semibold mb-6">
                <Flame className="h-4 w-4" />
                <span>Student productivity, simplified</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                Study smarter. <br />
                Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">consistency.</span><br />
                See your progress.
              </h1>
              <p className="text-lg lg:text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Track your study sessions, manage goals, organize your schedule, and understand your learning habits — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 rounded-full shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40 hover:-translate-y-1 transition-all">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-14 px-8 rounded-full border-2 hover:bg-[var(--bg-main)] hover:-translate-y-1 transition-all">
                    Explore StudyPulse
                  </Button>
                </Link>
              </div>
            </div>

            {/* INTERACTIVE PRODUCT PREVIEW */}
            <div className="flex-1 w-full max-w-2xl relative z-10 group cursor-default">
              <div className="absolute -inset-1 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-secondary)] rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
              <div className="relative rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-2xl overflow-hidden transform transition-all duration-700 hover:scale-[1.02]">
                
                {/* Mock Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="mx-auto px-3 py-1 text-xs text-[var(--text-secondary)] font-medium bg-[var(--card-bg)] rounded-md border border-[var(--border-color)]">
                    Example Dashboard
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold">Good morning, Student 👋</h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">Ready for another productive day?</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-white font-bold shadow-md text-lg">
                      ST
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                    <div className="p-3 md:p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-[10px] md:text-xs font-semibold text-[var(--text-secondary)] hidden sm:inline">STREAK</span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold">14 <span className="text-xs md:text-sm text-[var(--text-secondary)] font-normal">days</span></div>
                    </div>
                    <div className="p-3 md:p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--color-secondary)] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-[var(--color-secondary)]" />
                        <span className="text-[10px] md:text-xs font-semibold text-[var(--text-secondary)] hidden sm:inline">STUDIED</span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold">42<span className="text-xs md:text-sm text-[var(--text-secondary)] font-normal">h</span></div>
                    </div>
                    <div className="p-3 md:p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-green-500 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-green-500" />
                        <span className="text-[10px] md:text-xs font-semibold text-[var(--text-secondary)] hidden sm:inline">GOALS</span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold">85<span className="text-xs md:text-sm text-[var(--text-secondary)] font-normal">%</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" /> Today's Focus
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] group-hover:bg-[var(--color-primary)]/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-medium line-through text-[var(--text-secondary)] text-sm md:text-base">Database Project</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">Completed</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] group-hover:border-[var(--color-primary)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-[var(--text-secondary)]"></div>
                          <span className="font-medium text-sm md:text-base">Networks Revision</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">2 hrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VALUE STRIP */}
        <section className="border-y border-[var(--border-color)] bg-[var(--card-bg)] py-8 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-6">Everything you need to stay consistent</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
              {[
                { icon: BarChart2, label: "Study Tracking" },
                { icon: Target, label: "Goal Management" },
                { icon: Timer, label: "Pomodoro Focus" },
                { icon: Calendar, label: "Calendar Planning" },
                { icon: LineChart, label: "Rich Analytics" },
                { icon: Bell, label: "Smart Reminders" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors cursor-default">
                  <item.icon className="h-5 w-5 opacity-70" />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 px-6 bg-[var(--bg-main)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">A simple system for success</h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">StudyPulse is built around a proven methodology to help you learn better without overcomplicating the process.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent -z-10"></div>
              
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-20 h-20 rounded-2xl bg-[var(--card-bg)] border-2 border-[var(--border-color)] group-hover:border-[var(--color-primary)] shadow-sm flex items-center justify-center text-2xl font-bold text-[var(--color-primary)] mb-6 transition-all group-hover:-translate-y-2 group-hover:shadow-[var(--color-primary)]/20">
                  01
                </div>
                <h3 className="text-xl font-bold mb-3">Plan</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">Organize your subjects, set clear targets, and schedule upcoming tasks on your calendar.</p>
              </div>
              
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-20 h-20 rounded-2xl bg-[var(--card-bg)] border-2 border-[var(--border-color)] group-hover:border-[var(--color-secondary)] shadow-sm flex items-center justify-center text-2xl font-bold text-[var(--color-secondary)] mb-6 transition-all group-hover:-translate-y-2 group-hover:shadow-[var(--color-secondary)]/20">
                  02
                </div>
                <h3 className="text-xl font-bold mb-3">Study</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">Log manual study sessions or use the integrated Pomodoro timer for deep, focused work.</p>
              </div>

              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-20 h-20 rounded-2xl bg-[var(--card-bg)] border-2 border-[var(--border-color)] group-hover:border-green-500 shadow-sm flex items-center justify-center text-2xl font-bold text-green-500 mb-6 transition-all group-hover:-translate-y-2 group-hover:shadow-green-500/20">
                  03
                </div>
                <h3 className="text-xl font-bold mb-3">Understand</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">Use rule-based insights and rich data visualizations to understand and improve your habits.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SHOWCASE */}
        <section id="features" className="py-24 bg-[var(--card-bg)] px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-32">
            
            {/* Feature 1: Study Tracking */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 font-medium text-sm">
                  <Activity className="h-4 w-4" /> Comprehensive Tracking
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Track your entire study journey</h2>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                  Log every session with precision. Keep track of what subject you studied, for how long, and attach notes to remember key concepts.
                </p>
                <ul className="space-y-4 pt-2 text-[var(--text-secondary)] font-medium">
                  <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-500" /> Subject categorization</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-500" /> Duration logging</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-500" /> Session notes</li>
                </ul>
              </div>
              <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-blue-500/5 rounded-3xl transform rotate-3 scale-105 -z-10 transition-transform hover:rotate-6"></div>
                <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-xl hover:-translate-y-1 transition-transform cursor-default">
                  <div className="space-y-6 relative">
                    <div className="absolute left-[11px] top-6 bottom-4 w-0.5 bg-[var(--border-color)]"></div>
                    
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-[var(--bg-main)]">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                      </div>
                      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 md:p-5 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-bold">Advanced Mathematics</span>
                          <span className="text-xs font-medium px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--text-secondary)] border border-[var(--border-color)]">2h 15m</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">Completed practice set 4. Need to review integrations.</p>
                      </div>
                    </div>

                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center border-2 border-[var(--bg-main)]">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"></div>
                      </div>
                      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 md:p-5 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-bold">Computer Science</span>
                          <span className="text-xs font-medium px-2 py-1 bg-[var(--bg-main)] rounded text-[var(--text-secondary)] border border-[var(--border-color)]">1h 30m</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">Read chapter on binary search trees.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Goals */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 font-medium text-sm">
                  <Target className="h-4 w-4" /> Goal Management
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Turn ambitions into reality</h2>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                  Set hourly targets for specific subjects and watch your progress bar fill up as you log study sessions. Deadlines keep you accountable.
                </p>
                <Link to="/register" className="inline-flex items-center gap-1 mt-4 text-[var(--color-primary)] font-semibold hover:underline group">
                  Start setting goals <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-green-500/5 rounded-3xl transform -rotate-3 scale-105 -z-10 transition-transform hover:-rotate-6"></div>
                <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-xl space-y-5 hover:-translate-y-1 transition-transform cursor-default">
                  
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 md:p-6 shadow-sm group">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-lg group-hover:text-green-500 transition-colors">Final Exam Prep</h4>
                      <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">Due in 5 days</span>
                    </div>
                    <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-3">
                      <span>Progress</span>
                      <span className="font-medium text-[var(--text-primary)]">32 / 40 hours</span>
                    </div>
                    <div className="h-3 w-full bg-[var(--bg-main)] rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[80%] rounded-full relative overflow-hidden transition-all duration-1000 ease-out">
                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 md:p-6 shadow-sm opacity-60">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-lg">Weekly Reading</h4>
                      <span className="text-xs font-medium px-2 py-1 bg-[var(--bg-main)] rounded border border-[var(--border-color)]">Due in 2 days</span>
                    </div>
                    <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-3">
                      <span>Progress</span>
                      <span className="font-medium text-[var(--text-primary)]">2 / 10 hours</span>
                    </div>
                    <div className="h-3 w-full bg-[var(--bg-main)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-primary)] w-[20%] rounded-full transition-all duration-1000 ease-out"></div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Feature 3: Pomodoro Showcase */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 font-medium text-sm">
                  <Timer className="h-4 w-4" /> Pomodoro Timer
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Focus mode, activated</h2>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                  Use the scientifically proven Pomodoro technique to maintain deep focus. Complete sessions automatically log to your dashboard and update your goals.
                </p>
              </div>
              <div className="flex-1 w-full relative flex justify-center">
                <div className="w-80 relative group">
                  <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse z-0 transition-all duration-700 group-hover:bg-orange-500/30"></div>
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2.5rem] p-10 shadow-2xl relative z-10 flex flex-col items-center text-center transform transition-transform hover:scale-105">
                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-8">Deep Focus</h3>
                    
                    <div className="relative w-48 h-48 flex items-center justify-center mb-10">
                      {/* Decorative SVG Ring */}
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="88" fill="none" stroke="var(--bg-main)" strokeWidth="6" />
                        <circle cx="96" cy="96" r="88" fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeDasharray="552" strokeDashoffset="150" strokeLinecap="round" className="transition-all duration-1000" />
                      </svg>
                      <span className="text-5xl font-extrabold tracking-tighter">25:00</span>
                    </div>

                    <Button size="lg" className="rounded-full w-full gap-2 shadow-lg hover:-translate-y-1 transition-all h-14 bg-orange-500 hover:bg-orange-600 text-white border-0">
                      <Play className="h-5 w-5 fill-current" /> Start Session
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ANALYTICS SHOWCASE */}
        <section id="analytics" className="py-24 px-6 bg-[var(--bg-main)]">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 font-medium text-sm">
                <LineChart className="h-4 w-4" /> Descriptive Analytics
              </div>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">Understand how you study.</h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                Our rule-based insights give you a clear picture of your study habits. Review your data, adjust your strategy, and improve naturally over time.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 pt-6">
                {[
                  "Weekly study trends",
                  "Subject distribution",
                  "Session statistics",
                  "Active study periods",
                  "Goal progress tracking"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="p-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-[var(--text-secondary)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6 md:p-8 cursor-default group hover:shadow-[var(--color-primary)]/10 transition-shadow">
                <h3 className="font-bold text-xl mb-8">Weekly Activity</h3>
                
                {/* Mock Bar Chart */}
                <div className="flex items-end justify-between h-56 gap-2 md:gap-4 mb-4 border-b border-[var(--border-color)] pb-3">
                  {[40, 70, 45, 90, 60, 30, 80].map((height, i) => (
                    <div key={i} className="w-full relative flex justify-center h-full items-end group/bar">
                      <div 
                        className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ease-out 
                          ${i === 3 ? 'bg-[var(--color-secondary)]' : 'bg-[var(--color-primary)]'} 
                          opacity-80 group-hover/bar:opacity-100 hover:scale-105 origin-bottom`}
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-[var(--text-secondary)] font-medium px-2">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="p-4 md:p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                    <div className="text-sm text-[var(--text-secondary)] mb-2">Most Studied</div>
                    <div className="font-bold flex items-center gap-2 text-lg">
                      <div className="w-3 h-3 rounded-full bg-[var(--color-secondary)]"></div> Science
                    </div>
                  </div>
                  <div className="p-4 md:p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                    <div className="text-sm text-[var(--text-secondary)] mb-2">Avg Session</div>
                    <div className="font-bold text-lg">1h 15m</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REMINDERS PREVIEW */}
        <section className="py-24 bg-[var(--color-primary)]/5 px-6 border-y border-[var(--border-color)] overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Never miss a beat</h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">Stay on top of your schedule with smart, unintrusive reminders.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 md:gap-10 relative py-8">
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xl flex items-start gap-4 w-full sm:w-80 text-left transform md:-rotate-3 hover:rotate-0 hover:-translate-y-2 transition-all duration-300">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">Study Reminder</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">Networks revision • Today 7:00 PM</p>
                  <span className="text-sm font-semibold text-[var(--color-primary)] cursor-pointer hover:underline">View Calendar</span>
                </div>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xl flex items-start gap-4 w-full sm:w-80 text-left transform md:rotate-3 hover:rotate-0 hover:-translate-y-2 transition-all duration-300 sm:mt-12 z-10">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl shrink-0">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">Goal Deadline</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">Database Project is due tomorrow.</p>
                  <span className="text-sm font-semibold text-[var(--color-primary)] cursor-pointer hover:underline">Update Progress</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 px-6 text-center bg-[var(--bg-main)]">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="inline-block p-4 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-4">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">Ready to transform your study habits?</h2>
            <p className="text-xl text-[var(--text-secondary)]">Join StudyPulse today and take control of your academic journey.</p>
            <div className="pt-4">
              <Link to="/register" className="inline-block">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg shadow-[var(--color-primary)]/20 hover:-translate-y-1 transition-transform">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[var(--card-bg)] border-t border-[var(--border-color)] py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-2 font-bold text-2xl text-[var(--color-primary)]">
              <BookOpen className="h-7 w-7" />
              <span>StudyPulse</span>
            </div>
            <p className="text-[var(--text-secondary)] max-w-sm text-lg">
              Study smarter. Stay consistent. The ultimate student productivity platform.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Product</h4>
            <ul className="space-y-4 text-[var(--text-secondary)] font-medium">
              <li><button onClick={() => scrollTo('features')} className="hover:text-[var(--color-primary)] transition-colors">Features</button></li>
              <li><button onClick={() => scrollTo('analytics')} className="hover:text-[var(--color-primary)] transition-colors">Analytics</button></li>
              <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-[var(--color-primary)] transition-colors">How it works</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Account</h4>
            <ul className="space-y-4 text-[var(--text-secondary)] font-medium">
              <li><Link to="/login" className="hover:text-[var(--color-primary)] transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-[var(--color-primary)] transition-colors">Get Started</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[var(--border-color)] text-center text-[var(--text-secondary)] font-medium flex flex-col md:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} StudyPulse. All rights reserved.</span>
          <div className="flex items-center gap-6 text-sm">
            <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
