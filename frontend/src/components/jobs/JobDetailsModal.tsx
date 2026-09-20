import React from 'react';
import { Job } from '../../types';
import {
  X,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  FileText,
  MessageSquare,
  Send,
  Calendar,
  Layers,
  Users
} from 'lucide-react';
import { getLocalProfilePhoto } from '../../utils/storage';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onOpenCompany: (employerId: number) => void;
  onApply: (job: Job) => void;
  onOpenChat?: (otherUserId: number, otherUserName: string, jobId?: number, jobTitle?: string) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  isOpen,
  onClose,
  job,
  onOpenCompany,
  onApply,
  onOpenChat,
}) => {
  if (!isOpen || !job) return null;

  const isResumeRequired = job.is_resume_required !== false && job.profession?.toLowerCase() !== 'non-professional';
  const companyName = job.employer_name || 'Employer Enterprise';
  const employerPhoto = job.employer_photo || getLocalProfilePhoto('emp_' + job.employer_id) || getLocalProfilePhoto(job.employer_id);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-popup"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {job.profession}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{job.job_type}</span>
              <span className="text-xs text-slate-500">•</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                job.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
              }`}>
                {job.status}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight">{job.title}</h2>

            {/* Clickable Company Link */}
            <div className="flex items-center gap-2.5 text-sm text-slate-400">
              <span className="text-slate-500">Posted by</span>
              <button
                onClick={() => {
                  onClose();
                  onOpenCompany(job.employer_id);
                }}
                className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-2 transition cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-500/30 overflow-hidden flex items-center justify-center shrink-0">
                  {employerPhoto ? (
                    <img src={employerPhoto} alt={companyName} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-3 h-3 text-indigo-400" />
                  )}
                </div>
                {companyName}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Key Job Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-[11px] text-slate-400 font-medium">Estimated Salary</p>
              <p className="text-sm font-bold text-emerald-400 mt-1">
                ₹{job.salary_min?.toLocaleString()} - ₹{job.salary_max?.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500">Monthly Compensation</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-[11px] text-slate-400 font-medium">Location</p>
              <p className="text-sm font-bold text-white mt-1 truncate">
                {job.location}
              </p>
              <p className="text-[10px] text-slate-500 capitalize">{job.remote_or_onsite || 'On-site'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-[11px] text-slate-400 font-medium">Experience</p>
              <p className="text-sm font-bold text-white mt-1">
                {job.experience_years ? `${job.experience_years}+ Years` : 'Any Experience'}
              </p>
              <p className="text-[10px] text-slate-500">Required Background</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-[11px] text-slate-400 font-medium">Work Shift</p>
              <p className="text-sm font-bold text-white mt-1 capitalize">
                {job.availability_shift || 'Day Shift'}
              </p>
              <p className="text-[10px] text-slate-500">Shift Schedule</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 col-span-2 sm:col-span-1">
              <p className="text-[11px] text-slate-400 font-medium">Total Vacancy</p>
              <p className="text-sm font-bold text-white mt-1">
                {job.vacancies || 1} {job.vacancies === 1 ? 'Opening' : 'Openings'}
              </p>
              <p className="text-[10px] text-slate-500">Available Roles</p>
            </div>
          </div>

          {/* AI Match Score Badge (if present) */}
          {job.match_score !== undefined && job.match_score > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">AI Candidate Profile Match</h4>
                </div>
                <span className="text-base font-extrabold text-indigo-300">
                  {Math.round(job.match_score)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round(job.match_score))}%` }}
                />
              </div>
              {job.match_breakdown?.matched_skills && job.match_breakdown.matched_skills.length > 0 && (
                <p className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold">Matched Skills:</span>{' '}
                  {job.match_breakdown.matched_skills.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Application Policy */}
          {!isResumeRequired ? (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold">Instant 1-Click Application (No Resume Required)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Anyone can apply directly without attaching a CV or resume document.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="font-bold">Resume Required by Employer</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Your profile resume or link will be submitted automatically with this application.
                </p>
              </div>
            </div>
          )}

          {/* Job Overview & Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Job Description & Duties
            </h4>
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {job.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Required Skills */}
          {job.required_skills && job.required_skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Required Trade Skills & Tools
              </h4>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Downside Footer with prominent Apply Button and Chat Button */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChat(job.employer_id, companyName, job.id, job.title);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition border border-slate-700 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Chat with Employer
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="w-full sm:w-auto">
            {job.has_applied ? (
              <button
                disabled
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-sm font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" /> Applied Already
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApply(job);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Apply Now
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

