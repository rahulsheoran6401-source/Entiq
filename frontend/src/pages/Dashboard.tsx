import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  FolderKanban, Plus, Database, Box, Activity, LogOut, User, Settings, AlignLeft, Circle, Clock, X 
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, projects, fetchProjects, logout, deleteProject } = useStore();
  
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  const openCreateDrawer = () => {
    setEditingProject(null);
    setProjName('');
    setProjDesc('');
    setCreateErr(null);
    setShowCreateDrawer(true);
  };

  const openEditDrawer = (project: any) => {
    setEditingProject(project);
    setProjName(project.name);
    setProjDesc(project.description || '');
    setCreateErr(null);
    setShowCreateDrawer(true);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const { createProject, updateProject } = useStore.getState();

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErr(null);
    setIsCreating(true);
    if (!projName) {
      setCreateErr('Project name is required');
      setIsCreating(false);
      return;
    }
    try {
      if (editingProject) {
        await updateProject(editingProject.id, projName, projDesc);
      } else {
        const p = await createProject(projName, projDesc);
        navigate(`/projects/${p.id}`);
      }
      setShowCreateDrawer(false);
    } catch (err: any) {
      setCreateErr(err.message || `Failed to ${editingProject ? 'update' : 'create'} project`);
    } finally {
      setIsCreating(false);
    }
  };

  const totalEntities = projects.reduce((acc, p) => acc + (p.entitiesCount || 0), 0);
  const totalRecords = projects.reduce((acc, p) => acc + (p.recordsCount || 0), 0);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-xs shadow-glow">
            CF
          </div>
          <span className="font-medium text-sm text-gray-200 tracking-tight">CodeForge</span>
        </div>
        
        <div className="flex items-center gap-4 relative">
          <button onClick={() => navigate('/docs')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Docs</button>
          <div className="h-4 w-px bg-border"></div>
          
          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:bg-surfaceHover p-1 pr-3 rounded-full border border-transparent hover:border-border transition-colors focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-secondary-500 flex items-center justify-center text-white font-semibold text-xs shadow-md">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-200">{user?.name || 'User'}</span>
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-subtle overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border bg-bg/50">
                    <p className="text-sm text-gray-100 font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button onClick={() => navigate('/profile')} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-surfaceHover rounded-md transition-colors">
                      <User size={15} className="text-gray-400" /> Profile
                    </button>
                    <button onClick={() => navigate('/settings')} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-surfaceHover rounded-md transition-colors">
                      <Settings size={15} className="text-gray-400" /> Settings
                    </button>
                    <button onClick={() => navigate('/docs')} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-surfaceHover rounded-md transition-colors">
                      <AlignLeft size={15} className="text-gray-400" /> Documentation
                    </button>
                  </div>
                  <div className="p-1.5 border-t border-border">
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-md transition-colors">
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-8 md:py-12 flex flex-col gap-10">
        
        {/* Top Welcome */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-100">Welcome back, {user?.name?.split(' ')[0] || 'Rahul'} 👋</h1>
            <p className="text-sm text-gray-400">Here's an overview of your workspaces and APIs.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openCreateDrawer} className="btn-primary">
              <Plus size={16} /> New Project
            </button>
          </div>
        </div>

        {/* Statistics Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><FolderKanban size={80} className="text-gray-100" /></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 relative z-10">Total Projects</span>
            <span className="text-3xl font-bold text-gray-100 relative z-10">{projects.length}</span>
          </div>
          <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Database size={80} className="text-primary-500" /></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 relative z-10">Total Entities</span>
            <span className="text-3xl font-bold text-gray-100 relative z-10">{totalEntities}</span>
          </div>
          <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Box size={80} className="text-secondary-500" /></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 relative z-10">Total Records</span>
            <span className="text-3xl font-bold text-gray-100 relative z-10">{totalRecords}</span>
          </div>
          <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity size={80} className="text-success" /></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 relative z-10">API Calls (30d)</span>
            <span className="text-3xl font-bold text-gray-100 relative z-10">{projects.length * 1248 + totalRecords * 3}</span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Projects List */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-gray-100">Recently Opened Projects</h2>
              {projects.length > 3 && <button className="text-sm text-primary-400 hover:text-primary-300 transition-colors">View All</button>}
            </div>
            
            {projects.length === 0 ? (
              <div className="glass-panel border-dashed p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-surfaceHover flex items-center justify-center mb-4 border border-border">
                  <FolderKanban size={28} className="text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-200 mb-2">No projects created</h3>
                <p className="text-sm text-gray-500 max-w-sm mb-6">Create a workspace to start defining entities and generating APIs.</p>
                <button onClick={openCreateDrawer} className="btn-secondary text-sm">
                  Create Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {[...projects].reverse().slice(0, 4).map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="glass-panel p-5 cursor-pointer hover:border-primary-500/50 hover:shadow-subtle transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-bg border border-border flex items-center justify-center shrink-0 group-hover:bg-primary-500/10 group-hover:border-primary-500/30 transition-colors">
                        <FolderKanban size={22} className="text-primary-400" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-base font-semibold text-gray-200 group-hover:text-primary-400 transition-colors">{p.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                          {p.description || 'No description provided.'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5"><Circle size={8} className="text-success fill-success" /> Active</span>
                          <span className="flex items-center gap-1.5"><User size={12} /> {user?.name || 'Owner'}</span>
                          <span className="flex items-center gap-1.5 text-gray-400">
                            Updated {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex flex-col items-center">
                          <span className="text-gray-200 font-semibold">{p.entitiesCount || 0}</span>
                          <span className="text-gray-500 text-xs">Entities</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-gray-200 font-semibold">{p.recordsCount || 0}</span>
                          <span className="text-gray-500 text-xs">Records</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => openEditDrawer(p)}
                          className="text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-md hover:bg-surface transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${p.name}?`)) deleteProject(p.id);
                          }}
                          className="text-error hover:text-red-400 px-3 py-1.5 rounded-md hover:bg-error/10 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                        <button 
                          onClick={() => navigate(`/projects/${p.id}`)}
                          className="btn-primary py-1.5 px-4 text-sm ml-2"
                        >
                          Open Workspace
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-100 border-b border-border pb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={openCreateDrawer} className="glass-panel p-4 flex flex-col items-center justify-center gap-3 hover:border-primary-500/50 hover:bg-surfaceHover transition-colors group">
                  <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400 group-hover:scale-110 transition-transform"><Plus size={20}/></div>
                  <span className="text-sm font-medium text-gray-300">New Project</span>
                </button>
                <button onClick={() => navigate('/docs')} className="glass-panel p-4 flex flex-col items-center justify-center gap-3 hover:border-secondary-500/50 hover:bg-surfaceHover transition-colors group">
                  <div className="p-2.5 rounded-xl bg-secondary-500/10 text-secondary-400 group-hover:scale-110 transition-transform"><AlignLeft size={20}/></div>
                  <span className="text-sm font-medium text-gray-300">Read Docs</span>
                </button>
                <button onClick={() => navigate('/profile')} className="glass-panel p-4 flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 hover:bg-surfaceHover transition-colors group">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform"><User size={20}/></div>
                  <span className="text-sm font-medium text-gray-300">Your Profile</span>
                </button>
                <button onClick={() => navigate('/settings')} className="glass-panel p-4 flex flex-col items-center justify-center gap-3 hover:border-gray-400/50 hover:bg-surfaceHover transition-colors group">
                  <div className="p-2.5 rounded-xl bg-gray-500/10 text-gray-400 group-hover:scale-110 transition-transform"><Settings size={20}/></div>
                  <span className="text-sm font-medium text-gray-300">Settings</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-100 border-b border-border pb-3">Recent Activity</h2>
              <div className="glass-panel p-6 flex flex-col gap-6">
                <div className="flex items-start gap-4 relative">
                  {projects.length > 0 && <div className="absolute left-3.5 top-8 bottom-[-24px] w-px bg-border"></div>}
                  <div className="w-7 h-7 rounded-full bg-bg border border-border flex items-center justify-center z-10 shrink-0">
                    <Clock size={14} className="text-primary-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-200">Logged into CodeForge</span>
                    <span className="text-xs text-gray-500 mt-1">Just now</span>
                  </div>
                </div>
                {projects.length > 0 && (
                  <div className="flex items-start gap-4 relative">
                    <div className="w-7 h-7 rounded-full bg-bg border border-border flex items-center justify-center z-10 shrink-0">
                      <FolderKanban size={14} className="text-secondary-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-200">Loaded workspace configurations</span>
                      <span className="text-xs text-gray-500 mt-1">2 minutes ago</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Side Drawer for Creation */}
      {showCreateDrawer && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[100] bg-bg/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCreateDrawer(false)}
          ></div>
          
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-surface border-l border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border bg-bg/30">
              <div>
                <h3 className="text-lg font-semibold text-gray-100">{editingProject ? 'Edit Workspace' : 'Create Workspace'}</h3>
                <p className="text-sm text-gray-400 mt-1">{editingProject ? 'Update your API environment.' : 'Initialize a new API environment.'}</p>
              </div>
              <button onClick={() => setShowCreateDrawer(false)} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-surfaceHover rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {createErr && (
                <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-sm text-error">
                  {createErr}
                </div>
              )}
              
              <form id="create-project-form" onSubmit={handleProjectSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Project Name <span className="text-error">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. E-commerce API" 
                    value={projName} 
                    onChange={e => setProjName(e.target.value)} 
                    className="cf-input" 
                    required 
                    disabled={isCreating} 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Description</label>
                  <textarea 
                    placeholder="Describe the purpose of this project..." 
                    value={projDesc} 
                    onChange={e => setProjDesc(e.target.value)} 
                    className="cf-input min-h-[120px] resize-none" 
                    disabled={isCreating} 
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-border bg-bg/50 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowCreateDrawer(false)} className="btn-secondary" disabled={isCreating}>
                Cancel
              </button>
              <button form="create-project-form" type="submit" disabled={isCreating} className="btn-primary w-[140px]">
                {isCreating ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
