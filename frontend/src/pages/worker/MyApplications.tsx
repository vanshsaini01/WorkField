import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { CompanyProfileModal } from '../../components/company/CompanyProfileModal';
import { ChatModal } from '../../components/chat/ChatModal';
import { applicationService } from '../../services/applicationService';
import { Application } from '../../types';
import { 
  FileText, 
  MapPin, 
  IndianRupee, 
  Sparkles, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  MessageSquare,
  Filter
} from 'lucide-react';

export const MyApplications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [activeStatus, setActiveStatus] = useState<string>(initialStatus);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedEmployerId, setSelectedEmployerId] = useState<number | null>(null);
  const [chatTarget, setChatTarget] = useState<{
    otherUserId: number;
    otherUserName: string;
    jobId?: number;
    jobTitle?: string;
  } | null>(null);

  useEffect(() => {
    const statusFromUrl = searchParams.get('status') || 'all';
    setActiveStatus(statusFromUrl);
    loadApplications(statusFromUrl);
  }, [searchParams]);

  const loadApplications = async (statusFilter?: string) => {
    setLoading(true);
    try {
      const data = await applicationService.getMyApplications(
        statusFilter === 'all' ? undefined : statusFilter
      );
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
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

  const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'Under Review', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    reviewing: { label: 'Reviewing', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    shortlisted: { label: 'Shortlisted', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    interview: { label: 'Interview Scheduled', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    accepted: { label: 'Offer Extended', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' },
    rejected: { label: 'Not Selected', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  const tabs = [
    { id: 'all', label: 'All Applications' },
    { id: 'shortlisted', label: '🌟 Shortlisted' },
    { id: 'interview', label: '📅 Interviews' },
    { id: 'pending', label: '⏳ Under Review' },
    { id: 'accepted', label: '🎉 Offers Extended' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Application Pipeline</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">My Job Applications</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Track real-time hiring updates, recruiter notes, and scheduled interview calls.
            </p>
          </div>
          <Link
            to="/worker/jobs"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition self-start sm:self-auto shadow-md shadow-indigo-600/30"
          >
            Explore More Jobs
          </Link>
        </div>

        {/* Status Filter Tabs */}
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

        {/* Content List */}
        {loading ? (
          <div className="p-16 text-center text-slate-400">Loading your applications...</div>
        ) : applications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-slate-300 font-semibold text-base">
              {activeStatus === 'all'
                ? "You haven't applied for any jobs yet."
                : `No applications currently in status: ${activeStatus}.`}
            </p>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Browse open field workforce roles matching your trade skills and location to get started!
            </p>
            <Link
              to="/worker/jobs"
              className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Browse Open Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const cfg = statusConfig[app.status] || statusConfig.pending;
              return (
                <div
                  key={app.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-6 rounded-3xl transition shadow-lg space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          {app.job_profession}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">
                          Applied {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{app.job_title}</h3>

                      {/* Clickable Company Link */}
                      <button
                        onClick={() => app.employer_id && setSelectedEmployerId(app.employer_id)}
                        disabled={!app.employer_id}
                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-semibold mt-0.5 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        {app.company_name || 'Employer Company'}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {app.match_score && (
                        <div className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          {Math.round(app.match_score)}% Match
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {app.job_location}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-lg text-emerald-400 font-semibold">
                        <IndianRupee className="w-3.5 h-3.5" />
                        ₹{app.job_salary_min?.toLocaleString()} - ₹{app.job_salary_max?.toLocaleString()}
                      </span>
                    </div>

                    {/* Chat with Company Button */}
                    {app.employer_id && (
                      <button
                        onClick={() => {
                          setChatTarget({
                            otherUserId: app.employer_id!,
                            otherUserName: app.company_name || 'Company Recruiter',
                            jobId: app.job_id,
                            jobTitle: app.job_title
                          });
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        Chat with Company
                      </button>
                    )}
                  </div>

                  {app.cover_letter && (
                    <div className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-400">
                      <span className="font-semibold text-slate-300 block mb-0.5">Your Application Note:</span>
                      "{app.cover_letter}"
                    </div>
                  )}

                  {app.employer_notes && (
                    <div className="bg-indigo-950/20 border border-indigo-500/30 p-3.5 rounded-xl text-xs text-indigo-200">
                      <span className="font-semibold text-indigo-400 block mb-0.5">Note from Recruiter:</span>
                      "{app.employer_notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Company Profile Modal */}
      {selectedEmployerId && (
        <CompanyProfileModal
          isOpen={true}
          onClose={() => setSelectedEmployerId(null)}
          employerId={selectedEmployerId}
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
    </div>
  );
};
