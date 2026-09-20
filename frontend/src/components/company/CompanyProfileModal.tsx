import React, { useState, useEffect } from 'react';
import { CompanyPublicProfile, Job } from '../../types';
import { profileService } from '../../services/profileService';
import {
  X,
  Building2,
  MapPin,
  Globe,
  Phone,
  CheckCircle2,
  Briefcase,
  Users,
  MessageSquare,
  ArrowRight,
  Loader2,
  FileText
} from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employerId: number | null;
  onApplyJob?: (job: any) => void;
  onOpenChat?: (otherUserId: number, otherUserName: string, jobId?: number, jobTitle?: string) => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  employerId,
  onApplyJob,
  onOpenChat,
}) => {
  const [profile, setProfile] = useState<CompanyPublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && employerId) {
      setLoading(true);
      setError('');
      profileService.getCompanyProfile(employerId)
        .then((data) => {
          setProfile(data);
        })
        .catch((err: any) => {
          console.error('Error fetching company profile:', err);
          const detail = err.response?.data?.detail;
          setError(typeof detail === 'string' ? detail : 'Failed to load company profile.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProfile(null);
    }
  }, [isOpen, employerId]);

  if (!isOpen || !employerId) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-popup"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 p-6 border-b border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner overflow-hidden">
              {profile?.profile_photo ? (
                <img src={profile.profile_photo} alt={profile.company_name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {loading ? 'Loading Company...' : profile?.company_name || 'Employer Profile'}
                </h2>
                {profile?.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Verified Partner
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-300 font-medium mt-0.5">
                {profile?.industry || 'Enterprise Hiring Partner'}
              </p>

              {/* Quick meta row */}
              {profile && (
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> {profile.location}
                    </span>
                  )}
                  {profile.company_size && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" /> {profile.company_size}
                    </span>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline"
                    >
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" /> {profile.phone}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
              <p className="text-sm">Loading company profile...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {!loading && profile && (
            <>
              {/* About Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Company Overview
                </h4>
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {profile.description || 'No detailed company description provided yet.'}
                </div>
              </div>

              {/* Chat action bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-800/60 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-white">Direct Message Hiring Team</h5>
                  <p className="text-xs text-slate-400">Ask questions about positions, shift timings, or site location</p>
                </div>
                {onOpenChat && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenChat(profile.employer_id, profile.company_name);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" /> Message Company
                  </button>
                )}
              </div>

              {/* Open Positions List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" /> Active Job Openings ({profile.jobs.length})
                  </h4>
                </div>

                {profile.jobs.length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/20 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                    No open job postings available at this moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-semibold text-white text-sm">{job.title}</h5>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                              {job.profession}
                            </span>
                            {job.is_resume_required === false && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                                No Resume Needed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <span>📍 {job.location}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">
                              ₹{job.salary_min?.toLocaleString()} - ₹{job.salary_max?.toLocaleString()} / mo
                            </span>
                            <span>•</span>
                            <span className="capitalize">{job.job_type}</span>
                          </p>
                        </div>

                        {onApplyJob && (
                          <button
                            onClick={() => {
                              onClose();
                              onApplyJob(job);
                            }}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-indigo-600 text-white text-xs font-semibold transition cursor-pointer shrink-0"
                          >
                            Apply <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

