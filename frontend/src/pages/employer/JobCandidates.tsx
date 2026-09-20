import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { applicationService } from '../../services/applicationService';
import { jobService } from '../../services/jobService';
import { Application, Job, ApplicationStatus } from '../../types';
import { 
  Users, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Briefcase, 
  Phone, 
  Mail, 
  Award, 
  ArrowLeft,
  UserCheck,
  Calendar,
  XCircle,
  ThumbsUp,
  Loader2
} from 'lucide-react';

export const JobCandidates: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (jobId) {
      loadData();
    }
  }, [jobId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobData, appsData] = await Promise.all([
        jobService.getJobById(jobId),
        applicationService.getJobApplications(jobId)
      ]);
      setJob(jobData);
      setCandidates(appsData);
    } catch (err) {
      console.error('Failed to load candidate ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId: number, newStatus: ApplicationStatus) => {
    setUpdatingId(appId);
    try {
      const updated = await applicationService.updateStatus(appId, newStatus);
      setCandidates(candidates.map(c => c.id === appId ? { ...c, status: updated.status } : c));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (rank === 2) return 'bg-slate-300/20 text-slate-200 border-slate-300/40';
    if (rank === 3) return 'bg-amber-700/20 text-amber-400 border-amber-700/40';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  const getScoreBadge = (score?: number) => {
    const s = score || 80;
    if (s >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (s >= 75) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <Link
          to="/employer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Job Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {job?.profession}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{job?.location}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">{job?.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Salary: ₹{job?.salary_min?.toLocaleString()} - ₹{job?.salary_max?.toLocaleString()} • {job?.job_type}
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex items-center gap-4">
            <div className="text-center">
              <span className="text-2xl font-black text-white block">{candidates.length}</span>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Applicants</span>
            </div>
            <div className="w-[1px] h-8 bg-slate-700" />
            <div className="text-center">
              <span className="text-2xl font-black text-indigo-400 block">
                {candidates.filter(c => c.status === 'shortlisted').length}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Shortlisted</span>
            </div>
          </div>
        </div>

        {/* AI Ranking Banner */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="text-sm font-bold text-white">AI Multi-Factor Candidate Ranking</span>
              <p className="text-xs text-slate-400">
                Candidates automatically ordered by weighted score: Skills (35%), Experience (25%), Location (15%), Salary (15%), Profession (10%).
              </p>
            </div>
          </div>
        </div>

        {/* Candidates Leaderboard */}
        {loading ? (
          <div className="p-16 text-center text-slate-400">Ranking candidates with AI...</div>
        ) : candidates.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center space-y-3">
            <Users className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-slate-300 font-semibold text-base">No candidates have applied to this role yet.</p>
            <p className="text-slate-500 text-xs">Candidates will appear here as soon as workers apply.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate, idx) => {
              const rank = idx + 1;
              const matchScore = candidate.match_score || 85;
              const breakdown = candidate.match_breakdown;

              return (
                <div
                  key={candidate.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-6 rounded-3xl transition shadow-xl space-y-5"
                >
                  {/* Top Bar with Rank & Match Score */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm ${getRankBadge(rank)}`}>
                        #{rank}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {candidate.worker_name}
                          <span className="text-xs font-semibold text-slate-400">({candidate.worker_profession || 'Field Technician'})</span>
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                            {candidate.worker_experience || 2} Years Experience
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {candidate.job_location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-2xl border font-extrabold text-sm flex items-center gap-1.5 ${getScoreBadge(matchScore)}`}>
                        <Sparkles className="w-4 h-4" />
                        {matchScore}% Match
                      </div>

                      <span className={`px-3 py-1 rounded-xl text-xs font-bold border capitalize ${
                        candidate.status === 'shortlisted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        candidate.status === 'interview' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                        candidate.status === 'accepted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        candidate.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {candidate.status}
                      </span>
                    </div>
                  </div>

                  {/* 4 Dimension Metrics Mini Grid */}
                  {breakdown && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-2xl text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Skills Match</span>
                        <span className="font-bold text-emerald-400 text-sm">{breakdown.skills_match}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Experience Match</span>
                        <span className="font-bold text-white text-sm">{breakdown.experience_match}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Location Match</span>
                        <span className="font-bold text-white text-sm">{breakdown.location_match}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Salary Fit</span>
                        <span className="font-bold text-white text-sm">{breakdown.salary_match}%</span>
                      </div>
                    </div>
                  )}

                  {/* Skills tags */}
                  {candidate.worker_skills && candidate.worker_skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-semibold mr-1">Skills:</span>
                      {candidate.worker_skills.map((sk, i) => (
                        <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700/60">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Cover letter */}
                  {candidate.cover_letter && (
                    <div className="bg-slate-800/30 border border-slate-800 p-3 rounded-xl text-xs text-slate-300">
                      <span className="font-semibold text-slate-400 block mb-0.5">Candidate Note:</span>
                      "{candidate.cover_letter}"
                    </div>
                  )}

                  {/* Recruiter Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {candidate.worker_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {candidate.worker_phone}
                        </span>
                      )}
                      {candidate.worker_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {candidate.worker_email}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(candidate.id, 'shortlisted')}
                        disabled={updatingId === candidate.id || candidate.status === 'shortlisted'}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Shortlist
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(candidate.id, 'interview')}
                        disabled={updatingId === candidate.id || candidate.status === 'interview'}
                        className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Interview
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(candidate.id, 'accepted')}
                        disabled={updatingId === candidate.id || candidate.status === 'accepted'}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Accept
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(candidate.id, 'rejected')}
                        disabled={updatingId === candidate.id || candidate.status === 'rejected'}
                        className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
};

