import { api } from '../lib/api';

export interface AIPlannerItem {
  subjectId: string;
  subject: string;
  durationMinutes: number;
  activity: string;
  reason: string;
}

export interface AIPlan {
  title: string;
  summary: string;
  totalMinutes: number;
  items: AIPlannerItem[];
}

export interface GeneratePlanResponse {
  success: boolean;
  plan: AIPlan;
  message?: string;
}

export interface AddToTasksResponse {
  success: boolean;
  created: number;
  skipped: number;
  message?: string;
}

export const aiPlannerApi = {
  generateDailyPlan: async (availableMinutes: number): Promise<GeneratePlanResponse> => {
    return await api.post('/ai-planner/generate', { availableMinutes });
  },
  
  addToTasks: async (items: AIPlannerItem[]): Promise<AddToTasksResponse> => {
    return await api.post('/ai-planner/add-to-tasks', { items });
  }
};
