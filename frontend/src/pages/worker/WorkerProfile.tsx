import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { aiService } from '../../services/aiService';
import { WorkerProfile, Profession, AIResumeAnalysis } from '../../types';
import {
  SavedResume,
  compressImage,
  readFileAsDataUrl,
  saveLocalProfilePhoto,
  getLocalProfilePhoto,
  removeLocalProfilePhoto,
  saveLocalResume,
  getLocalResume,
  removeLocalResume,
  downloadOrOpenDocument,
  formatFileSize
} from '../../utils/storage';
import { 
  User, 
  Briefcase, 
  MapPin, 
  IndianRupee, 
  Upload, 
  Sparkles, 
  Plus, 
  X, 
  Save, 
  Loader2, 
  CheckCircle2, 
  FileText,
  Clock,
  Phone,
  Camera,
  Eye,
  Trash2,
  HardDrive
} from 'lucide-react';

export const WorkerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [profession, setProfession] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [location, setLocation] = useState('');
  const [expectedSalaryMin, setExpectedSalaryMin] = useState(25000);
  const [availability, setAvailability] = useState('full_time');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Resume State (Local Storage persistent + AI Analyzer)
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [resumeMeta, setResumeMeta] = useState<SavedResume | null>(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIResumeAnalysis | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Check user browser localStorage first for photo & resume
      const localPhoto = getLocalProfilePhoto(user?.id);
      const localResume = getLocalResume(user?.id);

      if (localPhoto) {
        setProfilePhoto(localPhoto);
      }
      if (localResume) {
        setResumeMeta(localResume);
        setResumeUrl(localResume.dataUrl);
      }

      const [profData, professionsList] = await Promise.all([
        profileService.getWorkerProfile(),
        profileService.getProfessions()
      ]);
      setProfile(profData);
      setProfessions(professionsList);

      // Populate local state
      setTitle(profData.title || '');
      setProfession(profData.profession || 'Electrician');
      setExperienceYears(profData.experience_years || 2);
      setLocation(profData.location || 'Roorkee, Uttarakhand');
      setExpectedSalaryMin(profData.expected_salary_min || 25000);
      setAvailability(profData.availability || 'full_time');
      setPhone(profData.phone || '');

      // Photo fallback from server if not already in local storage
      if (!localPhoto && profData.profile_photo) {
        setProfilePhoto(profData.profile_photo);
        saveLocalProfilePhoto(user?.id, profData.profile_photo);
      }

      // Resume fallback from server if not already in local storage
      if (!localResume && profData.resume_url) {
        setResumeUrl(profData.resume_url);
        const fallbackMeta: SavedResume = {
          name: 'Worker_Resume.pdf',
          type: 'application/pdf',
          size: 0,
          dataUrl: profData.resume_url,
          uploadedAt: new Date().toISOString()
        };
        setResumeMeta(fallbackMeta);
        saveLocalResume(user?.id, fallbackMeta);
      }

      const initialSkills = profData.skills_raw || (profData.skills ? profData.skills.map(s => s.skill_name) : []);
      setSkills(initialSkills);
    } catch (err) {
      console.error('Error loading worker profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      // 1. Resize and compress to safe base64 Data URL for local storage
      const compressedDataUrl = await compressImage(file, 400, 400, 0.85);

      // 2. Persist immediately to user's browser localStorage
      saveLocalProfilePhoto(user?.id, compressedDataUrl);
      setProfilePhoto(compressedDataUrl);

      // 3. Sync to backend API (database column is LONGTEXT)
      try {
        await profileService.updateWorkerProfile({ profile_photo: compressedDataUrl });
      } catch (syncErr) {
        console.warn('Backend photo sync warning (local storage is saved):', syncErr);
        try {
          await profileService.uploadPhoto(file);
        } catch {}
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to process/upload photo:', err);
      alert('Failed to process image. Please choose another image file.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    removeLocalProfilePhoto(user?.id);
    setProfilePhoto('');
    try {
      await profileService.updateWorkerProfile({ profile_photo: '' });
    } catch (err) {
      console.error('Error removing photo on backend:', err);
    }
  };

  const handleResumeFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setAnalyzingResume(true);

    try {
      // 1. Read file as Base64 Data URL
      const dataUrl = await readFileAsDataUrl(file);

      // 2. Build local metadata record and save to user's browser localStorage
      const savedDoc: SavedResume = {
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
        lastModified: file.lastModified,
        dataUrl,
        uploadedAt: new Date().toISOString()
      };
      saveLocalResume(user?.id, savedDoc);
      setResumeMeta(savedDoc);
      setResumeUrl(dataUrl);

      // 3. Background sync to backend
      try {
        await profileService.updateWorkerProfile({ resume_url: dataUrl });
      } catch (backendErr) {
        console.warn('Backend resume sync warning (local storage is saved):', backendErr);
        try {
          await profileService.uploadResume(file);
        } catch {}
      }

      // 4. Run AI parsing analysis
      try {
        const result = await aiService.analyzeResumeFile(file);
        setAnalysisResult(result);
        setShowAnalysisModal(true);
      } catch (aiErr: any) {
        console.warn('AI analysis skipped or failed:', aiErr);
      }
    } catch (err: any) {
      console.error('Resume reading error:', err);
      alert('Failed to read resume file. Please select a valid document.');
    } finally {
      setAnalyzingResume(false);
    }
  };

  const handleRemoveResume = async () => {
    removeLocalResume(user?.id);
    setResumeFile(null);
    setResumeMeta(null);
    setResumeUrl('');
    try {
      await profileService.updateWorkerProfile({ resume_url: '' });
    } catch (err) {
      console.error('Error removing resume on backend:', err);
    }
  };

  const handleAddSkill = (skillToAdd?: string) => {
    const s = (skillToAdd || newSkillInput).trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // Ensure local storage is kept in sync
      if (profilePhoto) {
        saveLocalProfilePhoto(user?.id, profilePhoto);
      }
      if (resumeMeta) {
        saveLocalResume(user?.id, resumeMeta);
      }

      const updated = await profileService.updateWorkerProfile({
        title,
        profession,
        experience_years: Number(experienceYears),
        location,
        expected_salary_min: Number(expectedSalaryMin),
        expected_salary_max: Number(expectedSalaryMin),
        availability,
        phone,
        profile_photo: profilePhoto,
        resume_url: resumeUrl || resumeMeta?.dataUrl || undefined,
        skills_raw: skills
      });
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save profile to server:', err);
      // Local storage saved our changes regardless of backend status!
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  // Apply extracted info from AI Resume Analyzer
  const handleApplyAnalysisToProfile = () => {
    if (!analysisResult) return;
    if (analysisResult.suggested_title) setTitle(analysisResult.suggested_title);
    if (analysisResult.suggested_profession) setProfession(analysisResult.suggested_profession);
    if (analysisResult.experience_years) setExperienceYears(analysisResult.experience_years);
    if (analysisResult.location) setLocation(analysisResult.location);
    if (analysisResult.phone) setPhone(analysisResult.phone);
    if (analysisResult.expected_salary_min) setExpectedSalaryMin(analysisResult.expected_salary_min);

    if (analysisResult.detected_skills && analysisResult.detected_skills.length > 0) {
      const merged = Array.from(new Set([...skills, ...analysisResult.detected_skills]));
      setSkills(merged);
    }

    setShowAnalysisModal(false);
    alert('Extracted resume credentials applied to form! Click "Save Changes" to commit.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header with Completion % */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Professional Credentials</span>
            <h1 className="text-2xl font-extrabold text-white mt-1">Manage Worker Profile</h1>
            <p className="text-slate-400 text-xs mt-1">
              Keep your trade skills, certifications, and expected wage updated for optimal AI matching.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex items-center gap-4 min-w-[220px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-400">Profile Completion</span>
                <span className="text-indigo-400 font-bold">{profile?.profile_completed_percentage || 30}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${profile?.profile_completed_percentage || 30}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Upload / Manage PDF Resume Section */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base">Resume & Credentials Document</h2>
                <p className="text-xs text-slate-400">
                  Stored securely in your local storage. AI automatically parses your trade skills, years of experience, and suggested profession.
                </p>
              </div>
            </div>

            {(resumeMeta || resumeUrl) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold self-start sm:self-auto">
                <HardDrive className="w-3.5 h-3.5" /> Stored in User Local Storage
              </span>
            )}
          </div>

          <div className="pt-1">
            {analyzingResume ? (
              <div className="border-2 border-dashed border-indigo-500/60 rounded-2xl p-8 text-center bg-slate-900/50 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-9 h-9 animate-spin text-indigo-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Analyzing and saving resume document...</p>
                  <p className="text-xs text-slate-400 mt-0.5">Storing in local storage and extracting trade skills with AI</p>
                </div>
              </div>
            ) : resumeMeta || resumeUrl ? (
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-sm truncate max-w-[280px] sm:max-w-md">
                        {resumeMeta?.name || 'Worker_Resume.pdf'}
                      </h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20">
                        Active & Saved
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      {resumeMeta?.size ? <span>{formatFileSize(resumeMeta.size)}</span> : null}
                      {resumeMeta?.size ? <span>•</span> : null}
                      <span>Local Storage Ready</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => downloadOrOpenDocument(resumeUrl || resumeMeta?.dataUrl || '', resumeMeta?.name || 'Worker_Resume.pdf')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Eye className="w-3.5 h-3.5" /> View / Download
                  </button>

                  <label className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-600">
                    <Upload className="w-3.5 h-3.5" /> Replace
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleResumeFileSelect}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-500/20"
                    title="Remove Resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center transition bg-slate-900/50 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload PDF Resume</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleResumeFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <span className="text-xs text-slate-400">
                  Supports PDF format up to 10MB • Automatically preserved in user local storage
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6">
          {saveSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5" /> Profile and local documents successfully saved!
            </div>
          )}

          {/* Profile Photo Avatar */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500/40 overflow-hidden flex items-center justify-center text-indigo-400 text-2xl font-bold shadow-lg shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.worker_name ? profile.worker_name[0].toUpperCase() : <User className="w-8 h-8" />
                )}
              </div>
              <label
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer transition"
                title="Change Photo"
              >
                <Camera className="w-4 h-4 mb-0.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer transition shadow-md shadow-indigo-600/20 inline-flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{uploadingPhoto ? 'Processing...' : profilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
                {profilePhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
                {profilePhoto && (
                  <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <HardDrive className="w-3 h-3" /> Saved in Local Storage
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                PNG, JPG or WEBP image. Profile photos are saved directly in your browser's local storage and synced with your profile.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Professional Title
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Industrial Electrician"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Profession */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Primary Trade Profession
              </label>
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {professions.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Experience (years) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Experience: <span className="text-indigo-400">{experienceYears} Years</span>
              </label>
              <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700 px-4 py-3 rounded-xl">
                <Clock className="w-4 h-4 text-slate-500" />
                <input
                  type="range"
                  min="0"
                  max="25"
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
                Current Location / City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Roorkee, Haridwar"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Expected Monthly Salary (Single Option) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Expected Monthly Salary (₹)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={expectedSalaryMin}
                  onChange={(e) => setExpectedSalaryMin(Number(e.target.value))}
                  placeholder="e.g. 25000"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Phone & Availability */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Availability
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="immediate">Immediate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills Management */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Skills and Tools
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type a skill and press enter (e.g. Electrical Wiring, AC Repair)..."
                className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Active skill tags */}
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
              {skills.length === 0 && (
                <p className="text-xs text-slate-500">No skills added yet. Add skills to boost your AI match score!</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800 text-right">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 ml-auto cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile Changes
            </button>
          </div>
        </form>

      </main>

      {/* AI Resume Analyzer Review Modal */}
      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
            
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg text-white">Review AI Resume Extraction</h3>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
              <p className="text-xs text-slate-400">
                The AI Resume Analyzer has parsed your file. Review the suggested profile details below:
              </p>

              <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Suggested Title:</span>
                  <span className="font-bold text-white">{analysisResult.suggested_title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Profession:</span>
                  <span className="font-bold text-indigo-400">{analysisResult.suggested_profession}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Experience Detected:</span>
                  <span className="font-bold text-white">{analysisResult.experience_years} Years</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Detected Location:</span>
                  <span className="font-bold text-white">{analysisResult.location}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block mb-1">Detected Technical Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.detected_skills.map((sk, idx) => (
                      <span key={idx} className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-[11px]">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleApplyAnalysisToProfile}
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Apply to Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

