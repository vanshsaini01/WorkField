import api from './api';
import { WorkerProfile, EmployerProfile, Profession, SkillItem, CompanyPublicProfile } from '../types';

export interface WorkerAvailabilityPayload {
  is_available: boolean;
  availability_note?: string;
  availability?: string;
}

export const profileService = {
  async getWorkerProfile(): Promise<WorkerProfile> {
    const res = await api.get<WorkerProfile>('/api/profiles/worker/me');
    return res.data;
  },

  async getWorkerProfileById(userId: number): Promise<WorkerProfile> {
    const res = await api.get<WorkerProfile>(`/api/profiles/worker/${userId}`);
    return res.data;
  },

  async updateWorkerProfile(data: Partial<WorkerProfile>): Promise<WorkerProfile> {
    const res = await api.put<WorkerProfile>('/api/profiles/worker/me', data);
    return res.data;
  },

  async updateAvailability(data: WorkerAvailabilityPayload): Promise<WorkerProfile> {
    const res = await api.patch<WorkerProfile>('/api/profiles/worker/availability', data);
    return res.data;
  },

  async getAvailableWorkers(params?: { profession?: string; location?: string; q?: string }): Promise<WorkerProfile[]> {
    const res = await api.get<WorkerProfile[]>('/api/profiles/workers/available', { params });
    return res.data;
  },

  async getCompanyProfile(employerId: number): Promise<CompanyPublicProfile> {
    const res = await api.get<CompanyPublicProfile>(`/api/profiles/company/${employerId}`);
    return res.data;
  },

  async getEmployerProfile(): Promise<EmployerProfile> {
    const res = await api.get<EmployerProfile>('/api/profiles/employer/me');
    return res.data;
  },

  async updateEmployerProfile(data: Partial<EmployerProfile>): Promise<EmployerProfile> {
    const res = await api.put<EmployerProfile>('/api/profiles/employer/me', data);
    return res.data;
  },

  async getProfessions(): Promise<Profession[]> {
    const res = await api.get<Profession[]>('/api/profiles/professions');
    return res.data;
  },

  async getSkills(category?: string): Promise<SkillItem[]> {
    const params = category ? { category } : {};
    const res = await api.get<SkillItem[]>('/api/profiles/skills', { params });
    return res.data;
  },

  async uploadPhoto(file: File): Promise<{ photo_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ photo_url: string }>('/api/profiles/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async uploadResume(file: File): Promise<{ resume_url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ resume_url: string; filename: string }>('/api/profiles/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

