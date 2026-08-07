import { useState } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

export default function CalendarView() {
  const { events, subjects, addEvent, deleteEvent } = useStudyData();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  
  // Form
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'study' | 'assignment' | 'exam' | 'reminder'>('study');
  const [subjectId, setSubjectId] = useState('');

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const d = new Date(year, month, day);
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - offset)).toISOString().split('T')[0];
    
    setSelectedDate(localISOTime);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && selectedDate) {
      addEvent({
        title,
        date: selectedDate,
        type,
        subjectId: subjectId || undefined
      });
      setTitle('');
      setSubjectId('');
      setIsModalOpen(false);
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'exam': return 'bg-[var(--color-error)] text-white';
      case 'assignment': return 'bg-[var(--color-warning)] text-white';
      case 'goal': return 'bg-[var(--color-success)] text-white';
      case 'reminder': return 'bg-[var(--color-accent)] text-white';
      default: return 'bg-[var(--color-primary)] text-white';
    }
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 border border-[var(--border-color)] bg-[var(--bg-color)]/50"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const offset = d.getTimezoneOffset() * 60000;
    const dateStr = (new Date(d.getTime() - offset)).toISOString().split('T')[0];
    
    const dayEvents = events.filter(e => e.date === dateStr);
    
    days.push(
      <div 
        key={`day-${i}`} 
        className="h-24 sm:h-32 border border-[var(--border-color)] p-1 sm:p-2 cursor-pointer hover:bg-[var(--bg-color)] transition-colors overflow-hidden group relative"
        onClick={() => handleDayClick(i)}
      >
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            {i}
          </span>
          <Plus className="h-4 w-4 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="mt-1 space-y-1 max-h-[calc(100%-1.5rem)] overflow-y-auto">
          {dayEvents.map(e => (
            <div key={e.id} className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate ${getEventColor(e.type)}`} title={e.title}>
              {e.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Calendar</h1>
          <p className="text-[var(--text-secondary)] mt-1">Track exams, assignments, and study schedule.</p>
        </div>
        <Button onClick={() => {
           const today = new Date();
           const offset = today.getTimezoneOffset() * 60000;
           setSelectedDate((new Date(today.getTime() - offset)).toISOString().split('T')[0]);
           setIsModalOpen(true);
        }} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 border-b border-[var(--border-color)] bg-[var(--bg-color)]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-semibold uppercase text-[var(--text-secondary)]">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 bg-[var(--card-bg)]">
            {days}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Add Event on ${selectedDate}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Event Title</label>
            <Input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Final Math Exam"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Event Type</label>
              <select 
                className="flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="study">Study Session</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="goal">Goal Deadline</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Subject (Optional)</label>
              <select 
                className="flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">-- None --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {events.filter(e => e.date === selectedDate).length > 0 && (
             <div className="pt-4 mt-4 border-t border-[var(--border-color)]">
               <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Events on this day</h4>
               <ul className="space-y-2 max-h-32 overflow-y-auto">
                 {events.filter(e => e.date === selectedDate).map(e => (
                   <li key={e.id} className="flex justify-between items-center text-sm p-2 rounded bg-[var(--bg-color)] border border-[var(--border-color)]">
                     <span className="truncate pr-2">{e.title}</span>
                     <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--color-error)] shrink-0" onClick={() => deleteEvent(e.id)}>
                       <Trash2 className="h-3 w-3" />
                     </Button>
                   </li>
                 ))}
               </ul>
             </div>
          )}

          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Event</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
