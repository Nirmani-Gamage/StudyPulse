import { api } from '../lib/api';

export type CoachIntent =
  | 'GENERAL_QUESTION'
  | 'CREATE_STUDY_PLAN'
  | 'ANALYZE_PROGRESS'
  | 'STUDY_RECOMMENDATION'
  | 'GOAL_ANALYSIS'
  | 'EXAM_PREPARATION'
  | 'CONSISTENCY_ANALYSIS'
  | 'SUBJECT_ANALYSIS'
  | 'TASK_ANALYSIS';

export interface CoachInsight {
  type: 'GOAL' | 'STUDY_ACTIVITY' | 'EXAM' | 'CONSISTENCY';
  subjectId?: string;
  text: string;
  evidence: {
    metric: string;
    value: string | number;
  };
}

export interface CoachPlanItem {
  subjectId: string;
  title: string;
  durationMinutes: number;
}

export interface CoachResponse {
  intent: CoachIntent;
  message: string;
  insights?: CoachInsight[];
  plan?: CoachPlanItem[];
}

export interface AddPlanResponse {
  created: number;
  skipped: number;
  errors: number;
}

export const aiCoachApi = {
  sendMessage: async (message: string, intent: CoachIntent | null = null): Promise<CoachResponse> => {
    const response = await api.post('/ai-coach/chat', { message, intent });
    if (response && response.data) {
      return response.data;
    }
    return response as unknown as CoachResponse;
  },

  addPlanToTasks: async (plan: CoachPlanItem[]): Promise<AddPlanResponse> => {
    const response = await api.post('/ai-coach/add-plan', { plan });
    if (response && response.data) {
      return response.data;
    }
    return response as unknown as AddPlanResponse;
  }
};
