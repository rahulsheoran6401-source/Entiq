import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  Database, Plus, ArrowLeft, Loader2, Settings, Activity, Box, User, LogOut, AlignLeft, Layers, Terminal, Copy, Code, Play
} from 'lucide-react';
import EntityBuilder from '../components/EntityBuilder';
import DynamicAdminUI from '../components/DynamicAdminUI';

type WorkspaceView = 'overview' | 'builder' | 'admin' | 'api' | 'settings' | 'records';

export default function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const { 
    currentProject, entities, currentEntity, isLoading, error, user, logout,
    fetchProjectDetails, setCurrentEntity 
  } = useStore();

  const [activeView, setActiveView] = useState<WorkspaceView>('overview');
  const [isEditSchemaMode, setIsEditSchemaMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails(projectId);
    }
    return () => setCurrentEntity(null);
  }, [projectId]);

  const handleSelectEntity = (entity: any) => {
    setCurrentEntity(entity);
    setIsEditSchemaMode(false);
    setActiveView('admin');
  };

  const handleCreateNewEntityClick = () => {
    setCurrentEntity(null);
    setIsEditSchemaMode(false);
    setActiveView('builder');
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (isLoading && !currentProject) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  if (error && !currentProject) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-panel p-8">
          <h3 className="text-lg font-bold text-error mb-2">Failed to load workspace</h3>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalRecords = entities.reduce((acc, e) => acc + (e.recordsCount || 0), 0);

  return (
    <div className="app-container overflow-hidden h-screen">
      {/* Top Header */}
      <header className="header shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-100 transition-colors p-1"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-5 w-px bg-border mx-1" />
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Entiq Logo" className="w-7 h-7" />
            <span className="font-semibold text-[15px] text-gray-100 tracking-tight">{currentProject?.name}</span>
            <span className="bg-surface border border-border text-gray-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold">Workspace</span>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="hidden md:flex items-center gap-6 text-sm mr-4">
            <div className="flex items-center gap-2">
              <Database size={15} className="text-primary-400" />
              <span className="text-gray-400 text-xs">Entities:</span>
              <span className="font-semibold text-gray-200">{entities.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Box size={15} className="text-secondary-400" />
              <span className="text-gray-400 text-xs">Records:</span>
              <span className="font-semibold text-gray-200">{totalRecords}</span>
            </div>
          </div>
          <div className="hidden md:block h-5 w-px bg-border"></div>
          
          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-surfaceHover p-1 pr-3 rounded-full border border-transparent hover:border-border transition-colors focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-secondary-500 flex items-center justify-center text-white font-semibold text-xs shadow-md">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-200 hidden sm:block">{user?.name || 'User'}</span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-subtle overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border bg-bg/50">
                    <p className="text-sm text-gray-100 font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button onClick={() => { setShowUserMenu(false); navigate('/profile'); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-surfaceHover rounded-md transition-colors">
                      <User size={15} className="text-gray-400" /> Profile
                    </button>
                    <button onClick={() => { setShowUserMenu(false); navigate('/settings'); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-surfaceHover rounded-md transition-colors">
                      <Settings size={15} className="text-gray-400" /> Settings
                    </button>
                    <button onClick={() => { setShowUserMenu(false); navigate('/docs'); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-surfaceHover rounded-md transition-colors">
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

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 bg-surface/50 border-r border-border flex flex-col z-40 backdrop-blur-md">
          <div className="p-4 border-b border-border">
            <button onClick={handleCreateNewEntityClick} className="btn-primary w-full py-2.5">
              <Plus size={16} /> New Entity
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => setActiveView('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'overview' ? 'bg-primary-500/10 text-primary-400' : 'text-gray-400 hover:text-gray-200 hover:bg-surfaceHover'}`}
              >
                <Layers size={18} className={activeView === 'overview' ? 'text-primary-400' : ''} /> Overview
              </button>
              <button 
                onClick={() => {
                  if (entities.length > 0) {
                    handleSelectEntity(currentEntity || entities[0]);
                  } else {
                    setActiveView('records');
                  }
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'records' || (activeView === 'admin' && currentEntity) ? 'bg-success/10 text-success' : 'text-gray-400 hover:text-gray-200 hover:bg-surfaceHover'}`}
              >
                <Box size={18} className={activeView === 'records' || (activeView === 'admin' && currentEntity) ? 'text-success' : ''} /> Records
              </button>
              <button 
                onClick={() => setActiveView('api')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'api' ? 'bg-secondary-500/10 text-secondary-400' : 'text-gray-400 hover:text-gray-200 hover:bg-surfaceHover'}`}
              >
                <Terminal size={18} className={activeView === 'api' ? 'text-secondary-400' : ''} /> API Explorer
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-surfaceHover transition-colors"
              >
                <Settings size={18} /> Settings
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
                Entities
                <span className="bg-border text-gray-300 px-1.5 rounded">{entities.length}</span>
              </h3>
              {entities.map(e => (
                <button
                  key={e.id}
                  onClick={() => handleSelectEntity(e)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${
                    currentEntity?.id === e.id && activeView === 'admin'
                      ? 'bg-surface text-gray-100 font-medium border border-border shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-surfaceHover border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Database size={15} className={currentEntity?.id === e.id && activeView === 'admin' ? 'text-primary-500' : 'text-gray-500 group-hover:text-primary-400 transition-colors'} />
                    <span className="truncate">{e.name}</span>
                  </div>
                </button>
              ))}
              {entities.length === 0 && (
                <div className="px-3 py-4 text-center border border-dashed border-border rounded-lg mx-1 mt-1">
                  <p className="text-xs text-gray-500">No entities yet.</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-bg relative overflow-y-auto flex flex-col w-full">
          
          {activeView === 'overview' && (
            <div className="p-8 lg:p-12 w-full mx-auto flex flex-col gap-10 max-w-[1600px]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-100">{currentProject?.name}</h1>
                  <p className="text-base text-gray-400">{currentProject?.description || 'Manage your project entities, records, and APIs.'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleCreateNewEntityClick} className="btn-primary flex items-center gap-2">
                    <Plus size={16} /> New Entity
                  </button>
                  <button onClick={() => setActiveView('api')} className="bg-surface hover:bg-surfaceHover border border-border text-gray-200 px-4 py-2.5 rounded-md font-medium text-sm transition-colors flex items-center gap-2">
                    <Terminal size={16} /> View APIs
                  </button>
                </div>
              </div>

              {entities.length === 0 ? (
                <div className="glass-panel border-dashed p-16 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Layers size={200} /></div>
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-6 border border-primary-500/20 text-primary-400 relative z-10">
                    <Database size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-3 relative z-10">Build Your Data Model</h3>
                  <p className="text-base text-gray-400 max-w-md mb-8 leading-relaxed relative z-10">
                    Your workspace is currently empty. Create an entity to instantly provision database tables, REST APIs, and an admin interface.
                  </p>
                  <button onClick={handleCreateNewEntityClick} className="btn-primary relative z-10 py-3 px-8 text-base">
                    <Plus size={18} /> Create Custom Entity
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Database size={80} className="text-primary-500" /></div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 relative z-10">Total Entities</h3>
                      <p className="text-4xl font-bold text-gray-100 relative z-10">{entities.length}</p>
                    </div>
                    <div className="glass-panel p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Box size={80} className="text-secondary-500" /></div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 relative z-10">Total Records</h3>
                      <p className="text-4xl font-bold text-gray-100 relative z-10">{totalRecords}</p>
                    </div>
                    <div className="glass-panel p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Terminal size={80} className="text-success" /></div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 relative z-10">API Endpoints</h3>
                      <p className="text-4xl font-bold text-gray-100 relative z-10">{entities.length * 4}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <h2 className="text-xl font-bold text-gray-100">Entity Models</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {entities.map(e => (
                        <div key={e.id} onClick={() => handleSelectEntity(e)} className="glass-panel p-5 cursor-pointer hover:border-primary-500/50 hover:shadow-subtle transition-all group">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center group-hover:border-primary-500/30 group-hover:bg-primary-500/10 transition-colors">
                              <Database size={18} className="text-primary-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-100 group-hover:text-primary-400 transition-colors">{e.name}</h3>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-400 bg-bg/50 p-2.5 rounded-lg border border-border/50">
                            <span className="flex flex-col"><strong className="text-gray-200">{e.fields?.length || 0}</strong> <span className="text-xs uppercase tracking-wider">Fields</span></span>
                            <div className="w-px h-8 bg-border"></div>
                            <span className="flex flex-col"><strong className="text-gray-200">{e.recordsCount || 0}</strong> <span className="text-xs uppercase tracking-wider">Records</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="flex flex-col gap-5 border-t border-border pt-10">
                    <h2 className="text-xl font-bold text-gray-100">Recent Activity</h2>
                    <div className="glass-panel p-6 flex flex-col gap-6">
                      <div className="flex items-start gap-4 relative">
                        {entities.length > 0 && <div className="absolute left-3.5 top-8 bottom-[-24px] w-px bg-border"></div>}
                        <div className="w-7 h-7 rounded-full bg-bg border border-border flex items-center justify-center z-10 shrink-0">
                          <Activity size={14} className="text-primary-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-200">Workspace Opened</span>
                          <span className="text-xs text-gray-500 mt-1">Just now</span>
                        </div>
                      </div>
                      {entities.length > 0 && (
                        <div className="flex items-start gap-4 relative">
                          <div className="w-7 h-7 rounded-full bg-bg border border-border flex items-center justify-center z-10 shrink-0">
                            <Database size={14} className="text-secondary-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">Loaded {entities.length} entity schemas</span>
                            <span className="text-xs text-gray-500 mt-1">Just now</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'builder' && (
            <div className="flex-1 w-full h-full relative overflow-hidden bg-bg">
              <EntityBuilder 
                projectId={projectId!}
                entity={isEditSchemaMode ? currentEntity : null}
                onBack={() => {
                  if (currentEntity) setActiveView('admin');
                  else setActiveView('overview');
                }}
              />
            </div>
          )}

          {activeView === 'admin' && currentEntity && (
            <div className="flex-1 w-full h-full p-6 lg:p-8">
              <DynamicAdminUI 
                projectId={projectId!} 
                entity={currentEntity} 
                entities={entities}
                onSelectEntity={handleSelectEntity}
                onEditSchema={() => {
                  setIsEditSchemaMode(true);
                  setActiveView('builder');
                }}
                onRecordsChanged={() => {
                  if (projectId) fetchProjectDetails(projectId);
                }}
              />
            </div>
          )}

          {activeView === 'records' && entities.length === 0 && (
            <div className="p-8 lg:p-12 w-full mx-auto flex flex-col gap-8 max-w-[1600px]">
              <div className="flex flex-col gap-2 border-b border-border pb-6">
                <h2 className="text-3xl font-bold tracking-tight text-gray-100">Records Management</h2>
                <p className="text-base text-gray-400">Manage data for your entities here.</p>
              </div>
              <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-surfaceHover flex items-center justify-center mb-6 border border-border text-primary-400">
                  <Database size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-2">No Entities Yet</h3>
                <p className="text-sm text-gray-400 max-w-md mb-8">
                  You need to create an entity schema before you can manage records.
                </p>
                <button onClick={handleCreateNewEntityClick} className="btn-primary">
                  <Plus size={16} /> Create First Entity
                </button>
              </div>
            </div>
          )}

          {activeView === 'api' && (
            <div className="p-8 lg:p-12 w-full mx-auto flex flex-col gap-8 max-w-[1600px]">
              <div className="flex flex-col gap-2 border-b border-border pb-6">
                <h2 className="text-3xl font-bold tracking-tight text-gray-100">API Explorer</h2>
                <p className="text-base text-gray-400">RESTful endpoints generated for your entities. Integrate these into your frontend applications.</p>
              </div>
              
              {entities.length > 0 && (
                <div className="glass-panel p-6 border-l-4 border-l-secondary-500">
                  <h3 className="text-lg font-bold text-gray-100 mb-2">Authentication Instructions</h3>
                  <p className="text-sm text-gray-400 mb-4">Include your API Key in the Authorization header of every request to access these endpoints.</p>
                  <div className="bg-bg border border-border rounded-lg p-4 font-mono text-sm text-gray-300">
                    Authorization: Bearer YOUR_API_KEY
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-8">
                {entities.map(e => (
                  <div key={e.id} className="glass-panel overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-surfaceHover flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h4 className="font-bold text-lg text-gray-100 flex items-center gap-2"><Database size={18} className="text-primary-500" /> {e.name}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono bg-bg border border-border text-gray-300 px-3 py-1.5 rounded-lg">/{e.apiSlug}</span>
                        <button className="bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2" onClick={() => alert('Test API modal would open here')}>
                          <Play size={14} /> Test API
                        </button>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                      {[
                        { method: 'GET', path: `/api/v1/projects/${projectId}/resources/${e.apiSlug}`, color: 'success' },
                        { method: 'POST', path: `/api/v1/projects/${projectId}/resources/${e.apiSlug}`, color: 'primary-400', bg: 'primary-500' },
                        { method: 'PUT', path: `/api/v1/projects/${projectId}/resources/${e.apiSlug}/:id`, color: 'secondary-400', bg: 'secondary-500' },
                        { method: 'DELETE', path: `/api/v1/projects/${projectId}/resources/${e.apiSlug}/:id`, color: 'error', bg: 'error' }
                      ].map(endpoint => (
                        <div key={endpoint.method} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg border border-border rounded-lg px-4 py-3 shadow-sm hover:border-gray-700 transition-colors group">
                          <div className="flex items-center gap-4 text-sm font-mono overflow-x-auto">
                            <span className={`text-${endpoint.color || endpoint.bg} font-bold shrink-0 w-16 bg-${endpoint.bg || endpoint.color}/10 px-2 py-1 rounded text-center`}>{endpoint.method}</span> 
                            <code className="text-gray-300 whitespace-nowrap">{endpoint.path}</code>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`https://code-forge-backend-99l4.onrender.com${endpoint.path}`);
                                // Would ideally show a toast here
                              }} 
                              className="text-gray-500 hover:text-gray-300 p-2 rounded-md hover:bg-surface transition-colors" title="Copy Endpoint"
                            >
                              <Copy size={16} />
                            </button>
                            <button className="text-gray-500 hover:text-gray-300 p-2 rounded-md hover:bg-surface transition-colors" title="View Example">
                              <Code size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Example JSON Block */}
                      <div className="mt-4 bg-[#0d1117] border border-border rounded-lg overflow-hidden">
                        <div className="bg-surface px-4 py-2 border-b border-border flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Example Request (POST)
                        </div>
                        <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`{
${e.fields?.map((f: any) => `  "${f.name}": ${f.type === 'number' ? '123' : f.type === 'boolean' ? 'true' : '"example value"'}`).join(',\n')}
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
                {entities.length === 0 && (
                  <div className="text-base text-gray-500 border border-dashed border-border rounded-2xl p-16 text-center bg-surface">
                    No entities created. Create an entity to see its APIs here.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
