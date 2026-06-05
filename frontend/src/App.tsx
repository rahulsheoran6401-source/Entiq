import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ProjectWorkspace from './pages/ProjectWorkspace';
import Docs from './pages/Docs';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { Loader2 } from 'lucide-react';

// Guard for authenticated pages
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
}

// Guard to block authenticated users from going to /auth
function AuthRoute({ children }: { children: React.ReactNode }) {
  const token = useStore((state) => state.token);
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  const initializeAuth = useStore((state) => state.initializeAuth);
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const isLoading = useStore((state) => state.isLoading);

  useEffect(() => {
    if (token && !user) {
      initializeAuth();
    }
  }, [token, user]);

  useEffect(() => {
    const theme = localStorage.getItem('cf_theme') || 'dark';
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, []);

  // Render a minimal loader if verifying a persistent JWT session on reload
  if (isLoading && token && !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-400" size={28} />
        <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">Loading Workspace Session</span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/docs" element={<Docs />} />

      {/* Auth Screen */}
      <Route
        path="/auth"
        element={
          <AuthRoute>
            <Auth />
          </AuthRoute>
        }
      />

      {/* Protected Dashboards & Workspaces */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Fallback Catch */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
