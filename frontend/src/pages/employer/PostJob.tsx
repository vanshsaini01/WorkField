import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { jobService } from '../../services/jobService';
import { aiService } from '../../services/aiService';
import { profileService } from '../../services/profileService';
import { Profession } from '../../types';
import { 
  Briefcase, 
  Sparkles, 
  MapPin, 
  IndianRupee, 
  Plus, 
  X, 
  Loader2, 
  CheckCircle2, 
  Send,
  Calendar,
  Clock,
  FileText
} from 'lucide-react';

export const PostJob: React.FC = () => {
  const navigate = useNavigate();
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [profession, setProfession] = useState('Electrician');
  const [location, setLocation] = useState('Roorkee, Uttarakhand');
  const [salaryMin, setSalaryMin] = useState(22000);
  const [salaryMax, setSalaryMax] = useState(30000);
  const [experienceYears, setExperienceYears] = useState(2);
  const [jobType, setJobType] = useState('Full-time');
  const [remoteOrOnsite, setRemoteOrOnsite] = useState('On-site');
  const [availabilityShift, setAvailabilityShift] = useState('Day Shift (8 AM - 5 PM)');
  const [deadline, setDeadline] = useState('30 Days');
  const [isResumeRequired, setIsResumeRequired] = useState(true);
  const [skills, setSkills] = useState<string[]>(['Electrical Wiring', 'Industrial Maintenance', 'Troubleshooting']);
  const [skillInput, setSkillInput] = useState('');

  // AI JD Analyzer State
  const [rawJobText, setRawJobText] = useState('');
  const [analyzingJD, setAnalyzingJD] = useState(false);

  useEffect(() => {
    profileService.getProfessions()
      .then((data) => {
        if (!data.some(p => p.name.toLowerCase() === 'non-professional')) {
          setProfessions([
            ...data,
            { id: 999, name: 'Non-professional', category: 'General Labor', description: 'General labor, helpers, and manual workforce' }
          ]);
        } else {
          setProfessions(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleProfessionChange = (val: string) => {
    setProfession(val);
    if (val.toLowerCase() === 'non-professional') {
      setIsResumeRequired(false);
      setExperienceYears(0);
      setSkills(['General Assistance', 'Physical Stamina']);
      if (!title || title.includes('Electrician')) {
        setTitle('General Field Helper / Worker');
      }
    }
  };

  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // AI JD Parser
  const handleAnalyzeJD = async () => {
    if (!rawJobText || rawJobText.length < 15) {
      alert('Please paste at least a couple of sentences of the job description to analyze.');
      return;
    }
    setAnalyzingJD(true);
    try {
      const parsed = await aiService.analyzeJobDescription(rawJobText);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.profession) {
        setProfession(parsed.profession);
        if (parsed.profession.toLowerCase() === 'non-professional') {
          setIsResumeRequired(false);
        }
      }
      if (parsed.experience_years !== undefined) setExperienceYears(parsed.experience_years);
      if (parsed.salary_min) setSalaryMin(parsed.salary_min);
      if (parsed.salary_max) setSalaryMax(parsed.salary_max);
      if (parsed.job_type) setJobType(parsed.job_type);
      if (parsed.location) setLocation(parsed.location);
      if (parsed.required_skills && parsed.required_skills.length > 0) {
        setSkills(parsed.required_skills);
      }
      alert('AI extracted job specifications! Review the pre-filled fields below.');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Job analysis failed.');
    } finally {
      setAnalyzingJD(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await jobService.createJob({
        title,
        profession,
        description: `${title} - ${profession} position in ${location}`,
        location,
        salary_min: Number(salaryMin),
        salary_max: Number(salaryMax),
        experience_years: Number(experienceYears),
        job_type: jobType,
        remote_or_onsite: remoteOrOnsite,
        availability_shift: availabilityShift,
        deadline,
        is_resume_required: isResumeRequired,
        required_skills: skills,
        pay_rate: Number(salaryMax)
      });
      navigate('/employer/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let msg = 'Failed to publish job.';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Recruitment</span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Post a Field Job Listing</h1>
          <p className="text-slate-400 text-xs mt-1">
            Specify technical trade competencies, shift hours, wage range, and resume requirements. AI will automatically match and rank qualified workers.
          </p>
        </div>

        {/* AI Job Description Analyzer Card */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl shadow-xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">AI Job Description Analyzer</h2>
              <p className="text-xs text-slate-400">
                Paste rough requirements or WhatsApp messages below, and let AI extract skills, experience, and salary bounds into the form.
              </p>
            </div>
          </div>

          <textarea
            rows={3}
            value={rawJobText}
            onChange={(e) => setRawJobText(e.target.value)}
            placeholder="Paste rough text e.g.: 'Urgent Requirement: Need 2 industrial electricians for factory in Roorkee. 2+ yrs experience in motor wiring and control panel troubleshooting. Salary Rs 25000 to 32000 per month. General day shift.'"
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />

          <div className="text-right">
            <button
              type="button"
              disabled={analyzingJD || !rawJobText.trim()}
              onClick={handleAnalyzeJD}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 ml-auto cursor-pointer shadow-lg shadow-indigo-600/25"
            >
              {analyzingJD ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Extract & Auto-Fill Form with AI
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Job Posting Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Industrial Electrician"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Profession / Trade */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Trade / Profession Category
              </label>
              <select
                value={profession}
                onChange={(e) => handleProfessionChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {professions.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name === 'Non-professional' ? '★ Non-professional (General Helper / Laborer)' : p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary Bounds */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Monthly Salary Range (₹)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  required
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  placeholder="Min (e.g. 22000)"
                  className="w-full px-3 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  required
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                  placeholder="Max (e.g. 30000)"
                  className="w-full px-3 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Experience Required */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Experience Required: <span className="text-indigo-400">{experienceYears} Years</span>
              </label>
              <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 px-4 py-3 rounded-xl">
                <Clock className="w-4 h-4 text-slate-500" />
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Job Location / Site
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Roorkee, Uttarakhand"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Job Type & Shift */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Daily Wage">Daily Wage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Availability / Shift
                </label>
                <input
                  type="text"
                  value={availabilityShift}
                  onChange={(e) => setAvailabilityShift(e.target.value)}
                  placeholder="e.g. Day Shift"
                  className="w-full px-3 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Resume Requirement Options */}
          <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Worker Resume Requirement
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsResumeRequired(true)}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  isResumeRequired
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${isResumeRequired ? 'text-indigo-400' : 'text-slate-500'}`} />
                <div>
                  <span className="text-xs font-bold block">Resume Required</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Workers must attach or link a verified resume to apply.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsResumeRequired(false)}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  !isResumeRequired
                    ? 'bg-emerald-600/20 border-emerald-500 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${!isResumeRequired ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <span className="text-xs font-bold block">No Resume Needed (Direct Apply)</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Anyone can apply instantly without needing to upload a resume.
                  </span>
                </div>
              </button>
            </div>
            {profession.toLowerCase() === 'non-professional' && (
              <p className="text-xs text-emerald-400 font-medium">
                ✓ Non-professional trade: Anyone can apply directly with their profile without a resume.
              </p>
            )}
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Key Skills / Requirements
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill (e.g. Electrical Wiring, Loading / Unloading)..."
                className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-xl text-xs font-medium"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="text-indigo-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/employer/dashboard')}
              className="px-5 py-3 text-sm font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish Job Listing
            </button>
          </div>
        </form>

      </main>
    </div>
  );
};
