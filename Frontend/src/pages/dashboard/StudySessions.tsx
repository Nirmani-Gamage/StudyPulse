import { useState } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { BookOpen, Plus, Trash2, Clock, Edit2 } from 'lucide-react';
import type { StudySession } from '../../types';

export default function StudySessions() {
  const { sessions, subjects, addSession, updateSession, deleteSession, addSubject } = useStudyData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [subjectName, setSubjectName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const now = new Date();
  const tzoffset = now.getTimezoneOffset() * 60000; 
  const currentLocalISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);

  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const openAddModal = () => {
    setEditingSession(null);
    setSubjectName('');
    setDurationMinutes('');
    setDate('');
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (session: StudySession) => {
    setEditingSession(session);
    const subject = subjects.find(s => s.id === session.subjectId);
    setSubjectName(subject ? subject.name : '');
    setDurationMinutes(session.durationMinutes.toString());
    
    // Format date for datetime-local input
    const dt = new Date(session.startTime);
    const tzoffset = dt.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(dt.getTime() - tzoffset)).toISOString().slice(0, 16);
    setDate(localISOTime);
    
    setNotes(session.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectName && durationMinutes && date) {
      setIsSaving(true);
      setError('');
      try {
        let finalSubjectId = '';
        const existingSubject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase().trim());
        
        if (existingSubject) {
          finalSubjectId = existingSubject.id;
        } else {
          // Create new subject
          const newSubject = await addSubject({
            name: subjectName.trim(),
            color: '#3b82f6', // default blue
          });
          if (newSubject) {
            finalSubjectId = newSubject.id;
          } else {
            throw new Error('Failed to create subject');
          }
        }

        const start = new Date(date);
        
        if (start < new Date()) {
          setError('Cannot select a date or time in the past');
          setIsSaving(false);
          return;
        }

        const end = new Date(start.getTime() + Number(durationMinutes) * 60000);
        
        const payload = {
          subjectId: finalSubjectId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          durationMinutes: Number(durationMinutes),
          type: editingSession ? editingSession.type : 'manual',
          notes: notes || undefined
        };

        if (editingSession) {
          await updateSession(editingSession.id, payload);
          setSuccessMsg('Session updated successfully');
        } else {
          await addSession(payload);
          setSuccessMsg('Session logged successfully');
        }
        
        setIsModalOpen(false);
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to save session');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Study Sessions</h1>
          <p className="text-[var(--text-secondary)] mt-1">Log and view your past study history.</p>
        </div>
        <Button onClick={openAddModal} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Log Session
        </Button>
      </div>

      {successMsg && (
        <div className="bg-green-100 text-green-700 p-3 rounded-[var(--radius-base)] text-sm font-medium">
          {successMsg}
        </div>
      )}

      {sessions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-transparent shadow-none">
          <div className="h-16 w-16 rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center justify-center mb-4">
             <BookOpen className="h-8 w-8 text-[var(--text-secondary)] opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No sessions logged</h3>
          <p className="text-[var(--text-secondary)] max-w-sm mb-6">Log a manual session or use the Pomodoro timer to start tracking.</p>
          <Button onClick={openAddModal}>Log Session</Button>
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
                      <span 
                        className="px-3 py-1 rounded-md font-semibold text-sm"
                        style={{ 
                          backgroundColor: subject ? `${subject.color}15` : 'var(--color-primary)',
                          color: subject ? subject.color : 'var(--color-primary)'
                        }}
                      >
                        {session.durationMinutes} min
                      </span>
                     <span className="text-xs uppercase font-bold text-[var(--text-secondary)] border border-[var(--border-color)] px-2 py-1 rounded-md">
                       {session.type}
                     </span>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="text-[var(--text-secondary)] hover:text-[var(--color-primary)]"
                         onClick={() => openEditModal(session)}
                       >
                         <Edit2 className="h-4 w-4" />
                       </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-[var(--text-secondary)] hover:text-[var(--color-error)]"
                          onClick={() => setSessionToDelete(session.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                   </div>
                 </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSession ? "Edit Study Session" : "Log Study Session"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm mb-4">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Subject</label>
            <Input 
              required
              type="text"
              placeholder="e.g. Mathematics"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              list="subjects-list"
            />
            <datalist id="subjects-list">
              {subjects.map(s => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
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
                min={currentLocalISOTime}
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : (editingSession ? 'Update Session' : 'Save Session')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!sessionToDelete} onClose={() => setSessionToDelete(null)} title="Delete Study Session">
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">Are you sure you want to delete this study session? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => setSessionToDelete(null)}>Cancel</Button>
            <Button 
              className="bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90"
              onClick={() => {
                if (sessionToDelete) {
                  deleteSession(sessionToDelete);
                  setSessionToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
