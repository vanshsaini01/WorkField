import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { WorkerDashboard } from '../pages/worker/Dashboard';
import { JobSearch } from '../pages/worker/JobSearch';
import { WorkerProfilePage } from '../pages/worker/WorkerProfile';
import { MyApplications } from '../pages/worker/MyApplications';
import { CareerAssistant } from '../pages/worker/CareerAssistant';

import { EmployerDashboard } from '../pages/employer/Dashboard';
import { EmployerJobs } from '../pages/employer/EmployerJobs';
import { PostJob } from '../pages/employer/PostJob';
import { JobCandidates } from '../pages/employer/JobCandidates';
import { EmployerProfilePage } from '../pages/employer/EmployerProfile';
import { EmployerCandidates } from '../pages/employer/EmployerCandidates';
import { AvailableWorkers } from '../pages/employer/AvailableWorkers';
import { Chatbox } from '../pages/chat/Chatbox';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'worker' | 'employer' | 'admin' }> = ({ 
  children, 
  allowedRole 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Role-based Dashboard Dispatcher
const DashboardRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'employer') {
    return <Navigate to="/employer/dashboard" replace />;
  }

  return <Navigate to="/worker/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

      {/* Auth routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />

      {/* Universal Dashboard Route */}
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* Worker Routes */}
      <Route 
        path="/worker/dashboard" 
        element={
          <ProtectedRoute allowedRole="worker">
            <WorkerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/jobs" 
        element={
          <ProtectedRoute allowedRole="worker">
            <JobSearch />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/profile" 
        element={
          <ProtectedRoute allowedRole="worker">
            <WorkerProfilePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/applications" 
        element={
          <ProtectedRoute allowedRole="worker">
            <MyApplications />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/career-assistant" 
        element={
          <ProtectedRoute allowedRole="worker">
            <CareerAssistant />
          </ProtectedRoute>
        } 
      />

      {/* Employer Routes */}
      <Route 
        path="/employer/dashboard" 
        element={
          <ProtectedRoute allowedRole="employer">
            <EmployerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/jobs" 
        element={
          <ProtectedRoute allowedRole="employer">
            <EmployerJobs />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/jobs/create" 
        element={
          <ProtectedRoute allowedRole="employer">
            <PostJob />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/jobs/:id/candidates" 
        element={
          <ProtectedRoute allowedRole="employer">
            <JobCandidates />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/candidates" 
        element={
          <ProtectedRoute allowedRole="employer">
            <EmployerCandidates />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/workers" 
        element={
          <ProtectedRoute allowedRole="employer">
            <AvailableWorkers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/profile" 
        element={
          <ProtectedRoute allowedRole="employer">
            <EmployerProfilePage />
          </ProtectedRoute>
        } 
      />

      {/* Universal Chatbox & Messages Routes */}
      <Route 
        path="/messages" 
        element={
          <ProtectedRoute>
            <Chatbox />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/messages" 
        element={
          <ProtectedRoute allowedRole="worker">
            <Chatbox />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/messages" 
        element={
          <ProtectedRoute allowedRole="employer">
            <Chatbox />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

