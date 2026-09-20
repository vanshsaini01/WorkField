import React, { useState, useEffect } from 'react';
import { Job, WorkerProfile } from '../../types';
import { applicationService } from '../../services/applicationService';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import { 
  getLocalResume, 
  saveLocalResume, 
  readFileAsDataUrl, 
  SavedResume 
} from '../../utils/storage';
import { 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  FileText, 
  User, 
  Phone, 
  Briefcase, 
  Clock, 
  Wrench,
  AlertCircle,
  Upload,
  HardDrive
} from 'lucide-react';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onApplied: (jobId: number) => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  isOpen,
  onClose,
  job,
  onApplied,
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);

  // Form Fields (Pre-filled and editable)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | string>(0);
  const [skillsStr, setSkillsStr] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeMeta, setResumeMeta] = useState<SavedResume | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name || '');
      
      // Check local storage first
      const localResume = getLocalResume(user.id);
      if (localResume) {
        setResumeMeta(localResume);
        setResumeUrl(localResume.dataUrl);
      }

      profileService.getWorkerProfile()
        .then((prof) => {
          if (prof) {
            setProfile(prof);
            setPhone(prof.phone || '');
            setProfession(prof.profession || '');
            setExperienceYears(prof.experience_years ?? 0);
            const skillsList = prof.skills_raw || prof.skills?.map(s => s.skill_name) || [];
            setSkillsStr(skillsList.join(', '));
            if (!localResume && prof.resume_url) {
              setResumeUrl(prof.resume_url);
            }
          }
        })
        .catch((err) => {
          console.error('Error fetching worker profile in apply modal', err);
        });
    }
  }, [isOpen, user]);

  const handleUploadResumeInModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const savedDoc: SavedResume = {
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString()
      };
      saveLocalResume(user?.id, savedDoc);
      setResumeMeta(savedDoc);
      setResumeUrl(dataUrl);
    } catch (err) {
      console.error('Failed to read resume in modal:', err);
    }
  };

  if (!isOpen || !job) return null;

  const isResumeRequired = job.is_resume_required !== false && job.profession?.toLowerCase() !== 'non-professional';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isResumeRequired && !resumeUrl.trim()) {
      setError('This position requires a resume. Please enter your resume link or portfolio URL.');
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedSkills = skillsStr
        ? skillsStr.split(',').map(s => s.trim()).filter(Boolean)
        : undefined;

      await applicationService.apply({
        job_id: job.id,
        resume_url: resumeUrl.trim() || undefined,
        worker_name: fullName.trim() || undefined,
        worker_phone: phone.trim() || undefined,
        worker_profession: profession.trim() || undefined,
        worker_experience: experienceYears !== '' ? Number(experienceYears) : undefined,
        worker_skills: parsedSkills
      });

      setSuccess(true);
      onApplied(job.id);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let msg = 'Failed to submit application.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      } else if (detail && typeof detail === 'object') {
        msg = JSON.stringify(detail);
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-lg text-white">Apply for Position</h3>
            <p className="text-xs text-indigo-400 font-semibold">{job.title} • {job.location}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Application submitted successfully! Redirecting...
            </div>
          )}

          {/* Job Requirement Notice */}
          {!isResumeRequired ? (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold">Direct Application (No Resume Required)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The employer does not require a resume for this job. Your profile details below are auto-filled and ready for submission.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="font-bold">Verified Resume Required</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This employer requires a resume. Your stored resume link has been auto-filled below; you can edit or update it before submitting.
                </p>
              </div>
            </div>
          )}

          {/* Pre-filled Editable Application Details */}
          <div className="space-y-3.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Profession / Trade */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" /> Profession / Trade
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Electrician, Helper"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Experience Years */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Experience (Years)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Key Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-500" /> Skills (Comma-separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="e.g. Electrical Wiring, Industrial Maintenance, Troubleshooting"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Resume Link / Document */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> Resume / Credentials
                </label>
                {!isResumeRequired && (
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">Optional</span>
                )}
              </div>

              {resumeMeta || resumeUrl.startsWith('data:') ? (
                <div className="p-3 bg-slate-800/80 border border-indigo-500/40 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                        {resumeMeta?.name || 'Worker_Resume.pdf'}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <HardDrive className="w-2.5 h-2.5" /> Ready from Local Storage
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Change
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleUploadResumeInModal}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResumeUrl('');
                        setResumeMeta(null);
                      }}
                      className="text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer ml-1"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required={isResumeRequired}
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      placeholder={isResumeRequired ? "Enter resume link or upload below (Required)" : "https://drive.google.com/your-resume (Optional)"}
                      className={`flex-1 bg-slate-800/80 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 ${
                        isResumeRequired && !resumeUrl ? 'border-amber-500/60 focus:ring-amber-500' : 'border-slate-700 focus:ring-indigo-500'
                      }`}
                    />
                    <label className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md shadow-indigo-600/20">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload PDF</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleUploadResumeInModal}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Upload your PDF directly to local storage or paste a link.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl text-[11px] text-slate-400 space-y-0.5">
            <p>✓ Any details edited above will be shared directly with the hiring manager.</p>
            <p>✓ AI will rank your application in the recruiter's candidate leaderboard.</p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Application
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
