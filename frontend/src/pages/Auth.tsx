import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, User, KeyRound } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-otp' | 'reset-password';

export default function Auth() {
  const navigate = useNavigate();
  const setAuth = useStore((state) => state.setAuth);
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login' || mode === 'signup') {
        if (!email || !password || (mode === 'signup' && !name)) {
          throw new Error('Please fill out all required fields');
        }
        const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
        const payload = mode === 'login' ? { email, password } : { email, password, name };
        
        const response = await api.post(endpoint, payload);
        setAuth(response.data.token, response.data.user);
        navigate('/dashboard');
      } 
      else if (mode === 'forgot-password') {
        if (!email) throw new Error('Please enter your email address');
        const response = await api.post('/auth/forgot-password', { email });
        setSuccessMsg(response.data.message);
        setMode('verify-otp');
      }
      else if (mode === 'verify-otp') {
        if (!email || !otp) throw new Error('Please enter the OTP sent to your email');
        await api.post('/auth/verify-otp', { email, otp });
        setSuccessMsg('OTP verified! Please set a new password.');
        setMode('reset-password');
      }
      else if (mode === 'reset-password') {
        if (!email || !otp || !newPassword) throw new Error('Please fill out all required fields');
        await api.post('/auth/reset-password', { email, otp, newPassword });
        setSuccessMsg('Password reset successfully. You can now login.');
        setMode('login');
        setPassword('');
        setOtp('');
        setNewPassword('');
      }
    } catch (err: any) {
      setErrors(err.response?.data?.error?.message || err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTitle = () => {
    switch (mode) {
      case 'login': return 'Sign in to CodeForge';
      case 'signup': return 'Create your account';
      case 'forgot-password': return 'Reset your password';
      case 'verify-otp': return 'Verify your email';
      case 'reset-password': return 'Set new password';
    }
  };

  const renderSubtitle = () => {
    switch (mode) {
      case 'login': return 'Enter your credentials to access your workspace';
      case 'signup': return 'Start building dynamic APIs and admin dashboards';
      case 'forgot-password': return "Enter your email and we'll send you an OTP";
      case 'verify-otp': return 'Enter the 6-digit code sent to your email';
      case 'reset-password': return 'Choose a strong new password for your account';
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] glass-panel p-8 relative z-10">
        
        {/* Logo and Headings */}
        <div className="flex flex-col items-center text-center mb-8">
          <div 
            onClick={() => navigate('/')}
            className="h-12 w-12 bg-primary-500 rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-glow mb-6 cursor-pointer hover:scale-105 transition-transform"
          >
            CF
          </div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">
            {renderTitle()}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {renderSubtitle()}
          </p>
        </div>

        {/* Notifications */}
        {errors && (
          <div className="mb-6 flex items-start gap-2.5 p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{errors}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 flex items-start gap-2.5 p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-success">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-300 ml-1">Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full cf-input pl-10"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'forgot-password' || mode === 'verify-otp') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full cf-input pl-10"
                  disabled={isSubmitting || mode === 'verify-otp'}
                  required
                />
              </div>
            </div>
          )}

          {(mode === 'verify-otp' || mode === 'reset-password') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-300 ml-1">6-Digit OTP</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full cf-input pl-10 tracking-widest font-mono text-center"
                  disabled={isSubmitting || mode === 'reset-password'}
                  required
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'reset-password') && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-medium text-gray-300">
                  {mode === 'reset-password' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    className="text-[11px] text-primary-400 hover:text-primary-300 transition-colors"
                    onClick={() => {
                      setMode('forgot-password');
                      setErrors(null);
                      setSuccessMsg(null);
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={mode === 'reset-password' ? newPassword : password}
                  onChange={(e) => mode === 'reset-password' ? setNewPassword(e.target.value) : setPassword(e.target.value)}
                  className="w-full cf-input pl-10"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-2"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot-password' && 'Send OTP'}
                {mode === 'verify-otp' && 'Verify OTP'}
                {mode === 'reset-password' && 'Reset Password'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer switch link */}
        <div className="mt-8 text-center border-t border-border pt-6">
          <p className="text-sm text-gray-400">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrors(null);
                setSuccessMsg(null);
              }}
              className="text-primary-400 hover:text-primary-300 font-medium ml-2 transition-colors"
              disabled={isSubmitting}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
