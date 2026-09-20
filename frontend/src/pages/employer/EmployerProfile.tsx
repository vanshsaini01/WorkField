import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { EmployerProfile } from '../../types';
import { compressImage, saveLocalProfilePhoto, getLocalProfilePhoto } from '../../utils/storage';
import { Building2, MapPin, Globe, Phone, FileText, Save, Loader2, CheckCircle2, ShieldCheck, Camera, HardDrive } from 'lucide-react';

export const EmployerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('11-50');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const localPhoto = getLocalProfilePhoto('emp_' + user?.id);
      if (localPhoto) {
        setProfilePhoto(localPhoto);
      }

      const data = await profileService.getEmployerProfile();
      setProfile(data);
      setCompanyName(data.company_name || '');
      if (!localPhoto && data.profile_photo) {
        setProfilePhoto(data.profile_photo);
        saveLocalProfilePhoto('emp_' + user?.id, data.profile_photo);
      }
      setIndustry(data.industry || 'Industrial Infrastructure');
      setCompanySize(data.company_size || '51-200');
      setDescription(data.description || '');
      setWebsite(data.website || '');
      setLocation(data.location || 'Roorkee, Uttarakhand');
      setPhone(data.phone || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImage(file, 400, 400, 0.85);
      saveLocalProfilePhoto('emp_' + user?.id, compressedDataUrl);
      setProfilePhoto(compressedDataUrl);

      try {
        await profileService.updateEmployerProfile({ profile_photo: compressedDataUrl });
      } catch {
        try {
          await profileService.uploadPhoto(file);
        } catch {}
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      alert('Failed to upload company logo. Please ensure it is an image file.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await profileService.updateEmployerProfile({
        company_name: companyName,
        profile_photo: profilePhoto,
        industry,
        company_size: companySize,
        description,
        website,
        location,
        phone
      });
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Organization</span>
            <h1 className="text-2xl font-extrabold text-white mt-1">Company Profile</h1>
            <p className="text-slate-400 text-xs mt-1">
              Field workforce candidates view your enterprise profile when considering job applications.
            </p>
          </div>
          {profile?.verified && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl">
              <ShieldCheck className="w-4 h-4" /> Verified Employer
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6">
          {saveSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5" /> Company profile successfully updated!
            </div>
          )}

          {/* Company Logo / Profile Photo */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500/40 overflow-hidden flex items-center justify-center text-indigo-400 text-2xl font-bold shadow-lg shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  companyName ? companyName[0].toUpperCase() : <Building2 className="w-8 h-8" />
                )}
              </div>
              <label
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer transition"
                title="Change Logo"
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
            <div>
              <div className="flex items-center gap-3">
                <label className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer transition shadow-md shadow-indigo-600/20 inline-flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{uploadingPhoto ? 'Uploading...' : profilePhoto ? 'Change Company Logo' : 'Upload Company Logo'}</span>
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
                    onClick={async () => {
                      setProfilePhoto('');
                      await profileService.updateEmployerProfile({ profile_photo: '' });
                    }}
                    className="text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Upload your company logo or emblem. This logo appears on your job listings, company card, and chat headers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Company / Organization Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Apex Industrial Works Ltd"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Primary Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Electrical Contracting & Solar"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Workforce Size
              </label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1-10">1-10 Employees</option>
                <option value="11-50">11-50 Employees</option>
                <option value="51-200">51-200 Employees</option>
                <option value="201+">201+ Employees</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Headquarters Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Roorkee, Uttarakhand"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Official Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.in"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                HR / Recruiter Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Company Description & Operations
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your organization's projects, facility locations, and work culture..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 text-right">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 ml-auto cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Company Profile
            </button>
          </div>
        </form>

      </main>
    </div>
  );
};

