import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { ChatModal } from '../../components/chat/ChatModal';
import { applicationService } from '../../services/applicationService';
import { Application, ApplicationStatus } from '../../types';
import { downloadOrOpenDocument } from '../../utils/storage';
import {
  Users,
  Briefcase,
  MapPin,
  IndianRupee,
  Sparkles,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Clock,
  MessageSquare,
  Filter,
  ExternalLink,
  ChevronDown,
  Loader2
} from 'lucide-react';

export const EmployerCandidates: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [activeStatus, setActiveStatus] = useState<string>(initialStatus);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Chat modal state
  const [chatTarget, setChatTarget] = useState<{
    otherUserId: number;
    otherUserName: string;
    jobId?: number;
    jobTitle?: string;
  } | null>(null);

  useEffect(() => {
    const statusFromUrl = searchParams.get('status') || 'all';
    setActiveStatus(statusFromUrl);
    loadCandidates(statusFromUrl);
  }, [searchParams]);

  const loadCandidates = async (statusFilter?: string) => {
    setLoading(true);
    try {
      const data = await applicationService.getEmployerAllApplications(
        statusFilter === 'all' ? undefined : statusFilter
      );
      setApplications(data);
    } catch (err) {
      console.error('Error fetching employer candidate pool:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (status: string) => {
    setActiveStatus(status);
    if (status === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status });
    }
  };

  const handleUpdateStatus = async (appId: number, nextStatus: ApplicationStatus) => {
    setUpdatingId(appId);
    try {
      const updated = await applicationService.updateStatus(appId, nextStatus);
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
    } catch (err) {
      console.error('Failed to update candidate status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Candidates' },
    { id: 'shortlisted', label: '⭐ Shortlisted' },
    { id: 'interview', label: '📅 Interview Scheduled' },
    { id: 'pending', label: '⏳ Pending Review' },
    { id: 'accepted', label: '🎉 Accepted / Hired' },
    { id: 'rejected', label: '❌ Not Selected' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Recruitment Hub</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Candidate Pool & Applications
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Review, chat with, and manage all applicants across all your active job postings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/employer/jobs/create"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/30"
            >
              + Post New Job
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Candidates List */}
        {loading ? (
          <div className="p-16 text-center text-slate-400">Loading candidate applications...</div>
        ) : applications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold text-base">
              {activeStatus === 'all'
                ? 'No candidate applications received yet.'
                : `No candidates currently under status "${activeStatus}".`}
            </p>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Check back soon as candidates apply to your posted jobs, or explore available workers actively looking for immediate work.
            </p>
            <Link
              to="/employer/workers"
              className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Search Available Workers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const matchScore = app.match_score || 85;
              const matchBadgeClass =
                matchScore >= 90
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : matchScore >= 75
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

              return (
                <div
                  key={app.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-6 rounded-3xl transition shadow-xl space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Worker Profile Header */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white">
                          {app.worker_name || 'Worker Candidate'}
                        </h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700 font-medium">
                          {app.worker_profession || 'Field Specialist'}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">
                          {app.worker_experience ? `${app.worker_experience} Yrs Experience` : 'Entry Level'}
                        </span>
                      </div>

                      <p className="text-xs text-indigo-300 font-medium flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                        Applied for: <strong className="text-white">{app.job_title}</strong>
                      </p>

                      {/* Contact metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        {app.worker_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-500" /> {app.worker_phone}
                          </span>
                        )}
                        {app.worker_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-500" /> {app.worker_email}
                          </span>
                        )}
                        <span className="text-slate-500">
                          Applied {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* AI Match & Status Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 ${matchBadgeClass}`}>
                        <Sparkles className="w-4 h-4" />
                        {Math.round(matchScore)}% AI Fit
                      </div>

                      {/* Status Selector Dropdown */}
                      <div className="relative">
                        <select
                          value={app.status}
                          disabled={updatingId === app.id}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                          className="bg-slate-800 border border-slate-700 text-xs font-semibold text-white rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="pending">⏳ Pending Review</option>
                          <option value="reviewing">🔍 Reviewing</option>
                          <option value="shortlisted">⭐ Shortlisted</option>
                          <option value="interview">📅 Interview</option>
                          <option value="accepted">🎉 Accepted / Hired</option>
                          <option value="rejected">❌ Not Selected</option>
                        </select>
                      </div>

                      {/* Direct Message Chat Button */}
                      <button
                        onClick={() => {
                          setChatTarget({
                            otherUserId: app.worker_id,
                            otherUserName: app.worker_name || 'Worker Candidate',
                            jobId: app.job_id,
                            jobTitle: app.job_title
                          });
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat with Worker
                      </button>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {app.worker_skills && app.worker_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {app.worker_skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Resume link if attached */}
                  {app.resume_url && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Candidate Resume / Portfolio
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadOrOpenDocument(app.resume_url || '', `${app.worker_name || 'Candidate'}_Resume.pdf`)}
                        className="text-indigo-400 hover:text-indigo-300 underline font-medium flex items-center gap-1 cursor-pointer"
                      >
                        Open Resume Document <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>

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
    </div>
  );
};

