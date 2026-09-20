export type UserRole = 'worker' | 'employer' | 'admin';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface WorkerSkill {
  id?: number;
  skill_name: string;
  proficiency_level?: string;
  years_of_experience?: number;
}

export interface WorkerProfile {
  id: number;
  user_id: number;
  title?: string;
  profession?: string;
  experience_years: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  expected_salary_min?: number;
  expected_salary_max?: number;
  availability?: string;
  is_available?: boolean;
  availability_note?: string;
  worker_name?: string;
  worker_email?: string;
  bio?: string;
  phone?: string;
  profile_photo?: string;
  resume_url?: string;
  resume_text?: string;
  certifications?: string[];
  skills_raw?: string[];
  skills?: WorkerSkill[];
  profile_completed_percentage: number;
}

export interface EmployerProfile {
  id: number;
  user_id: number;
  company_name: string;
  profile_photo?: string;
  industry?: string;
  company_size?: string;
  description?: string;
  website?: string;
  location?: string;
  phone?: string;
  verified: boolean;
}

export interface Profession {
  id: number;
  name: string;
  category?: string;
  description?: string;
  icon?: string;
}

export interface SkillItem {
  id: number;
  name: string;
  category?: string;
}

export interface MatchBreakdown {
  overall_match: number;
  skills_match: number;
  experience_match: number;
  location_match: number;
  salary_match: number;
  profession_match: number;
  matched_skills: string[];
  missing_skills: string[];
  explanations: string[];
}

export interface Job {
  id: number;
  employer_id: number;
  employer_name?: string;
  employer_photo?: string;
  title: string;
  profession: string;
  description: string;
  required_skills: string[];
  experience_years: number;
  salary_min: number;
  salary_max: number;
  pay_rate?: number;
  job_type: string;
  location: string;
  latitude?: number;
  longitude?: number;
  remote_or_onsite: string;
  availability_shift: string;
  deadline?: string;
  is_resume_required?: boolean;
  status: 'open' | 'closed' | 'in_progress';
  created_at?: string;
  match_score?: number;
  match_breakdown?: MatchBreakdown;
  is_saved?: boolean;
  has_applied?: boolean;
}

export type ApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'accepted' | 'rejected';

export interface Application {
  id: number;
  job_id: number;
  worker_id: number;
  cover_letter?: string;
  resume_url?: string;
  status: ApplicationStatus;
  match_score?: number;
  match_breakdown?: MatchBreakdown;
  employer_notes?: string;
  created_at: string;
  worker_name?: string;
  worker_email?: string;
  worker_phone?: string;
  worker_profession?: string;
  worker_skills?: string[];
  worker_experience?: number;
  job_title?: string;
  job_profession?: string;
  job_location?: string;
  job_salary_min?: number;
  job_salary_max?: number;
  company_name?: string;
  employer_id?: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface AIResumeAnalysis {
  full_name: string;
  email: string;
  phone: string;
  suggested_profession: string;
  detected_skills: string[];
  experience_years: number;
  location: string;
  education: string[];
  certifications: string[];
  suggested_title: string;
  expected_salary_min: number;
  expected_salary_max: number;
  raw_text_snippet?: string;
}

export interface AIJobAnalysis {
  title: string;
  profession: string;
  required_skills: string[];
  experience_years: number;
  salary_min: number;
  salary_max: number;
  job_type: string;
  location: string;
  responsibilities: string[];
  description: string;
}

export interface AICareerAdvice {
  reply: string;
  recommended_skills: string[];
  suggested_roles: string[];
  provider: string;
}

export interface CompanyJobSnippet {
  id: number;
  title: string;
  profession: string;
  location: string;
  salary_min: number;
  salary_max: number;
  job_type: string;
  is_resume_required?: boolean;
}

export interface CompanyPublicProfile {
  employer_id: number;
  company_name: string;
  profile_photo?: string;
  industry?: string;
  company_size?: string;
  description?: string;
  website?: string;
  location?: string;
  phone?: string;
  verified: boolean;
  active_jobs_count: number;
  jobs: CompanyJobSnippet[];
}

export interface MessageItem {
  id: number;
  sender_id: number;
  receiver_id: number;
  job_id?: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export interface ConversationItem {
  other_user_id: number;
  other_user_name: string;
  other_user_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  job_title?: string;
}


