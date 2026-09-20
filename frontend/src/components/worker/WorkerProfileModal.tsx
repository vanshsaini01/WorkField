import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { WorkerProfile } from '../../types';
import { profileService } from '../../services/profileService';
import { downloadOrOpenDocument } from '../../utils/storage';
import {
  X,
  User,
  MapPin,
  Clock,
  IndianRupee,
  Briefcase,
  CheckCircle2,
  FileText,
  Radio,
  Loader2,
  Award,
  ExternalLink,
  Phone,
  Mail,
  MessageSquare,
  Send
} from 'lucide-react';

interface WorkerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerUserId: number | null;
  initialProfile?: WorkerProfile | null;
  onOpenChat?: (otherUserId: number, otherUserName: string, initialMessage?: string) => void;
}

export const WorkerProfileModal: React.FC<WorkerProfileModalProps> = ({
  isOpen,
  onClose,
  workerUserId,
  initialProfile,
  onOpenChat,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<WorkerProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && workerUserId) {
      if (initialProfile && initialProfile.user_id === workerUserId) {
        setProfile(initialProfile);
        return;
      }
      setLoading(true);
      setError('');
      profileService.getWorkerProfileById(workerUserId)
        .then((data) => {
          setProfile(data);
        })
        .catch((err: any) => {
          console.error('Error fetching worker profile:', err);
          const detail = err.response?.data?.detail;
          setError(typeof detail === 'string' ? detail : 'Failed to load worker profile.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProfile(null);
    }
  }, [isOpen, workerUserId, initialProfile]);

  if (!isOpen || !workerUserId) return null;

  const displayName = profile?.worker_name || profile?.title || 'Field Worker';
  const skillsList = profile?.skills_raw || profile?.skills?.map((s) => s.skill_name) || [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-popup"
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
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner font-bold text-xl overflow-hidden">
              {profile?.profile_photo ? (
                <img src={profile.profile_photo} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName[0].toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {loading ? 'Loading Worker Profile...' : displayName}
                </h2>
                {profile?.is_available !== false ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Available
                  </span>
                ) : (
                  <span className="text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                    Unavailable
                  </span>
                )}
              </div>

              <p className="text-xs text-indigo-300 font-medium mt-0.5">
                {profile?.profession || 'Field Specialist'} • {profile?.experience_years ? `${profile.experience_years} Years Experience` : 'Entry Level'}
              </p>

              {profile && (
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> {profile.location}
                    </span>
                  )}
                  {profile.worker_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500" /> {profile.worker_email}
                    </span>
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
              <p className="text-sm">Loading worker profile...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {!loading && profile && (
            <>
              {/* Availability Note */}
              {profile.availability_note && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300">
                  <span className="font-bold block mb-0.5 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Live Availability Status Note:
                  </span>
                  "{profile.availability_note}"
                </div>
              )}

              {/* Key Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                  <span className="text-slate-400 block text-[11px]">Experience</span>
                  <p className="font-bold text-white text-sm mt-0.5">
                    {profile.experience_years ? `${profile.experience_years} Years` : 'Fresh'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                  <span className="text-slate-400 block text-[11px]">Expected Salary</span>
                  <p className="font-bold text-emerald-400 text-sm mt-0.5">
                    {profile.expected_salary_min ? `₹${profile.expected_salary_min.toLocaleString()} / mo` : 'Negotiable'}
                  </p>
                </div>
              </div>

              {/* Bio / Summary */}
              {profile.bio && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Professional Bio
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </div>
                </div>
              )}

              {/* Trade Skills */}
              {skillsList.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Skills and Tools
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications if any */}
              {profile.certifications && profile.certifications.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Licenses & Certifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.certifications.map((c, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1"
                      >
                        <Award className="w-3.5 h-3.5 text-purple-400" />
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume / Portfolio Link */}
              {profile.resume_url && (
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Candidate Resume Document
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadOrOpenDocument(profile.resume_url || '', `${profile.worker_name || 'Candidate'}_Resume.pdf`)}
                    className="text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    View Document <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end shrink-0">
          {(() => {
            const targetId = workerUserId || profile?.user_id;
            const isSelf = user && targetId && user.id === targetId;
            if (!targetId || isSelf) return null;
            return (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenChat) {
                    onOpenChat(targetId, displayName);
                  } else {
                    navigate(`/messages?user=${targetId}`);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </button>
            );
          })()}
        </div>

      </div>
    </div>
  );
};

