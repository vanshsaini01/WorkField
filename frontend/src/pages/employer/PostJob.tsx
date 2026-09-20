import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { jobService } from '../../services/jobService';
import { profileService } from '../../services/profileService';
import { Profession } from '../../types';
import { 
  Briefcase, 
  MapPin, 
  IndianRupee, 
  Plus, 
  X, 
  CheckCircle2, 
  Send,
  Loader2,
  Calendar,
  Clock,
  FileText,
  Users
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
  const [salaryRange, setSalaryRange] = useState('22000 - 30000');
  const [vacancies, setVacancies] = useState<number>(1);
  const [experienceYears, setExperienceYears] = useState(2);
  const [jobType, setJobType] = useState('Full-time');
  const [remoteOrOnsite, setRemoteOrOnsite] = useState('On-site');
  const [availabilityShift, setAvailabilityShift] = useState('Day Shift (8 AM - 5 PM)');
  const [deadline, setDeadline] = useState('30 Days');
  const [isResumeRequired, setIsResumeRequired] = useState(true);
  const [skills, setSkills] = useState<string[]>(['Electrical Wiring', 'Industrial Maintenance', 'Troubleshooting']);
  const [skillInput, setSkillInput] = useState('');

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

  const handleSalaryRangeChange = (val: string) => {
    setSalaryRange(val);
    const nums = val.replace(/,/g, '').match(/\d+/g);
    if (nums && nums.length >= 2) {
      setSalaryMin(Number(nums[0]));
      setSalaryMax(Number(nums[1]));
    } else if (nums && nums.length === 1) {
      setSalaryMin(Number(nums[0]));
      setSalaryMax(Number(nums[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    let minSal = salaryMin;
    let maxSal = salaryMax;
    const nums = salaryRange.replace(/,/g, '').match(/\d+/g);
    if (nums && nums.length >= 2) {
      minSal = Math.min(Number(nums[0]), Number(nums[1]));
      maxSal = Math.max(Number(nums[0]), Number(nums[1]));
    } else if (nums && nums.length === 1) {
      minSal = Number(nums[0]);
      maxSal = Number(nums[0]);
    }

    try {
      await jobService.createJob({
        title,
        profession,
        description: `${title} - ${profession} position in ${location}`,
        location,
        salary_min: Number(minSal),
        salary_max: Number(maxSal),
        experience_years: Number(experienceYears),
        job_type: jobType,
        remote_or_onsite: remoteOrOnsite,
        availability_shift: availabilityShift,
        deadline,
        vacancies: Number(vacancies) || 1,
        is_resume_required: isResumeRequired,
        required_skills: skills,
        pay_rate: Number(maxSal)
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

            {/* Monthly Salary Range (Single Column) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Monthly Salary Range (₹)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={salaryRange}
                  onChange={(e) => handleSalaryRangeChange(e.target.value)}
                  placeholder="e.g. 20000 - 30000"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                {salaryMin && salaryMax 
                  ? `Selected Range: ₹${salaryMin.toLocaleString()} - ₹${salaryMax.toLocaleString()} / mo`
                  : 'Specify range as Min - Max (e.g. 20000 - 30000)'}
              </span>
            </div>

            {/* Total Vacancy */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Total Vacancy
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min="1"
                  value={vacancies}
                  onChange={(e) => setVacancies(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="e.g. 5"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Number of open vacancies available for this role
              </span>
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
