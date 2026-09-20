import api from './api';
import { Application, ApplicationStatus } from '../types';

export interface ApplyPayload {
  job_id: number;
  cover_letter?: string;
  resume_url?: string;
  worker_name?: string;
  worker_phone?: string;
  worker_profession?: string;
  worker_experience?: number;
  worker_skills?: string[];
}

export const applicationService = {
  async apply(payload: ApplyPayload | number, coverLetter?: string, resumeUrl?: string): Promise<Application> {
    const body = typeof payload === 'number'
      ? { job_id: payload, cover_letter: coverLetter, resume_url: resumeUrl }
      : payload;
    const res = await api.post<Application>('/api/applications/', body);
    return res.data;
  },

  async getMyApplications(status?: string): Promise<Application[]> {
    const params = status && status !== 'all' ? { status } : {};
    const res = await api.get<Application[]>('/api/applications/my-applications', { params });
    return res.data;
  },

  async getJobApplications(jobId: number): Promise<Application[]> {
    const res = await api.get<Application[]>(`/api/applications/job/${jobId}`);
    return res.data;
  },

  async getEmployerAllApplications(status?: string): Promise<Application[]> {
    const params = status && status !== 'all' ? { status } : {};
    const res = await api.get<Application[]>('/api/applications/employer/all', { params });
    return res.data;
  },

  async updateStatus(applicationId: number, status: ApplicationStatus, employerNotes?: string): Promise<Application> {
    const res = await api.patch<Application>(`/api/applications/${applicationId}/status`, {
      status,
      employer_notes: employerNotes
    });
    return res.data;
  }
};

