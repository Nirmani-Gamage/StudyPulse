import { api } from '../lib/api';

export interface AIAnalyzerData {
  dataQuality: {
    level: 'limited' | 'moderate' | 'good';
    message: string;
  };
  overallAssessment: {
    title: string;
    summary: string;
    status: 'positive' | 'neutral' | 'negative';
  };
  insights: {
    category: 'consistency' | 'subject_balance' | 'task_behavior' | 'goal_progress' | 'study_patterns';
    title: string;
    observation: string;
    evidence: string;
    impact: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  strengths: {
    title: string;
    description: string;
    evidence: string;
  }[];
  areasToImprove: {
    title: string;
    description: string;
    evidence: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  subjectAnalysis: {
    subject: string;
    observation: string;
    evidence: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  reflection: {
    summary: string;
    pattern: string;
  };
}

export const aiAnalyzerApi = {
  getAnalysis: async (period: '7d' | '30d' | '90d' = '30d'): Promise<AIAnalyzerData> => {
    const response = await api.get(`/ai/analyzer?period=${period}`);
    
    // In our api.ts, success is usually returned directly or thrown if not ok.
    // If it returns the data wrapper { success, data }, handle it:
    if (response && response.data) {
      return response.data;
    }
    return response as AIAnalyzerData;
  }
};
