import api from './api';
import { AIResumeAnalysis, AIJobAnalysis, AICareerAdvice, Job } from '../types';

export const aiService = {
  async analyzeResumeText(resumeText: string): Promise<AIResumeAnalysis> {
    const res = await api.post<AIResumeAnalysis>('/api/ai/analyze-resume', {
      resume_text: resumeText
    });
    return res.data;
  },

  async analyzeResumeFile(file: File): Promise<AIResumeAnalysis> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<AIResumeAnalysis>('/api/ai/analyze-resume-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  async analyzeJobDescription(jobText: string): Promise<AIJobAnalysis> {
    const res = await api.post<AIJobAnalysis>('/api/ai/analyze-job', {
      job_text: jobText
    });
    return res.data;
  },

  async getRecommendedJobs(): Promise<Job[]> {
    const res = await api.get<Job[]>('/api/ai/recommendations/jobs');
    return res.data;
  },

  async getCandidateMatches(jobId: number): Promise<any[]> {
    const res = await api.get<any[]>(`/api/ai/recommendations/candidates/${jobId}`);
    return res.data;
  },

  async askCareerAssistant(query: string): Promise<AICareerAdvice> {
    const res = await api.post<AICareerAdvice>('/api/ai/career-assistant', { query });
    return res.data;
  }
};
