import { useState, useMemo } from 'react';
import { BookOpen, Calendar as CalendarIcon, Clock, CheckCircle2, Target, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { useStudyData } from '../../context/StudyContext';
import { JournalFormModal } from '../../components/journal/JournalFormModal';
import { JournalDetailModal } from '../../components/journal/JournalDetailModal';
import type { JournalEntry } from '../../types';
import { motion } from 'framer-motion';
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
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-8 pb-12"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Header & Date Navigation */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
            Study Journal
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Reflect on your study day, capture what you learned, and plan what comes next.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[var(--card-bg)] p-1.5 rounded-[var(--radius-base)] shadow-sm border border-[var(--border-color)]">
          <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-8 w-8 text-[var(--text-secondary)]">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 font-medium text-[var(--text-primary)] min-w-[140px] justify-center text-sm">
            <CalendarIcon className="w-4 h-4 text-[var(--color-primary)]" />
            {isToday ? 'Today' : selectedDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextDay} 
            disabled={isToday}
            className={`h-8 w-8 text-[var(--text-secondary)] ${isToday ? 'opacity-30' : ''}`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isToday && (
            <div className="pl-2 ml-1 border-l border-[var(--border-color)]">
              <Button variant="ghost" onClick={handleToday} className="text-xs h-8 text-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 font-medium">
                Today
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Selected Day Reflection Prompt */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-r from-[var(--color-primary)] to-indigo-600 rounded-[var(--radius-card)] p-8 text-white shadow-lg relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white opacity-10 blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">
                {todayEntry ? 'Reflection Complete' : 'Daily Reflection'}
              </h2>
              <p className="text-blue-100 max-w-xl">
                {todayEntry 
                  ? 'Your reflection for this day is saved and ready to review.' 
                  : 'Take a few minutes to reflect on your study day. What did you learn?'}
              </p>
            </div>
            
            <div className="flex gap-3 shrink-0">
              {todayEntry ? (
                <>
                  <button 
                    onClick={() => openDetail(todayEntry)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-[var(--radius-base)] backdrop-blur-sm transition-colors border border-white/20 text-sm"
                  >
                    View Entry
                  </button>
                  <button 
                    onClick={() => openEditForm(todayEntry)}
                    className="px-5 py-2.5 bg-white text-[var(--color-primary)] font-medium rounded-[var(--radius-base)] shadow-md hover:bg-white/90 transition-colors text-sm"
                  >
                    Edit Reflection
                  </button>
                </>
              ) : (
                <button 
                  onClick={openNewForm}
                  className="px-5 py-2.5 bg-white text-[var(--color-primary)] font-medium rounded-[var(--radius-base)] shadow-md hover:bg-white/90 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Write Journal Entry
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Today's Study Activity */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-soft border-[var(--border-color)] overflow-hidden">
          <div className="bg-[var(--bg-main)]/50 px-6 py-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Study Activity for {isToday ? 'Today' : selectedDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</h2>
          </div>
          
          <CardContent className="p-6">
            {totalStudyMinutes === 0 && totalTasks === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)] bg-[var(--bg-main)] rounded-[var(--radius-base)] border border-dashed border-[var(--border-color)]">
                <p>No study activity recorded for this day yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 bg-[var(--color-primary)]/5 rounded-[var(--radius-base)] border border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-colors">
                  <div className="flex items-center gap-2 text-[var(--color-primary)] mb-3">
                    <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/10">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Study Time</span>
                  </div>
                  <p className="text-3xl font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight">
                    {studyHours > 0 ? `${studyHours}h ` : ''}{studyMins}m
                  </p>
                </div>
                
                <div className="p-5 bg-purple-500/5 rounded-[var(--radius-base)] border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-3">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Subjects</span>
                  </div>
                  <p className="text-3xl font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight">{uniqueSubjects}</p>
                </div>

                <div className="p-5 bg-[var(--color-success)]/5 rounded-[var(--radius-base)] border border-[var(--color-success)]/10 hover:border-[var(--color-success)]/30 transition-colors">
                  <div className="flex items-center gap-2 text-[var(--color-success)] mb-3">
                    <div className="p-1.5 rounded-lg bg-[var(--color-success)]/10">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Tasks</span>
                  </div>
                  <p className="text-3xl font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight">
                    {completedTasks} <span className="text-[var(--text-secondary)] text-xl font-semibold">/ {totalTasks}</span>
                  </p>
                </div>

                <div className="p-5 bg-[var(--color-warning)]/5 rounded-[var(--radius-base)] border border-[var(--color-warning)]/10 hover:border-[var(--color-warning)]/30 transition-colors">
                  <div className="flex items-center gap-2 text-[var(--color-warning)] mb-3">
                    <div className="p-1.5 rounded-lg bg-[var(--color-warning)]/10">
                      <Target className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Focus</span>
                  </div>
                  <p className="text-3xl font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight">
                    <span className="text-xl text-[var(--text-secondary)] font-semibold">No data</span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Journal History */}
      <motion.div variants={itemVariants} className="space-y-6 pt-4">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Journal History</h2>
        </div>

        {journalEntries.length === 0 ? (
          <Card className="shadow-soft border-dashed border-[var(--border-color)] bg-transparent">
            <CardContent className="text-center py-16 px-4">
              <div className="h-16 w-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Your study story starts here</h3>
              <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
                Take a few minutes after studying to record what you learned, what challenged you, and what you want to improve tomorrow.
              </p>
              <Button 
                onClick={() => {
                  setSelectedDateObj(new Date()); // Ensure it's today
                  openNewForm();
                }}
                className="shadow-md font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Write Your First Journal Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journalEntries.map((entry, idx) => {
              const entryDate = new Date(entry.date);
              return (
                <motion.div 
                  key={entry.id} 
                  variants={itemVariants}
                  custom={idx}
                >
                  <Card 
                    className="h-full flex flex-col shadow-soft border-[var(--border-color)] hover:border-[var(--color-primary)]/50 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => openDetail(entry)}
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-full uppercase tracking-wide">
                          {entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {(entry.mood || entry.productivity) && (
                          <div className="flex gap-2">
                            {entry.mood && <span className="text-xs font-bold text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-2 py-1 rounded-md flex items-center gap-1" title="Mood"><span className="text-[10px]">M</span> {entry.mood}</span>}
                            {entry.productivity && <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-md flex items-center gap-1" title="Productivity"><span className="text-[10px]">P</span> {entry.productivity}</span>}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                        {entry.title}
                      </h3>
                      
                      {entry.content && (
                        <p className="text-[var(--text-secondary)] text-sm line-clamp-3 mb-4 flex-1">
                          "{entry.content}"
                        </p>
                      )}
                      
                      <div className="mt-auto pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-sm text-[var(--text-secondary)] font-medium">
                        <span className="group-hover:text-[var(--color-primary)] transition-colors">View Journal</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-[var(--color-primary)] transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
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
