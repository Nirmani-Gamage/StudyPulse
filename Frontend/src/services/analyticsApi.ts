import { api } from '../lib/api';

export interface MetricResult {
  score: number | null;
  available: boolean;
  // Evidence fields (dynamic based on the metric)
  goalCount?: number;
  averageProgress?: number;
  journalEntries?: number;
  averageProductivity?: number;
  studyDays?: number;
  daysInPeriod?: number;
  consistencyRate?: number;
  subjectCount?: number;
  dominantSubject?: string;
  dominantSubjectPercentage?: number;
  completedTasks?: number;
  revisionTasks?: number;
  revisionRate?: number;
}

export interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
}

export interface LearningEffectiveness {
  period: {
    startDate: string;
    endDate: string;
    daysInPeriod: number;
  };
  overall: number | null;
  sufficientData: boolean;
  components: {
    goalProgress: MetricResult;
    productivity: MetricResult;
    consistency: MetricResult;
    studyDistribution: MetricResult;
    revision: MetricResult;
  };
  weights: {
    goalProgress: number;
    productivity: number;
    consistency: number;
    studyDistribution: number;
    revision: number;
  };
  recommendations: Recommendation[];
  rawMetrics: any;
}

export const analyticsApi = {
  getLearningEffectiveness: async (range: string = '30d'): Promise<LearningEffectiveness> => {
    const response = await api.get(`/analytics/learning-effectiveness?range=${range}`);
    return response.data;
  },
};
