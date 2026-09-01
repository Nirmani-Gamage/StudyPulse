import { useState } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { BookOpen, Plus, Trash2, Clock } from 'lucide-react';

export default function StudySessions() {
  const { sessions, subjects, addSession, deleteSession } = useStudyData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectId && durationMinutes && date) {
      
      const start = new Date(date);
      const end = new Date(start.getTime() + Number(durationMinutes) * 60000);
      
      addSession({
        subjectId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: Number(durationMinutes),
        type: 'manual',
        notes: notes || undefined
      });
      
      setSubjectId('');
      setDurationMinutes('');
      setDate('');
      setNotes('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Study Sessions</h1>
          <p className="text-[var(--text-secondary)] mt-1">Log and view your past study history.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Log Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-transparent shadow-none">
          <div className="h-16 w-16 rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center justify-center mb-4">
             <BookOpen className="h-8 w-8 text-[var(--text-secondary)] opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No sessions logged</h3>
          <p className="text-[var(--text-secondary)] max-w-sm mb-6">Log a manual session or use the Pomodoro timer to start tracking.</p>
          <Button onClick={() => setIsModalOpen(true)}>Log Session</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sessions.map(session => {
            const subject = subjects.find(s => s.id === session.subjectId);
            return (
              <Card key={session.id} className="relative overflow-hidden group">
                 {subject && <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: subject.color }} />}
                 <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <div>
                     <h3 className="text-lg font-bold text-[var(--text-primary)]">{subject ? subject.name : 'Unknown Subject'}</h3>
                     <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-2">
                       <Clock className="h-3 w-3" />
                       {new Date(session.startTime).toLocaleString()}
                     </p>
                     {session.notes && <p className="text-sm text-[var(--text-primary)] mt-2 italic">"{session.notes}"</p>}
                   </div>
                   <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                     <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-md font-semibold text-sm">
                       {session.durationMinutes} min
                     </span>
                     <span className="text-xs uppercase font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-1 rounded-md">
                       {session.type}
                     </span>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-secondary)] hover:text-[var(--color-error)]"
                        onClick={() => deleteSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                 </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Study Session">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Subject</label>
            <select 
              required
              className="flex h-11 w-full rounded-[var(--radius-input)] border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Select a subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {subjects.length === 0 && <p className="text-xs text-[var(--color-warning)] mt-1">Please create a subject first.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Duration (minutes)</label>
              <Input 
                required
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g. 45"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Date & Time</label>
              <Input 
                required
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Notes (Optional)</label>
            <Input 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you study?"
            />
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={subjects.length === 0}>Save Session</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
