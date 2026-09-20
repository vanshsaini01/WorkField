import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { profileService } from '../../services/profileService';
import { getLocalProfilePhoto, saveLocalProfilePhoto } from '../../utils/storage';
import { NotificationItem } from '../../types';
import { 
  Briefcase, 
  LogOut, 
  Bell, 
  User, 
  FileText, 
  Sparkles, 
  PlusCircle, 
  Search, 
  CheckCheck,
  Building,
  Menu,
  X,
  ArrowLeftRight,
  Users,
  Radio,
  MessageSquare
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);

  const handleToggleRole = async () => {
    if (!user) return;
    const nextRole = user.role === 'worker' ? 'employer' : 'worker';
    setSwitching(true);
    try {
      await switchRole(nextRole);
      navigate(nextRole === 'worker' ? '/worker/dashboard' : '/employer/dashboard');
    } catch (err) {
      console.error('Failed to switch role', err);
    } finally {
      setSwitching(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUserAvatar();

      const interval = setInterval(loadNotifications, 30000);

      const handlePhotoUpdate = (e: any) => {
        const detail = e.detail;
        if (detail !== undefined) {
          setAvatarPhoto(detail || null);
        } else {
          loadUserAvatar();
        }
      };

      window.addEventListener('profile_photo_updated', handlePhotoUpdate);
      window.addEventListener('storage', handlePhotoUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('profile_photo_updated', handlePhotoUpdate);
        window.removeEventListener('storage', handlePhotoUpdate);
      };
    } else {
      setAvatarPhoto(null);
    }
  }, [user]);

  const loadUserAvatar = async () => {
    if (!user) return;
    // 1. Check local storage first
    const photoKey = user.role === 'employer' ? 'emp_' + user.id : user.id;
    const local = getLocalProfilePhoto(photoKey) || getLocalProfilePhoto(user.id);
    if (local) {
      setAvatarPhoto(local);
      return;
    }

    // 2. Fetch from backend if not yet stored locally
    try {
      if (user.role === 'worker') {
        const prof = await profileService.getWorkerProfile();
        if (prof.profile_photo) {
          setAvatarPhoto(prof.profile_photo);
          saveLocalProfilePhoto(user.id, prof.profile_photo);
        }
      } else if (user.role === 'employer') {
        const emp = await profileService.getEmployerProfile();
        if (emp.profile_photo) {
          setAvatarPhoto(emp.profile_photo);
          saveLocalProfilePhoto('emp_' + user.id, emp.profile_photo);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const isWorker = user?.role === 'worker';
  const isEmployer = user?.role === 'employer';

  const navLinks = isWorker ? [
    { label: 'Dashboard', path: '/worker/dashboard', icon: Briefcase },
    { label: 'Find Jobs', path: '/worker/jobs', icon: Search },
    { label: 'My Applications', path: '/worker/applications', icon: FileText },
    { label: 'Chatbox', path: '/messages', icon: MessageSquare },
    { label: 'AI Career Assistant', path: '/worker/career-assistant', icon: Sparkles },
  ] : isEmployer ? [
    { label: 'Dashboard', path: '/employer/dashboard', icon: Building },
    { label: 'Manage Jobs', path: '/employer/jobs', icon: FileText },
    { label: 'Candidates', path: '/employer/candidates', icon: Users },
    { label: 'Available Workers', path: '/employer/workers', icon: Radio },
    { label: 'Chatbox', path: '/messages', icon: MessageSquare },
    { label: 'Post a Job', path: '/employer/jobs/create', icon: PlusCircle },
  ] : [];

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  Work
                  <span className="text-indigo-400 font-black">Field</span>
                </span>
                <span className="block text-[10px] text-indigo-400/80 uppercase font-semibold tracking-wider">
                  Job Marketplace
                </span>
              </div>
            </Link>

            {/* Desktop Navigation links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right actions: Notifications, Switch Role, User, Logout */}
          <div className="flex items-center gap-3">

            {/* Switch Role Button */}
            {user && (user.role === 'worker' || user.role === 'employer') && (
              <button
                onClick={handleToggleRole}
                disabled={switching}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-indigo-500/30 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white cursor-pointer shadow-sm disabled:opacity-50"
                title={`Switch profile to ${isWorker ? 'Employer' : 'Worker'}`}
              >
                <ArrowLeftRight className={`w-3.5 h-3.5 ${switching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isWorker ? 'Employer' : 'Worker'}
                </span>
                <span className="sm:hidden">
                  {isWorker ? 'Employer' : 'Worker'}
                </span>
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-indigo-500 text-white rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3.5 text-sm transition ${n.is_read ? 'opacity-70' : 'bg-indigo-600/5'}`}
                        >
                          <p className="font-semibold text-slate-200 text-xs">{n.title}</p>
                          <p className="text-slate-400 text-xs mt-1">{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User details */}
           
            {/* My Profile option (Replaces Name and Email) */}
            {user && (
              <Link
                to={isWorker ? '/worker/profile' : '/employer/profile'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  location.pathname === (isWorker ? '/worker/profile' : '/employer/profile')
                    ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700 hover:border-slate-600'
                }`}
                title="My Profile"
              >
                {avatarPhoto ? (
                  <img
                    src={avatarPhoto}
                    alt="Profile"
                    className="w-5 h-5 rounded-full object-cover border border-indigo-400/60 shadow-sm shrink-0"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
                <span>My Profile</span>
              </Link>
            )}

            {/* Logout button */}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}

          {user && (
            <Link
              to={isWorker ? '/worker/profile' : '/employer/profile'}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                location.pathname === (isWorker ? '/worker/profile' : '/employer/profile')
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {avatarPhoto ? (
                <img
                  src={avatarPhoto}
                  alt="Profile"
                  className="w-5 h-5 rounded-full object-cover border border-white/40 shadow-sm shrink-0"
                />
              ) : (
                <User className="w-4 h-4 shrink-0" />
              )}
              <span>My Profile</span>
            </Link>
          )}

          {user && (user.role === 'worker' || user.role === 'employer') && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleToggleRole();
              }}
              disabled={switching}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
            >
              <ArrowLeftRight className={`w-4 h-4 ${switching ? 'animate-spin' : ''}`} />
              <span>{isWorker ? 'Switch to Employer Mode' : 'Switch to Worker Mode'}</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

