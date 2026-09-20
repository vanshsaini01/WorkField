import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { MatchScoreModal } from '../../components/jobs/MatchScoreModal';
import { ApplyModal } from '../../components/jobs/ApplyModal';
import { JobDetailsModal } from '../../components/jobs/JobDetailsModal';
import { CompanyProfileModal } from '../../components/company/CompanyProfileModal';
import { ChatModal } from '../../components/chat/ChatModal';
import { profileService } from '../../services/profileService';
import { applicationService } from '../../services/applicationService';
import { aiService } from '../../services/aiService';
import { WorkerProfile, Application, Job, MatchBreakdown } from '../../types';
import { getLocalProfilePhoto } from '../../utils/storage';
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  MapPin, 
  IndianRupee, 
  Send, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  Radio, 
  Building2, 
  MessageSquare, 
  CheckCircle2, 
  Edit3,
  Users
} from 'lucide-react';

export const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Availability State
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [availabilityNote, setAvailabilityNote] = useState<string>('');
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<{ title: string; breakdown: MatchBreakdown; score?: number } | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<Job | null>(null);
  const [selectedEmployerId, setSelectedEmployerId] = useState<number | null>(null);
  const [chatTarget, setChatTarget] = useState<{
    otherUserId: number;
    otherUserName: string;
    jobId?: number;
    jobTitle?: string;
  } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [profData, appsData, recsData] = await Promise.all([
        profileService.getWorkerProfile(),
        applicationService.getMyApplications(),
        aiService.getRecommendedJobs(),
      ]);
      setProfile(profData);
      setIsAvailable(profData.is_available !== false);
      setAvailabilityNote(profData.availability_note || '');
      setApplications(appsData);
      setRecommendedJobs(recsData);
    } catch (err) {
      console.error('Error loading worker dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    setUpdatingAvailability(true);
    try {
      const updated = await profileService.updateAvailability({
        is_available: nextState,
        availability_note: availabilityNote
      });
      setProfile(updated);
    } catch (err) {
      console.error('Failed to update availability status', err);
      setIsAvailable(!nextState); // rollback
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleSaveAvailabilityNote = async () => {
    setUpdatingAvailability(true);
    try {
      const updated = await profileService.updateAvailability({
        is_available: isAvailable,
        availability_note: availabilityNote
      });
      setProfile(updated);
      setShowNoteInput(false);
    } catch (err) {
      console.error('Failed to update availability note', err);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const shortlistedCount = applications.filter(a => a.status === 'shortlisted').length;
  const interviewCount = applications.filter(a => a.status === 'interview').length;
  const appliedCount = applications.length;
  const completionPct = profile?.profile_completed_percentage || 30;

  const handleAppliedSuccess = (jobId: number) => {
    setRecommendedJobs(prev => prev.map(j => j.id === jobId ? { ...j, has_applied: true } : j));
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Worker Portal</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Welcome back, {user?.full_name}! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              {profile?.title || 'Skilled Field Professional'} • {profile?.location || 'Uttarakhand, India'}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <Link
              to="/worker/jobs"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition"
            >
              <Briefcase className="w-4 h-4" />
              Find Field Jobs
            </Link>
          </div>
        </div>

        {/* Worker Availability Banner Widget */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
            }`}>
              <Radio className={`w-5 h-5 ${isAvailable ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">
                  {isAvailable ? '🟢 Available for Work' : '🔴 Currently Unavailable'}
                </h3>
        
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {availabilityNote ? `"${availabilityNote}"` : 'Employers looking for technicians can find and contact you instantly.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              {availabilityNote ? 'Edit Note' : 'Add Note'}
            </button>

            <button
              onClick={handleToggleAvailability}
              disabled={updatingAvailability}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
            </button>
          </div>
        </div>

        {/* Note input popup if editing */}
        {showNoteInput && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="text"
              value={availabilityNote}
              onChange={(e) => setAvailabilityNote(e.target.value)}
              placeholder="e.g., Available immediately in Dehradun for full-time electrical maintenance work"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSaveAvailabilityNote}
                disabled={updatingAvailability}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                Save Note
              </button>
              <button
                onClick={() => setShowNoteInput(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Interactive Statistics Metrics */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${completionPct < 100 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          
          {/* Applied Jobs -> links to /worker/applications?status=all */}
          <button
            onClick={() => navigate('/worker/applications?status=all')}
            className="text-left bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 p-5 rounded-2xl transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-indigo-400 transition">
                Applied Jobs
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-2 group-hover:text-indigo-200 transition">{appliedCount}</p>
            <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-indigo-400 transition">
              View all submitted jobs →
            </span>
          </button>

          {/* Shortlisted -> links to /worker/applications?status=shortlisted */}
          <button
            onClick={() => navigate('/worker/applications?status=shortlisted')}
            className="text-left bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 p-5 rounded-2xl transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-emerald-400 transition">
                Shortlisted
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-400 mt-2">{shortlistedCount}</p>
            <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-emerald-400 transition">
              View shortlisted companies →
            </span>
          </button>

          {/* Interviews -> links to /worker/applications?status=interview */}
          <button
            onClick={() => navigate('/worker/applications?status=interview')}
            className="text-left bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/40 p-5 rounded-2xl transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-purple-400 transition">
                Interviews
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-purple-400 mt-2">{interviewCount}</p>
            <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-purple-400 transition">
              View interview invitations →
            </span>
          </button>

          {/* Profile Status (Hidden when 100% complete) */}
          {completionPct < 100 && (
            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Profile Status</span>
                  <span className="text-xs font-bold text-indigo-400">{completionPct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>
              <Link
                to="/worker/profile"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-2 flex items-center gap-1"
              >
                Complete Profile & Upload Resume →
              </Link>
            </div>
          )}
        </div>

        {/* AI-Powered Recommended Jobs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">AI-Recommended Jobs for You</h2>
            </div>
            <Link to="/worker/jobs" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              Browse All Jobs ({recommendedJobs.length}) →
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading recommendations...</div>
          ) : recommendedJobs.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-slate-400 text-sm">No jobs match your profile yet. Try updating your skills in profile!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendedJobs.slice(0, 6).map((job) => {
                const matchScore = job.match_score || 85;
                const matchBadgeClass = 
                  matchScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  matchScore >= 75 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/30';
                const employerPhoto = job.employer_photo || getLocalProfilePhoto('emp_' + job.employer_id) || getLocalProfilePhoto(job.employer_id);

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobDetails(job)}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-3xl flex flex-col justify-between transition-all hover:shadow-xl group cursor-pointer relative"
                  >
                    <div>
                      {/* Top Bar with Match Score */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {job.profession}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            job.match_breakdown && setSelectedMatch({
                              title: job.title,
                              breakdown: job.match_breakdown,
                              score: matchScore
                            });
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 cursor-pointer transition hover:scale-105 ${matchBadgeClass}`}
                          title="Click to view AI 5-pillar match breakdown"
                        >
                          <Sparkles className="w-3 h-3" />
                          {matchScore}% Match
                        </button>
                      </div>

                      <div className="flex items-start gap-3.5">
                        {/* Employer Profile Photo / Company Avatar */}
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          {employerPhoto ? (
                            <img src={employerPhoto} alt={job.employer_name || 'Employer'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-extrabold text-indigo-400 text-sm">
                              {job.employer_name ? job.employer_name[0].toUpperCase() : <Building2 className="w-4 h-4" />}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition truncate">
                            {job.title}
                          </h3>

                          {/* Clickable Company Name */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployerId(job.employer_id);
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-semibold mt-0.5 flex items-center gap-1 transition cursor-pointer truncate"
                          >
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{job.employer_name || 'Employer Company'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md text-emerald-400 font-semibold">
                          <IndianRupee className="w-3 h-3" />
                          ₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-300 font-medium">
                          <Users className="w-3 h-3 text-indigo-400" />
                          {job.vacancies || 1} {job.vacancies === 1 ? 'Vacancy' : 'Vacancies'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mt-3 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Required skills tags */}
                      {job.required_skills && job.required_skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {job.required_skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJobDetails(job);
                        }}
                        className="text-xs text-slate-400 hover:text-indigo-400 font-medium cursor-pointer"
                      >
                        View Full Details →
                      </button>

                      <div className="flex items-center gap-2">
                        {job.has_applied ? (
                          <span className="text-xs bg-slate-800 text-slate-400 font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Applied
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setApplyJob(job);
                            }}
                            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center gap-1 cursor-pointer shadow-md shadow-indigo-600/20"
                          >
                            <Send className="w-3 h-3" /> Apply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Applications Pipeline Tracker */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Your Submitted Applications</h2>
            <Link to="/worker/applications" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              View All Pipeline →
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              You haven't applied to any jobs yet. Check out the recommendations above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Job Title</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 font-semibold">AI Match</th>
                    <th className="pb-3 font-semibold">Applied Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {applications.slice(0, 5).map((app) => (
                    <tr key={app.id} className="text-slate-300 hover:bg-slate-800/30">
                      <td className="py-3 font-semibold text-white">
                        {app.job_title}
                        <span className="block text-xs font-normal text-slate-400">{app.company_name}</span>
                      </td>
                      <td className="py-3 text-xs text-slate-400">{app.job_location}</td>
                      <td className="py-3">
                        <span className="text-xs font-bold text-indigo-400">
                          {app.match_score ? `${Math.round(app.match_score)}%` : '88%'}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-400">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                          app.status === 'shortlisted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          app.status === 'interview' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          app.status === 'accepted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          app.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            // Lookup employer id or default
                            const matchedJob = recommendedJobs.find(j => j.id === app.job_id);
                            if (matchedJob) {
                              setChatTarget({
                                otherUserId: matchedJob.employer_id,
                                otherUserName: app.company_name || 'Employer',
                                jobId: app.job_id,
                                jobTitle: app.job_title
                              });
                            } else {
                              navigate('/worker/applications');
                            }
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-indigo-400 hover:text-white transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Match Score Modal */}
      {selectedMatch && (
        <MatchScoreModal
          isOpen={true}
          onClose={() => setSelectedMatch(null)}
          jobTitle={selectedMatch.title}
          matchBreakdown={selectedMatch.breakdown}
          matchScore={selectedMatch.score}
        />
      )}

      {/* Job Details Modal (Opens on Job Card Click) */}
      {selectedJobDetails && (
        <JobDetailsModal
          isOpen={true}
          onClose={() => setSelectedJobDetails(null)}
          job={selectedJobDetails}
          onOpenCompany={(employerId) => setSelectedEmployerId(employerId)}
          onApply={(job) => setApplyJob(job)}
          onOpenChat={(otherUserId, otherUserName, jobId, jobTitle) => {
            setChatTarget({ otherUserId, otherUserName, jobId, jobTitle });
          }}
        />
      )}

      {/* Company Profile Modal (Opens on Company Name Click) */}
      {selectedEmployerId && (
        <CompanyProfileModal
          isOpen={true}
          onClose={() => setSelectedEmployerId(null)}
          employerId={selectedEmployerId}
          onApplyJob={(job) => setApplyJob(job)}
          onOpenChat={(otherUserId, otherUserName, jobId, jobTitle) => {
            setChatTarget({ otherUserId, otherUserName, jobId, jobTitle });
          }}
        />
      )}

      {/* Direct In-App Chat Modal */}
      {chatTarget && (
        <ChatModal
          isOpen={true}
          onClose={() => setChatTarget(null)}
          otherUserId={chatTarget.otherUserId}
          otherUserName={chatTarget.otherUserName}
          jobId={chatTarget.jobId}
          jobTitle={chatTarget.jobTitle}
        />
      )}

      {/* Apply Modal */}
      {applyJob && (
        <ApplyModal
          isOpen={true}
          onClose={() => setApplyJob(null)}
          job={applyJob}
          onApplied={handleAppliedSuccess}
        />
      )}
    </div>
  );
};