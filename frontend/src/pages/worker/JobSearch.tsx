import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { MatchScoreModal } from '../../components/jobs/MatchScoreModal';
import { ApplyModal } from '../../components/jobs/ApplyModal';
import { JobDetailsModal } from '../../components/jobs/JobDetailsModal';
import { CompanyProfileModal } from '../../components/company/CompanyProfileModal';
import { ChatModal } from '../../components/chat/ChatModal';
import { JobMap } from '../../components/jobs/JobMap';
import { jobService } from '../../services/jobService';
import { profileService } from '../../services/profileService';
import { Job, Profession, MatchBreakdown } from '../../types';
import { 
  Search, 
  Filter, 
  MapPin, 
  IndianRupee, 
  Sparkles, 
  Bookmark, 
  Send, 
  CheckCircle, 
  Map, 
  List, 
  RotateCcw,
  Briefcase,
  Building2,
  MessageSquare
} from 'lucide-react';

export const JobSearch: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minSalary, setMinSalary] = useState<number | ''>('');
  const [maxExperience, setMaxExperience] = useState<number | ''>('');
  const [jobType, setJobType] = useState('');

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
    loadProfessions();
    fetchJobs();
  }, []);

  const loadProfessions = async () => {
    try {
      const data = await profileService.getProfessions();
      setProfessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      if (selectedProfession) params.profession = selectedProfession;
      if (selectedLocation) params.location = selectedLocation;
      if (minSalary !== '') params.min_salary = Number(minSalary);
      if (maxExperience !== '') params.max_experience = Number(maxExperience);
      if (jobType) params.job_type = jobType;

      const data = await jobService.searchJobs(params);
      setJobs(data);
    } catch (err) {
      console.error('Failed to search jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProfession('');
    setSelectedLocation('');
    setMinSalary('');
    setMaxExperience('');
    setJobType('');
    jobService.searchJobs({}).then(setJobs);
  };

  const handleToggleSave = async (job: Job) => {
    try {
      if (job.is_saved) {
        await jobService.unsaveJob(job.id);
        setJobs(jobs.map(j => j.id === job.id ? { ...j, is_saved: false } : j));
      } else {
        await jobService.saveJob(job.id);
        setJobs(jobs.map(j => j.id === job.id ? { ...j, is_saved: true } : j));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAppliedSuccess = (jobId: number) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, has_applied: true } : j));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Search Bar Header */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                placeholder="Search job title, skills, keywords (e.g. Electrician, Wiring)..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchJobs}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-2xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Search
              </button>

              <div className="flex bg-slate-800 border border-slate-700 rounded-2xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition cursor-pointer ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-xl transition cursor-pointer ${viewMode === 'map' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Map View (Leaflet)"
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Multi-factor Filters Row */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* Profession filter */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Profession</label>
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Professions</option>
                {professions.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Location filter */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Location</label>
              <input
                type="text"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                placeholder="City (Roorkee, Haridwar)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Min Salary */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Min Salary (₹)</label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="20000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Max Exp */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Max Exp (Yrs)</label>
              <input
                type="number"
                value={maxExperience}
                onChange={(e) => setMaxExperience(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Years required"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Daily Wage">Daily Wage</option>
              </select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={fetchJobs}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl transition cursor-pointer text-center"
              >
                Apply
              </button>
              <button
                onClick={handleResetFilters}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Found <strong className="text-white">{jobs.length}</strong> available field positions</span>
          <span className="text-slate-500">Click any card to open complete Job Profile</span>
        </div>

        {/* Content Views: List or Map */}
        {loading ? (
          <div className="p-16 text-center text-slate-400">Searching matching jobs...</div>
        ) : viewMode === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[600px]">
              <JobMap jobs={jobs} />
            </div>
            <div className="h-[600px] overflow-y-auto space-y-4 pr-1">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  onClick={() => setSelectedJobDetails(job)}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-4 rounded-2xl space-y-2 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">{job.profession}</span>
                    <span className="text-xs font-bold text-indigo-400">{job.match_score || 85}% Match</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{job.title}</h4>
                  <p className="text-xs text-emerald-400 font-bold">
                    ₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">{job.location}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setApplyJob(job);
                    }}
                    className="w-full py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <p className="text-slate-300 font-semibold">No jobs match your selected filter criteria.</p>
            <p className="text-slate-500 text-xs">Try clearing filters or searching for broad terms like "Electrician" or "Driver".</p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => {
              const matchScore = job.match_score || 85;
              const matchBadgeClass = 
                matchScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                matchScore >= 75 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                'bg-amber-500/10 text-amber-400 border-amber-500/30';

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobDetails(job)}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-6 rounded-3xl flex flex-col justify-between transition-all hover:shadow-2xl group cursor-pointer"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {job.profession}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSave(job);
                          }}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            job.is_saved 
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' 
                              : 'border-slate-800 text-slate-500 hover:text-white'
                          }`}
                          title={job.is_saved ? 'Unsave job' : 'Save job'}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
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
                        >
                          <Sparkles className="w-3 h-3" />
                          {matchScore}% Match
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      {/* Employer Profile Photo / Company Avatar */}
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        {job.employer_photo ? (
                          <img src={job.employer_photo} alt={job.employer_name || 'Employer'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-extrabold text-indigo-400 text-base">
                            {job.employer_name ? job.employer_name[0].toUpperCase() : <Building2 className="w-5 h-5" />}
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
                          <span className="truncate">{job.employer_name || 'Employer Enterprise'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg text-emerald-400 font-semibold">
                        <IndianRupee className="w-3.5 h-3.5" />
                        ₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}
                      </span>
                      <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg text-slate-400">
                        {job.job_type}
                      </span>
                      {job.is_resume_required === false || job.profession === 'Non-professional' ? (
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                          Direct Apply (No Resume)
                        </span>
                      ) : (
                        <span className="bg-slate-800/80 text-slate-400 px-2.5 py-1 rounded-lg text-[11px]">
                          Resume Required
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 mt-3.5 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Skills pills */}
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {job.required_skills.slice(0, 4).map((skill, i) => (
                          <span key={i} className="text-[11px] bg-slate-800/90 text-slate-300 px-2.5 py-0.5 rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJobDetails(job);
                      }}
                      className="text-xs text-slate-400 hover:text-indigo-400 font-medium cursor-pointer"
                    >
                      View Job Profile →
                    </button>

                    {job.has_applied ? (
                      <span className="text-xs bg-slate-800 text-slate-400 font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Applied
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setApplyJob(job);
                        }}
                        className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/25"
                      >
                        <Send className="w-3.5 h-3.5" /> Apply Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

      {/* Job Details Modal */}
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

      {/* Company Profile Modal */}
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
