import { api } from '../lib/api';

export interface RecommendationAction {
  type: 'START_STUDY' | 'VIEW_GOAL' | 'VIEW_TASK' | 'VIEW_SUBJECT' | 'VIEW_EXAM';
  subjectId?: string | null;
  duration?: number;
}

export interface Recommendation {
  id: string;
  type: 'EXAM_PREPARATION' | 'REVISION' | 'INACTIVE_SUBJECT' | 'GOAL_RISK' | 'CONSISTENCY' | 'FOCUS' | 'STUDY_BALANCE' | 'TASK_PLANNING';
  subjectId: string | null;
  subject: string;
  title: string;
  duration: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  reason: string[];
  action: RecommendationAction;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  generatedAt: string;
}

export const recommendationApi = {
  getRecommendations: async (limit: number = 3): Promise<Recommendation[]> => {
    const res = await api.get(`/recommendations?limit=${limit}`) as RecommendationsResponse;
    return res.recommendations;
  }
};
