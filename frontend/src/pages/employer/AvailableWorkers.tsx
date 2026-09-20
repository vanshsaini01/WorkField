import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { ChatModal } from '../../components/chat/ChatModal';
import { WorkerProfileModal } from '../../components/worker/WorkerProfileModal';
import { profileService } from '../../services/profileService';
import { WorkerProfile, Profession } from '../../types';
import {
  Users,
  Search,
  Filter,
  MapPin,
  IndianRupee,
  Briefcase,
  Clock,
  Radio,
  MessageSquare,
  RotateCcw,
  CheckCircle2,
  FileText,
  Sparkles,
  User
} from 'lucide-react';

export const AvailableWorkers: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Profile modal state
  const [selectedWorkerUserId, setSelectedWorkerUserId] = useState<number | null>(null);
  const [selectedWorkerProfile, setSelectedWorkerProfile] = useState<WorkerProfile | null>(null);

  // Chat modal state
  const [chatTarget, setChatTarget] = useState<{
    otherUserId: number;
    otherUserName: string;
    initialMessage?: string;
  } | null>(null);

  useEffect(() => {
    loadProfessions();
    fetchWorkers();
  }, []);

  const loadProfessions = async () => {
    try {
      const data = await profileService.getProfessions();
      setProfessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      if (selectedProfession) params.profession = selectedProfession;
      if (selectedLocation) params.location = selectedLocation;

      const data = await profileService.getAvailableWorkers(params);
      setWorkers(data);
    } catch (err) {
      console.error('Failed to fetch available workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedProfession('');
    setSelectedLocation('');
    profileService.getAvailableWorkers().then(setWorkers);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Live Directory
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Available Field Workers Directory
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Connect directly with skilled workers currently available for immediate hire or dispatch.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchWorkers()}
                placeholder="Search worker by name, trade, or skills (e.g., Electrician, Wiring)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Profession Filter */}
            <div>
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Professions / Trades</option>
                {professions.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Location & Action */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchWorkers()}
                  placeholder="Location (City)"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={fetchWorkers}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Filter
              </button>
              <button
                onClick={handleReset}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Found <strong className="text-white">{workers.length}</strong> workers available right now</span>
          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Availability Status
          </span>
        </div>

        {/* Worker Cards Grid */}
        {loading ? (
          <div className="p-16 text-center text-slate-400">Searching available candidates...</div>
        ) : workers.length === 0 ? (
          <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold">No available workers match your search filters.</p>
            <p className="text-slate-500 text-xs">Try selecting a different trade or clearing your search filters.</p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workers.map((worker) => {
              const displayName = worker.worker_name || worker.title || 'Field Specialist';
              const displaySkills = worker.skills_raw || worker.skills?.map(s => s.skill_name) || [];

              return (
                <div
                  key={worker.id}
                  onClick={() => {
                    setSelectedWorkerUserId(worker.user_id);
                    setSelectedWorkerProfile(worker);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-6 rounded-3xl flex flex-col justify-between transition-all hover:shadow-xl group cursor-pointer relative"
                >
                  <div className="space-y-3">
                    {/* Top Row: Profession & Availability Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                        {worker.profession || 'General Technician'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Available
                      </span>
                    </div>

                    {/* Worker Avatar, Name & Title */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg shrink-0 overflow-hidden shadow-inner group-hover:border-emerald-500/40 transition">
                        {worker.profile_photo ? (
                          <img src={worker.profile_photo} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          displayName[0].toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition truncate">
                          {displayName}
                        </h3>
                        {worker.title && worker.worker_name && (
                          <p className="text-xs text-slate-400 font-medium truncate">{worker.title}</p>
                        )}
                      </div>
                    </div>

                    {/* Availability Note Quote */}
                    {worker.availability_note && (
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 italic">
                        "{worker.availability_note}"
                      </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 bg-slate-800/60 p-2 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{worker.experience_years ? `${worker.experience_years} Yrs Exp` : 'Fresh Worker'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-800/60 p-2 rounded-xl truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{worker.location || 'Uttarakhand'}</span>
                      </div>
                    </div>

                    {/* Salary expectations if set */}
                    {worker.expected_salary_min && (
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>Expected: ₹{worker.expected_salary_min.toLocaleString()} / mo</span>
                      </div>
                    )}

                    {/* Bio snippet */}
                    {worker.bio && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {worker.bio}
                      </p>
                    )}

                    {/* Skills pills */}
                    {displaySkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {displaySkills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatTarget({
                          otherUserId: worker.user_id,
                          otherUserName: displayName
                        });
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/25 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message & Inquire
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Worker Profile Modal */}
      {selectedWorkerUserId && (
        <WorkerProfileModal
          isOpen={true}
          onClose={() => {
            setSelectedWorkerUserId(null);
            setSelectedWorkerProfile(null);
          }}
          workerUserId={selectedWorkerUserId}
          initialProfile={selectedWorkerProfile}
          onOpenChat={(otherUserId, otherUserName, initialMessage) => {
            setChatTarget({
              otherUserId,
              otherUserName,
              initialMessage
            });
          }}
        />
      )}

      {/* Direct Chat Modal */}
      {chatTarget && (
        <ChatModal
          isOpen={true}
          onClose={() => setChatTarget(null)}
          otherUserId={chatTarget.otherUserId}
          otherUserName={chatTarget.otherUserName}
          initialMessage={chatTarget.initialMessage}
        />
      )}
    </div>
  );
};

