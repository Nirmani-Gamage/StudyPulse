import { useState } from 'react';
import { useStudyData } from '../../context/StudyContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Library, Plus, Trash2, Edit2 } from 'lucide-react';
import type { Subject } from '../../types';

const presetColors = [
  '#4F46E5', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'
];

export default function Subjects() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useStudyData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(presetColors[0]);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const openAddModal = () => {
    setEditingSubject(null);
    setName('');
    setColor(presetColors[0]);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setColor(subject.color);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setIsSaving(true);
      setError('');
      try {
        if (editingSubject) {
          await updateSubject(editingSubject.id, { name: name.trim(), color });
          setSuccessMsg('Subject updated successfully');
        } else {
          await addSubject({ name: name.trim(), color });
          setSuccessMsg('Subject added successfully');
        }
        setIsModalOpen(false);
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to save subject');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Subjects</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage your courses and learning topics.</p>
        </div>
        <Button onClick={openAddModal} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {successMsg && (
        <div className="bg-green-100 text-green-700 p-3 rounded-[var(--radius-base)] text-sm font-medium">
          {successMsg}
        </div>
      )}

      {subjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-transparent shadow-none">
          <div className="h-16 w-16 rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center justify-center mb-4">
             <Library className="h-8 w-8 text-[var(--text-secondary)] opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No subjects yet</h3>
          <p className="text-[var(--text-secondary)] max-w-sm mb-6">Create your first subject to start tracking your study sessions and goals.</p>
          <Button onClick={openAddModal}>Create Subject</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {subjects.map(subject => (
            <Card key={subject.id} className="relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: subject.color }} />
              <CardContent className="p-6 pl-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{subject.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Added {new Date(subject.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-[var(--text-secondary)] hover:text-[var(--color-primary)]"
                      onClick={() => openEditModal(subject)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-[var(--text-secondary)] hover:text-[var(--color-error)]"
                      onClick={() => deleteSubject(subject.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSubject ? "Edit Subject" : "Add New Subject"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm mb-4">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Subject Name</label>
            <Input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Advanced Calculus"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Color</label>
            <div className="flex flex-wrap gap-3">
              {presetColors.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? 'border-white ring-2 ring-offset-2 ring-offset-[var(--card-bg)]' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : (editingSubject ? 'Update Subject' : 'Save Subject')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
