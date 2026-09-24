import { useState, useMemo } from 'react';
import { 
  BookOpen, Calendar as CalendarIcon, Clock, CheckCircle2, 
  Target, Plus, ChevronRight, ChevronLeft, Sparkles, Activity,
  TrendingUp, CalendarDays, Edit3, Trash2
} from 'lucide-react';
import { useStudyData } from '../../context/StudyContext';
import { JournalFormModal } from '../../components/journal/JournalFormModal';
import { JournalDetailModal } from '../../components/journal/JournalDetailModal';
import type { JournalEntry } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

export function StudyJournal() {
  const { journalEntries, sessions, dailyTasks, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useStudyData();
  
  // Date selection state
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  // Helper to format as YYYY-MM-DD reliably in local time
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const selectedDateStr = getLocalDateString(selectedDateObj);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | undefined>(undefined);

  // Today's specific data
  const todayEntry = useMemo(() => {
    return journalEntries.find(e => {
      // Normalize backend ISO strings to local YYYY-MM-DD
      const entryDateStr = getLocalDateString(new Date(e.date));
      return entryDateStr === selectedDateStr;
    });
  }, [journalEntries, selectedDateStr]);

  const todaySessions = useMemo(() => {
    return sessions.filter(s => {
      const sessionDateStr = getLocalDateString(new Date(s.startTime));
      return sessionDateStr === selectedDateStr;
    });
  }, [sessions, selectedDateStr]);

  const todayTasks = useMemo(() => {
    return dailyTasks.filter(t => t.date === selectedDateStr);
  }, [dailyTasks, selectedDateStr]);

  // Derived metrics
  const totalStudyMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const studyHours = Math.floor(totalStudyMinutes / 60);
  const studyMins = totalStudyMinutes % 60;
  
  const uniqueSubjects = new Set(todaySessions.map(s => s.subjectId)).size;
  
  const completedTasks = todayTasks.filter(t => t.completionStatus === 'completed' || t.completed).length;
  const totalTasks = todayTasks.length;

  // Handlers
  const handlePrevDay = () => {
    const prev = new Date(selectedDateObj);
    prev.setDate(prev.getDate() - 1);
    setSelectedDateObj(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDateObj);
    next.setDate(next.getDate() + 1);
    setSelectedDateObj(next);
  };
  
  const handleToday = () => {
    setSelectedDateObj(new Date());
  };

  const handleSaveJournal = async (data: Partial<JournalEntry>) => {
    if (editingEntry) {
      await updateJournalEntry(editingEntry.id, data);
    } else {
      await addJournalEntry(data as any);
    }
    setEditingEntry(undefined);
  };

  const openNewForm = () => {
    setEditingEntry(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const openDetail = (entry: JournalEntry) => {
    setViewingEntry(entry);
    setIsDetailOpen(true);
  };

  // Determine if selected date is today
  const isToday = selectedDateStr === getLocalDateString(new Date());

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const cardHoverVariants = {
    hover: { 
      y: -5,
      scale: 1.02,
      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  };

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-10 pb-12"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Header & Date Navigation */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[var(--color-primary)]/10 rounded-xl">
              <BookOpen className="w-7 h-7 text-[var(--color-primary)]" />
            </div>
            <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Study Journal
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] text-lg">Reflect on your progress, capture insights, and plan ahead.</p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-[var(--bg-main)] p-2 rounded-2xl shadow-sm border border-[var(--border-color)]">
          <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-10 w-10 rounded-xl hover:bg-[var(--color-primary)]/10 text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 px-4 font-semibold text-[var(--text-primary)] min-w-[150px] justify-center text-sm">
            <CalendarDays className="w-5 h-5 text-[var(--color-primary)]" />
            {isToday ? 'Today' : selectedDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextDay} 
            disabled={isToday}
            className={`h-10 w-10 rounded-xl hover:bg-[var(--color-primary)]/10 text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors ${isToday ? 'opacity-30' : ''}`}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          {!isToday && (
            <div className="pl-2 ml-1 border-l border-[var(--border-color)]">
              <Button variant="ghost" onClick={handleToday} className="h-10 rounded-xl text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 font-bold px-4">
                Today
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Selected Day Reflection Banner */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-[2rem] p-8 md:p-10 shadow-xl border border-white/10" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)' }}>
          {/* Animated Background Elements */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-300 blur-3xl"
          />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white/90 text-sm font-semibold mb-4">
                <Sparkles className="w-4 h-4" />
                {todayEntry ? 'Reflection Logged' : 'Daily Insight'}
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
                {todayEntry ? 'Great job today!' : 'How did your studies go?'}
              </h2>
              <p className="text-blue-100/90 text-lg max-w-2xl font-medium">
                {todayEntry 
                  ? 'Your reflection for this day is saved. Reviewing your thoughts helps reinforce learning and build better habits.' 
                  : 'Take a moment to write down what you learned, what challenged you, and how you feel about your progress.'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
              {todayEntry ? (
                <>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openDetail(todayEntry)}
                    className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-md transition-colors border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    Read Entry
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openEditForm(todayEntry)}
                    className="px-6 py-3.5 bg-white text-[var(--color-primary)] font-bold rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-5 h-5" />
                    Edit Journal
                  </motion.button>
                </>
              ) : (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openNewForm}
                  className="px-8 py-4 bg-white text-[var(--color-primary)] font-bold text-lg rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-6 h-6" />
                  Write Journal
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Today's Study Activity */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Activity className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Activity Overview</h2>
        </div>
        
        {totalStudyMinutes === 0 && totalTasks === 0 ? (
          <div className="text-center py-12 px-4 bg-[var(--card-bg)] rounded-[2rem] border-2 border-dashed border-[var(--border-color)]">
            <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-[var(--color-primary)] opacity-50" />
            </div>
            <p className="text-[var(--text-secondary)] text-lg font-medium">No study activity recorded for this day yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                label: 'Study Time', 
                value: `${studyHours > 0 ? `${studyHours}h ` : ''}${studyMins}m`,
                icon: Clock,
                color: 'var(--color-primary)',
                bg: 'bg-blue-500/10'
              },
              { 
                label: 'Subjects', 
                value: uniqueSubjects,
                icon: BookOpen,
                color: '#a855f7',
                bg: 'bg-purple-500/10'
              },
              { 
                label: 'Tasks Done', 
                value: `${completedTasks} / ${totalTasks}`,
                icon: CheckCircle2,
                color: 'var(--color-success)',
                bg: 'bg-green-500/10'
              },
              { 
                label: 'Focus Score', 
                value: 'N/A',
                icon: Target,
                color: 'var(--color-warning)',
                bg: 'bg-orange-500/10'
              }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 bg-[var(--card-bg)] rounded-[1.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40`} style={{ backgroundColor: stat.color }} />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-4xl font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight relative z-10">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Journal History */}
      <motion.div variants={itemVariants} className="pt-4">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Past Reflections</h2>
          </div>
        </div>

        {journalEntries.length === 0 ? (
          <Card className="shadow-sm border-dashed border-[var(--border-color)] bg-transparent rounded-[2rem]">
            <CardContent className="text-center py-20 px-6">
              <div className="h-20 w-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Your study story starts here</h3>
              <p className="text-[var(--text-secondary)] max-w-lg mx-auto mb-8 text-lg">
                Take a few minutes after studying to record what you learned, what challenged you, and what you want to improve tomorrow.
              </p>
              <Button 
                size="lg"
                onClick={() => {
                  setSelectedDateObj(new Date());
                  openNewForm();
                }}
                className="shadow-lg font-bold rounded-xl text-base px-8 h-14"
              >
                <Plus className="w-5 h-5 mr-2" />
                Write Your First Journal Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {journalEntries.map((entry, idx) => {
                const entryDate = new Date(entry.date);
                return (
                  <motion.div 
                    key={entry.id} 
                    variants={itemVariants}
                    whileHover="hover"
                    custom={idx}
                    layout
                  >
                    <motion.div 
                      variants={cardHoverVariants}
                      className="h-full flex flex-col bg-[var(--card-bg)] rounded-[2rem] shadow-sm border border-[var(--border-color)] cursor-pointer overflow-hidden group"
                      onClick={() => openDetail(entry)}
                    >
                      <div className="p-6 md:p-8 flex flex-col h-full relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[var(--color-primary)]">
                              {entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-xs font-semibold text-[var(--text-secondary)]">
                              {entryDate.getFullYear()}
                            </span>
                          </div>
                          
                          {(entry.mood || entry.productivity) && (
                            <div className="flex gap-2">
                              {entry.mood && (
                                <div className="px-3 py-1.5 rounded-xl bg-[var(--color-warning)]/10 text-[var(--color-warning)] text-xs font-bold flex items-center gap-1.5 border border-[var(--color-warning)]/20 shadow-sm">
                                  <span>{entry.mood}</span>
                                </div>
                              )}
                              {entry.productivity && (
                                <div className="px-3 py-1.5 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold flex items-center gap-1.5 border border-[var(--color-primary)]/20 shadow-sm">
                                  <span>{entry.productivity}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors duration-300 leading-tight">
                          {entry.title}
                        </h3>
                        
                        {entry.content && (
                          <p className="text-[var(--text-secondary)] text-base line-clamp-3 mb-6 flex-1 leading-relaxed">
                            "{entry.content}"
                          </p>
                        )}
                        
                        <div className="mt-auto pt-5 border-t border-[var(--border-color)] flex items-center justify-between text-sm text-[var(--text-secondary)] font-bold">
                          <span className="group-hover:text-[var(--color-primary)] transition-colors flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Read Entry
                          </span>
                          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors duration-300">
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover effect gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <JournalFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveJournal}
        initialData={editingEntry}
        selectedDate={selectedDateStr}
      />

      {viewingEntry && (
        <JournalDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setViewingEntry(undefined);
          }}
          entry={viewingEntry}
          onEdit={() => {
            setIsDetailOpen(false);
            openEditForm(viewingEntry);
          }}
          onDelete={async () => {
            await deleteJournalEntry(viewingEntry.id);
            setIsDetailOpen(false);
            setViewingEntry(undefined);
          }}
        />
      )}
    </motion.div>
  );
}
