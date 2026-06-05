import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, User, Mail, Lock, Shield, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useStore();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    try {
      // Assuming a backend route exists or will be added
      await api.put('/auth/password', {
        currentPassword,
        newPassword
      });
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error?.message || 'Failed to update password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center py-10 px-6">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-gray-400 hover:text-gray-100 hover:bg-surfaceHover transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-100">Your Profile</h1>
          </div>
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 text-error hover:bg-error/10 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="glass-panel p-6 flex flex-col items-center text-center gap-4 border-t-4 border-t-primary-500">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-3xl text-white font-bold shadow-lg">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-100">{user?.name}</h2>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded-full text-xs font-bold border border-success/20">
                <Shield size={12} /> Active Account
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-6">
            
            <div className="glass-panel p-6 flex flex-col gap-6">
              <h3 className="text-lg font-semibold text-gray-100 border-b border-border pb-3">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-3 text-gray-500" />
                    <input type="text" disabled value={user?.name || ''} className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-300 opacity-70 cursor-not-allowed" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                    <input type="email" disabled value={user?.email || ''} className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-300 opacity-70 cursor-not-allowed" />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 flex flex-col gap-6">
              <h3 className="text-lg font-semibold text-gray-100 border-b border-border pb-3 flex items-center gap-2">
                <Lock size={18} className="text-secondary-400" /> Change Password
              </h3>
              
              {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {message.text}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                  <input 
                    type="password" 
                    required 
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-primary-500 transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                  <input 
                    type="password" 
                    required 
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-primary-500 transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
                  <input 
                    type="password" 
                    required 
                    minLength={6}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-primary-500 transition-colors" 
                  />
                </div>
                <div className="mt-2">
                  <button type="submit" disabled={isLoading} className="btn-primary w-full sm:w-auto px-8">
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
