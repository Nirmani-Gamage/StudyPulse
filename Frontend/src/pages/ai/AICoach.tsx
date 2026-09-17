import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Loader2, Sparkles, CheckCircle2, ChevronRight, AlertCircle, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { aiCoachApi } from '../../services/aiCoachApi';
import type { CoachResponse, CoachIntent, CoachPlanItem } from '../../services/aiCoachApi';
import { api } from '../../lib/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  data?: CoachResponse;
  status?: 'sending' | 'success' | 'error';
  errorCode?: string;
  originalQuery?: string;
  originalIntent?: CoachIntent | null;
}

const QUICK_ACTIONS = [
  { label: 'Create my study plan', intent: 'CREATE_STUDY_PLAN' },
  { label: 'Analyze my progress', intent: 'ANALYZE_PROGRESS' },
  { label: 'What should I study?', intent: 'STUDY_RECOMMENDATION' },
  { label: 'Why is my score low?', intent: 'GOAL_ANALYSIS' },
  { label: 'Help me prepare for my exam', intent: 'EXAM_PREPARATION' }
] as const;

export default function AICoach() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    sender: 'coach',
    text: "Hi there! I'm your AI Study Coach. I can analyze your progress, help you prepare for exams, or build a personalized study plan based on your actual data. What can I help you with today?"
  }]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isTypingRef = useRef(false);
  const [subjects, setSubjects] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch subjects to display nice names for plan items
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        if (res.data) {
          const subMap: Record<string, string> = {};
          res.data.forEach((s: any) => {
            subMap[s._id] = s.name;
          });
          setSubjects(subMap);
        }
      } catch (err) {
        console.error("Failed to fetch subjects for AI Coach", err);
      }
    };
    fetchSubjects();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string, intent: CoachIntent | null = null, existingErrorId?: string) => {
    if (isTypingRef.current) return;
    if (!text.trim()) return;

    if (!existingErrorId) {
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text, status: 'success' }]);
      setInput('');
    } else {
      setMessages(prev => prev.filter(m => m.id !== existingErrorId));
    }
    
    setIsTyping(true);
    isTypingRef.current = true;

    try {
      const response = await aiCoachApi.sendMessage(text, intent);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'coach', 
        text: response.message,
        data: response
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'coach',
        text: error.code === 'AI_SERVICE_TEMPORARILY_UNAVAILABLE' 
          ? 'AI Coach is temporarily busy. We automatically retried your request, but the service is still unavailable. Please try again in a few moments.'
          : (error.message || 'Sorry, I am temporarily unavailable. Please try again shortly.'),
        status: 'error',
        errorCode: error.code,
        originalQuery: text,
        originalIntent: intent
      }]);
    } finally {
      setIsTyping(false);
      isTypingRef.current = false;
    }
  };

  const handleAddPlan = async (plan: CoachPlanItem[], msgId: string) => {
    try {
      const res = await aiCoachApi.addPlanToTasks(plan);
      setMessages(prev => prev.map(msg => {
        if (msg.id === msgId) {
          return {
            ...msg,
            text: msg.text + `\n\n✅ Added to Daily Tasks! (${res.created} created, ${res.skipped} skipped)`,
            data: { ...msg.data!, plan: [] } // Clear plan so button goes away
          };
        }
        return msg;
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to add plan');
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-[var(--card-bg)] rounded-[var(--radius-card)] border border-[var(--border-color)] overflow-hidden shadow-soft">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3 bg-[var(--bg-color)]/50 backdrop-blur-sm shrink-0">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-[var(--text-primary)] leading-tight">AI Study Coach</h1>
          <p className="text-xs text-[var(--text-secondary)]">Powered by StudyPulse Data</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                msg.sender === 'user' 
                  ? 'bg-[var(--color-primary)] text-white' 
                  : msg.status === 'error'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              }`}>
                {msg.sender === 'user' ? <User className="w-5 h-5" /> : msg.status === 'error' ? <AlertCircle className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[var(--color-primary)] text-white rounded-tr-sm'
                    : msg.status === 'error'
                      ? 'bg-red-500/10 text-red-600 border border-red-500/20 rounded-tl-sm'
                      : 'bg-[var(--bg-color)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  {msg.status === 'error' && msg.errorCode === 'AI_SERVICE_TEMPORARILY_UNAVAILABLE' && (
                    <div className="mt-3">
                      <Button 
                        onClick={() => handleSend(msg.originalQuery!, msg.originalIntent || null, msg.id)}
                        disabled={isTyping}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-3 h-auto"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>

                {/* Insights */}
                {msg.data?.insights && msg.data.insights.length > 0 && (
                  <div className="space-y-2 mt-2 w-full">
                    {msg.data.insights.map((insight, idx) => (
                      <div key={idx} className="p-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl text-sm flex gap-3 items-start">
                        <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[var(--text-primary)] font-medium mb-1">{insight.text}</p>
                          <div className="text-xs text-[var(--text-secondary)] font-mono bg-black/5 px-2 py-1 rounded">
                            {insight.evidence.metric}: {insight.evidence.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Plan Card */}
                {msg.data?.plan && msg.data.plan.length > 0 && (
                  <div className="mt-2 w-full max-w-sm bg-[var(--bg-color)] border border-[var(--color-primary)]/30 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-3 bg-[var(--color-primary)]/5 border-b border-[var(--color-primary)]/20 flex items-center justify-between">
                      <h4 className="font-bold text-[var(--text-primary)] text-sm">Recommended Plan</h4>
                      <span className="text-xs font-medium bg-[var(--color-primary)] text-white px-2 py-1 rounded-full">
                        {msg.data.plan.reduce((acc, curr) => acc + curr.durationMinutes, 0)} min total
                      </span>
                    </div>
                    <div className="p-2 space-y-1">
                      {msg.data.plan.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 hover:bg-[var(--color-primary)]/5 rounded-lg transition-colors">
                          <div className="w-8 h-8 rounded bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center shrink-0 text-[var(--text-secondary)]">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.title}</p>
                            <p className="text-xs text-[var(--text-secondary)] truncate">
                              {subjects[item.subjectId] || 'Subject'}
                            </p>
                          </div>
                          <div className="text-xs font-bold text-[var(--text-primary)] whitespace-nowrap">
                            {item.durationMinutes}m
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 pt-0">
                      <Button onClick={() => handleAddPlan(msg.data!.plan!, msg.id)} className="w-full gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Add Plan to Tasks
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
            <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Bot className="w-5 h-5" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (only show if no messages other than welcome, or let user scroll to them. Let's keep them always above input if empty) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => handleSend(action.label, action.intent as CoachIntent)}
                disabled={isTyping}
                className="text-xs bg-[var(--bg-color)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 rounded-full transition-colors flex items-center gap-1.5"
              >
                {action.label} <ChevronRight className="w-3 h-3 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-[var(--bg-color)] border-t border-[var(--border-color)] shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your studies..."
            disabled={isTyping}
            className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl py-3 pl-4 pr-12 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:text-[var(--text-secondary)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
