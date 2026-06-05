import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Moon, Sun, Mail, Shield, Server, Check } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>(() => {
    return (localStorage.getItem('cf_theme') as any) || 'dark';
  });

  React.useEffect(() => {
    localStorage.setItem('cf_theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center py-10 px-6">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        
        <header className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-gray-400 hover:text-gray-100 hover:bg-surfaceHover transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">Settings</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Theme Preferences */}
          <div className="glass-panel p-6 flex flex-col gap-5">
            <h3 className="text-lg font-semibold text-gray-100 border-b border-border pb-3 flex items-center gap-2">
              <Monitor size={18} className="text-primary-400" /> Theme Preferences
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'system', icon: Monitor, label: 'System' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${theme === t.id ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-border bg-surface text-gray-400 hover:bg-surfaceHover'}`}
                >
                  <t.icon size={20} />
                  <span className="text-xs font-bold uppercase tracking-wider">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SMTP Status */}
          <div className="glass-panel p-6 flex flex-col gap-5">
            <h3 className="text-lg font-semibold text-gray-100 border-b border-border pb-3 flex items-center gap-2">
              <Mail size={18} className="text-secondary-400" /> Email & SMTP
            </h3>
            <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <Check size={20} className="text-success" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-success">SMTP Connected</span>
                <span className="text-xs text-gray-400 mt-0.5">Automated emails (OTP) are operational.</span>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="glass-panel p-6 flex flex-col gap-5">
            <h3 className="text-lg font-semibold text-gray-100 border-b border-border pb-3 flex items-center gap-2">
              <Shield size={18} className="text-gray-400" /> Account Security
            </h3>
            <div className="flex flex-col gap-3 text-sm text-gray-400">
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                <span>Two-Factor Authentication</span>
                <span className="px-2 py-1 rounded bg-bg text-gray-500 text-xs font-bold">Disabled</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                <span>Active Sessions</span>
                <span className="px-2 py-1 rounded bg-bg text-gray-200 text-xs font-bold">1 Device</span>
              </div>
              <button onClick={() => navigate('/profile')} className="btn-secondary w-full py-2 mt-2">Manage Password</button>
            </div>
          </div>

          {/* Project Preferences */}
          <div className="glass-panel p-6 flex flex-col gap-5">
            <h3 className="text-lg font-semibold text-gray-100 border-b border-border pb-3 flex items-center gap-2">
              <Server size={18} className="text-gray-400" /> Project Preferences
            </h3>
            <div className="flex flex-col gap-3 text-sm text-gray-400">
               <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                <span>Default Pagination Limit</span>
                <span className="px-2 py-1 rounded bg-bg text-gray-200 text-xs font-bold">10 Records</span>
              </div>
               <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                <span>Auto-Backup</span>
                <span className="px-2 py-1 rounded bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs font-bold">Enabled</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
