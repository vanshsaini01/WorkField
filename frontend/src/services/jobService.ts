import api from './api';
import { Job } from '../types';

export interface JobSearchParams {
  q?: string;
  profession?: string;
  location?: string;
  min_salary?: number;
  max_salary?: number;
  max_experience?: number;
  job_type?: string;
  skip?: number;
  limit?: number;
}

export const jobService = {
  async searchJobs(params: JobSearchParams = {}): Promise<Job[]> {
    const res = await api.get<Job[]>('/api/jobs/', { params });
    return res.data;
  },

  async getJobById(id: number): Promise<Job> {
    const res = await api.get<Job>(`/api/jobs/${id}`);
    return res.data;
  },

  async createJob(data: Partial<Job>): Promise<Job> {
    const res = await api.post<Job>('/api/jobs/', data);
    return res.data;
  },

  async updateJob(id: number, data: Partial<Job>): Promise<Job> {
    const res = await api.put<Job>(`/api/jobs/${id}`, data);
    return res.data;
  },

  async deleteJob(id: number): Promise<void> {
    await api.delete(`/api/jobs/${id}`);
  },

  async getEmployerJobs(): Promise<any[]> {
    const res = await api.get<any[]>('/api/jobs/employer/my-jobs');
    return res.data;
  },

  async getSavedJobs(): Promise<Job[]> {
    const res = await api.get<Job[]>('/api/jobs/saved/my-saved');
    return res.data;
  },

  async saveJob(jobId: number): Promise<void> {
    await api.post(`/api/jobs/${jobId}/save`);
  },

  async unsaveJob(jobId: number): Promise<void> {
    await api.delete(`/api/jobs/${jobId}/save`);
  }
};

