import { X, Calendar, Edit2, Trash2, CheckCircle, Target, Flame } from 'lucide-react';
import type { JournalEntry } from '../../types';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface JournalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function JournalDetailModal({ isOpen, onClose, entry, onEdit, onDelete }: JournalDetailModalProps) {
  if (!isOpen) return null;

  const renderRating = (label: string, value: number | null, colorClass: string, bgClass: string, Icon: any) => {
    if (!value) return null;
    return (
      <div className={`flex flex-col gap-1 p-5 ${bgClass} rounded-[var(--radius-base)] border border-[var(--border-color)] shadow-sm`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${colorClass}`} />
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-2xl font-extrabold tabular-nums ${colorClass}`}>{value}</span>
          <span className="text-sm font-semibold text-[var(--text-secondary)]">/ 5</span>
        </div>
      </div>
    );
  };

  const renderList = (title: string, items: string[]) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          {title}
        </h4>
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-[var(--text-primary)] bg-[var(--bg-main)]/50 p-4 rounded-[var(--radius-base)] border border-[var(--border-color)]">
              <span className="text-[var(--color-primary)] mt-0.5">•</span>
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--card-bg)] rounded-[var(--radius-card)] w-full max-w-3xl my-8 shadow-2xl border border-[var(--border-color)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-start p-8 border-b border-[var(--border-color)] bg-[var(--bg-main)]/30">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] mb-3 bg-[var(--color-primary)]/10 w-fit px-3 py-1.5 rounded-full uppercase tracking-wide">
                <Calendar className="w-4 h-4" />
                {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <h2 className="text-3xl font-extrabold text-[var(--text-primary)] leading-tight">{entry.title}</h2>
            </div>
            
            <div className="flex items-center gap-2 bg-[var(--bg-main)] p-1.5 rounded-[var(--radius-base)] border border-[var(--border-color)] shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 h-9 w-9"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this reflection?')) {
                    onDelete();
                  }
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 h-9 w-9"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-[var(--border-color)] mx-1" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="text-[var(--text-secondary)] hover:bg-[var(--border-color)] h-9 w-9"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 overflow-y-auto max-h-[calc(100vh-250px)] space-y-10 bg-[var(--card-bg)]">
            
            {(entry.mood || entry.energy || entry.productivity) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderRating('Mood', entry.mood, 'text-amber-500', 'bg-amber-500/5 hover:bg-amber-500/10 transition-colors', Flame)}
                {renderRating('Energy', entry.energy, 'text-emerald-500', 'bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors', CheckCircle)}
                {renderRating('Productivity', entry.productivity, 'text-blue-500', 'bg-blue-500/5 hover:bg-blue-500/10 transition-colors', Target)}
              </div>
            )}

            {entry.content && (
              <div className="prose prose-blue max-w-none">
                <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed text-lg bg-[var(--bg-main)]/30 p-6 rounded-[var(--radius-base)] border border-[var(--border-color)] italic shadow-inner">
                  "{entry.content}"
                </p>
              </div>
            )}

            {(entry.achievements?.length > 0 || entry.learnings?.length > 0 || entry.challenges?.length > 0 || entry.tomorrowFocus?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 pt-8 border-t border-[var(--border-color)] relative">
                {renderList('What I accomplished', entry.achievements)}
                {renderList('What I learned', entry.learnings)}
                {renderList('Challenges', entry.challenges)}
                {renderList("Tomorrow's focus", entry.tomorrowFocus)}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
