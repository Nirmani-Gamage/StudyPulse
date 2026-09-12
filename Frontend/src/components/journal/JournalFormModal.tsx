import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import type { JournalEntry } from '../../types';
import { Button } from '../ui/Button';

interface JournalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<JournalEntry>) => Promise<void>;
  initialData?: JournalEntry;
  selectedDate: string;
}

export function JournalFormModal({ isOpen, onClose, onSave, initialData, selectedDate }: JournalFormModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [productivity, setProductivity] = useState<number | null>(null);
  
  const [achievements, setAchievements] = useState<string[]>([]);
  const [learnings, setLearnings] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [tomorrowFocus, setTomorrowFocus] = useState<string[]>([]);

  const [newAchievement, setNewAchievement] = useState('');
  const [newLearning, setNewLearning] = useState('');
  const [newChallenge, setNewChallenge] = useState('');
  const [newTomorrowFocus, setNewTomorrowFocus] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content || '');
      setMood(initialData.mood);
      setEnergy(initialData.energy);
      setProductivity(initialData.productivity);
      setAchievements(initialData.achievements || []);
      setLearnings(initialData.learnings || []);
      setChallenges(initialData.challenges || []);
      setTomorrowFocus(initialData.tomorrowFocus || []);
    } else {
      setTitle('');
      setContent('');
      setMood(null);
      setEnergy(null);
      setProductivity(null);
      setAchievements([]);
      setLearnings([]);
      setChallenges([]);
      setTomorrowFocus([]);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    resetInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim()) {
      setter(prev => [...prev, value.trim()]);
      resetInput('');
    }
  };

  const handleRemoveItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        date: selectedDate,
        title: title.trim(),
        content: content.trim(),
        mood,
        energy,
        productivity,
        achievements,
        learnings,
        challenges,
        tomorrowFocus,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRating = (label: string, value: number | null, setter: (val: number) => void) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-[var(--text-primary)]">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => setter(num)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              value === num 
                ? 'bg-[var(--color-primary)] text-white shadow-md scale-110' 
                : 'bg-[var(--bg-color)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)]'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  const renderListSection = (
    title: string,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>,
    inputValue: string,
    setInputValue: React.Dispatch<React.SetStateAction<string>>,
    placeholder: string
  ) => (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-[var(--text-primary)]">{title}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddItem(setItems, inputValue, setInputValue);
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[var(--radius-base)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50"
        />
        <Button
          type="button"
          onClick={() => handleAddItem(setItems, inputValue, setInputValue)}
          variant="outline"
          className="px-3"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-2 mt-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between bg-[var(--bg-main)] px-3 py-2 rounded-[var(--radius-base)] border border-[var(--border-color)] text-sm">
              <span className="text-[var(--text-primary)]">{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(setItems, idx)}
                className="text-[var(--text-secondary)] hover:text-[var(--color-error)] transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[var(--card-bg)] rounded-[var(--radius-card)] w-full max-w-3xl my-8 border border-[var(--border-color)] shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)] bg-[var(--bg-main)]/30 rounded-t-[calc(var(--radius-card)-1px)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {initialData ? 'Edit Reflection' : 'Today\'s Reflection'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-[var(--text-secondary)]">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {error && (
            <div className="mb-6 p-4 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-[var(--radius-base)] text-sm border border-[var(--color-error)]/20 font-medium">
              {error}
            </div>
          )}

          <form id="journal-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What did you focus on today?"
                  className="w-full px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[var(--radius-base)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-[var(--text-primary)] transition-shadow placeholder-[var(--text-secondary)]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Main Reflection</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write about your study session, thoughts, progress, or anything important from today..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[var(--radius-base)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-[var(--text-primary)] transition-shadow resize-none placeholder-[var(--text-secondary)]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderRating("How was your mood?", mood, setMood)}
              {renderRating("How was your energy?", energy, setEnergy)}
              {renderRating("How productive were you?", productivity, setProductivity)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[var(--border-color)]">
              {renderListSection(
                "What did you accomplish?",
                achievements, setAchievements,
                newAchievement, setNewAchievement,
                "e.g., Completed 2 DSA problems"
              )}
              {renderListSection(
                "What did you learn today?",
                learnings, setLearnings,
                newLearning, setNewLearning,
                "e.g., Learned how B-tree indexing works"
              )}
              {renderListSection(
                "What was difficult?",
                challenges, setChallenges,
                newChallenge, setNewChallenge,
                "e.g., Struggled with recursion"
              )}
              {renderListSection(
                "What should you focus on tomorrow?",
                tomorrowFocus, setTomorrowFocus,
                newTomorrowFocus, setNewTomorrowFocus,
                "e.g., Practice recursion"
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-[var(--border-color)] flex justify-end gap-3 bg-[var(--bg-main)]/30 rounded-b-[calc(var(--radius-card)-1px)]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="journal-form"
            disabled={isSubmitting}
            className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90"
          >
            {isSubmitting ? 'Saving...' : 'Save Reflection'}
          </Button>
        </div>
      </div>
    </div>
  );
}
