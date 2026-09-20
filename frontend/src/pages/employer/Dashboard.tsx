import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { jobService } from '../../services/jobService';
import { profileService } from '../../services/profileService';
import { applicationService } from '../../services/applicationService';
import { EmployerProfile } from '../../types';
import { getLocalProfilePhoto } from '../../utils/storage';
import { 
  Building2, 
  Users, 
  FileText, 
  UserCheck, 
  PlusCircle, 
  ArrowRight, 
  Sparkles, 
  Briefcase, 
  MapPin, 
  IndianRupee,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [shortlistedCount, setShortlistedCount] = useState<number>(0);
  const [totalCandidateCount, setTotalCandidateCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployerData();
  }, []);

  const loadEmployerData = async () => {
    setLoading(true);
    try {
      const [profData, jobsData, allApps] = await Promise.all([
        profileService.getEmployerProfile().catch(() => null),
        jobService.getEmployerJobs().catch(() => []),
        applicationService.getEmployerAllApplications().catch(() => []),
      ]);
      if (profData) setProfile(profData);
      if (Array.isArray(jobsData)) setJobs(jobsData);
      if (Array.isArray(allApps)) {
        setTotalCandidateCount(allApps.length);
        setShortlistedCount(allApps.filter(a => a.status === 'shortlisted').length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const activeJobsCount = safeJobs.filter(j => j.status === 'open').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Employer Portal</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Welcome back, {user?.full_name}! 🏢
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              {profile?.industry || 'Industrial Infrastructure & Logistics'} • {profile?.location || 'Uttarakhand'}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <Link
              to="/employer/jobs/create"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Post New Job Listing
            </Link>
          </div>
        </div>

        {/* 3 Interactive Statistics Metrics (Clickable) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Active Jobs -> Opens employer jobs */}
          <button
            onClick={() => navigate('/employer/jobs')}
            className="text-left bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 p-5 rounded-2xl transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-indigo-400 transition">
                Active Jobs
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-2 group-hover:text-indigo-200 transition">{activeJobsCount}</p>
            <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-indigo-400 transition">
              View your posted jobs →
            </span>
          </button>

          {/* Total Applications -> Opens all candidate pool */}
          <button
            onClick={() => navigate('/employer/candidates?status=all')}
            className="text-left bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 p-5 rounded-2xl transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-blue-400 transition">
                Total Applicants
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-blue-400 mt-2 group-hover:text-blue-300 transition">
              {totalCandidateCount}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-blue-400 transition">
              Review all candidates →
            </span>
          </button>

          {/* Shortlisted Candidates -> Opens candidates with status=shortlisted */}
          <button
            onClick={() => navigate('/employer/candidates?status=shortlisted')}
            className="text-left bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 p-5 rounded-2xl transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider group-hover:text-emerald-400 transition">
                Shortlisted
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-400 mt-2 group-hover:text-emerald-300 transition">
              {shortlistedCount}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-emerald-400 transition">
              View shortlisted pool →
            </span>
          </button>

          {/* AI Ranking active badge */}
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">AI Ranking</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-2">Automatic Candidate Ranking</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Skills, distance, salary & experience</p>
            </div>
          </div>
        </div>

        {/* Active Jobs & Candidate Review CTA */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Your Active Job Listings</h2>
              <p className="text-xs text-slate-400">Click any job to view candidate applications ranked by AI match percentage.</p>
            </div>
            <Link
              to="/employer/jobs/create"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Post Job →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading listings...</div>
          ) : safeJobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              You haven't posted any jobs yet. Create your first field listing to begin receiving candidates!
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {safeJobs.map((job) => {
                const employerPhoto = job.employer_photo || getLocalProfilePhoto('emp_' + user?.id) || getLocalProfilePhoto(user?.id);
                return (
                  <div key={job.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        {employerPhoto ? (
                          <img src={employerPhoto} alt={job.employer_name || 'Employer'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-extrabold text-indigo-400 text-sm">
                            {job.employer_name ? job.employer_name[0].toUpperCase() : <Briefcase className="w-4 h-4" />}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            {job.profession}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-400">{job.location}</span>
                          <span className="text-xs text-slate-500">•</span>
                          {job.is_resume_required === false || job.profession === 'Non-professional' ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                              Direct Apply (No Resume)
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                              Resume Required
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white mt-0.5">{job.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="text-emerald-400 font-semibold">
                            ₹{job.salary_min?.toLocaleString()} - ₹{job.salary_max?.toLocaleString()}
                          </span>
                          <span>•</span>
                          <span>{job.job_type}</span>
                        </div>
                      </div>
                    </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-bold text-white block">{job.applicant_count || 0} Applicants</span>
                      <span className="text-[11px] text-slate-400">AI Ranked</span>
                    </div>
                    <Link
                      to={`/employer/jobs/${job.id}/candidates`}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      View Ranked Candidates
                    </Link>
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};