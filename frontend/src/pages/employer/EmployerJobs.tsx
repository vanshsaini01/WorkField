import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { jobService } from '../../services/jobService';
import { getLocalProfilePhoto } from '../../utils/storage';
import { Job } from '../../types';
import { 
  Briefcase, 
  Users, 
  MapPin, 
  IndianRupee, 
  PlusCircle, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export const EmployerJobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await jobService.getEmployerJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await jobService.deleteJob(jobId);
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Listings Management</span>
            <h1 className="text-2xl font-extrabold text-white mt-1">Manage Posted Jobs</h1>
            <p className="text-slate-400 text-xs mt-1">
              Review applicant volumes, view AI candidate rankings, and publish new positions.
            </p>
          </div>
          <Link
            to="/employer/jobs/create"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto shadow-lg shadow-indigo-600/25"
          >
            <PlusCircle className="w-4 h-4" /> Post New Job
          </Link>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400">Loading your jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center space-y-3">
            <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-slate-300 font-semibold text-base">No job postings created yet.</p>
            <Link
              to="/employer/jobs/create"
              className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
            >
              Create Your First Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const employerPhoto = job.employer_photo || getLocalProfilePhoto('emp_' + user?.id) || getLocalProfilePhoto(user?.id);
              return (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-3xl transition shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Employer Profile Photo / Company Logo */}
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-sm mt-1">
                    {employerPhoto ? (
                      <img src={employerPhoto} alt={job.employer_name || 'Employer'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-extrabold text-indigo-400 text-base">
                        {job.employer_name ? job.employer_name[0].toUpperCase() : <Briefcase className="w-5 h-5" />}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        {job.profession}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        job.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {job.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{job.title}</h3>

                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <IndianRupee className="w-3.5 h-3.5" />
                        ₹{job.salary_min?.toLocaleString()} - ₹{job.salary_max?.toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>{job.job_type}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        {job.vacancies || 1} {job.vacancies === 1 ? 'Vacancy' : 'Vacancies'}
                      </span>
                    </div>

                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.required_skills.map((sk: string, idx: number) => (
                          <span key={idx} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-xl font-black text-white block">
                      {job.applicant_count || 0}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">Applicants</span>
                  </div>

                  <Link
                    to={`/employer/jobs/${job.id}/candidates`}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
                  >
                    <Sparkles className="w-4 h-4" /> View Ranked Candidates
                  </Link>

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-2.5 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

