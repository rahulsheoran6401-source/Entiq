import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Terminal, Database, Shield, Zap, Layout, Code2 } from 'lucide-react';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function Docs() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useStore((state) => state.token);

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: <Zap size={16} /> },
    { id: 'authentication', title: 'Authentication', icon: <Shield size={16} /> },
    { id: 'projects', title: 'Projects', icon: <Layout size={16} /> },
    { id: 'entities', title: 'Entities', icon: <Database size={16} /> },
    { id: 'records', title: 'Records', icon: <BookOpen size={16} /> },
    { id: 'generated-apis', title: 'Generated APIs', icon: <Terminal size={16} /> },
    { id: 'validation', title: 'Validation', icon: <Shield size={16} /> },
    { id: 'faq', title: 'FAQ', icon: <Code2 size={16} /> },
  ];

  return (
    <div className="app-container min-h-screen">
      {/* Header */}
      <header className="header sticky top-0 z-50">
        <div className="w-full px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Entiq Logo" className="w-7 h-7" />
            <span className="font-semibold text-[15px] text-gray-100 tracking-tight">Entiq Docs</span>
          </div>
          <nav className="flex items-center gap-5">
            {token ? (
              <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Dashboard</button>
            ) : (
              <button onClick={() => navigate('/auth')} className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Sign In</button>
            )}
            <div className="h-5 w-px bg-border"></div>
            <button onClick={() => navigate(token ? '/dashboard' : '/auth')} className="btn-primary py-1.5 px-5">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[1400px] mx-auto flex pt-12 pb-32 px-6 lg:px-8 relative">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block pr-8 relative">
          <nav className="sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-3 flex items-center gap-2">
              <BookOpen size={14} className="text-primary-500" /> Documentation
            </h3>
            <ul className="space-y-1">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a 
                    href={`#${sec.id}`} 
                    className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-surfaceHover px-3 py-2.5 rounded-lg transition-colors border border-transparent"
                  >
                    <span className="text-gray-500">{sec.icon}</span>
                    {sec.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:pl-16 max-w-4xl md:border-l border-border relative">
          <div className="mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold mb-6">
              <Zap size={14} /> Developer Guides
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-100 mb-6 leading-tight">Platform Documentation</h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">
              Comprehensive guides to building metadata-driven applications using Entiq entities, validation rules, and generated APIs.
            </p>
          </div>

          <div className="space-y-28">
            
            <section id="getting-started" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-primary-400">
                  <Zap size={20} />
                </div>
                <h2 className="text-3xl font-bold text-gray-100">Getting Started</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-8 max-w-3xl">
                Entiq is a low-code infrastructure platform designed to abstract away repetitive CRUD logic. By defining your data models visually, Entiq automatically provisions the underlying database structures and exposes robust REST APIs for integration.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                  <h3 className="font-bold text-gray-100 mb-2 flex items-center gap-2"><Layout size={16} className="text-primary-400" /> Create a Project</h3>
                  <p className="text-sm text-gray-400">A project represents an isolated workspace holding all your API models.</p>
                </div>
                <div className="glass-panel p-6">
                  <h3 className="font-bold text-gray-100 mb-2 flex items-center gap-2"><Database size={16} className="text-secondary-400" /> Build Entities</h3>
                  <p className="text-sm text-gray-400">Design your data schema visually and customize constraints instantly.</p>
                </div>
              </div>
            </section>

            <section id="authentication" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-secondary-400">
                  <Shield size={20} />
                </div>
                <h2 className="text-3xl font-bold text-gray-100">Authentication</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-6 max-w-3xl">
                All generated APIs are secured by default. To consume your API, you must pass your user session JWT in the Authorization header.
              </p>
              <div className="bg-[#0A0A0A] border border-border p-6 rounded-2xl font-mono text-sm text-gray-300 overflow-x-auto shadow-inner relative group">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs bg-surface px-2 py-1 rounded text-gray-400 border border-border">Copy</span>
                </div>
                <pre>
<span className="text-primary-400">fetch</span>(<span className="text-success">'https://code-forge-backend-99l4.onrender.com/api/v1/projects/YOUR_ID/resources/employee'</span>, {'{'}
  <span className="text-gray-400">headers</span>: {'{'}
    <span className="text-success">'Authorization'</span>: <span className="text-secondary-400">'Bearer YOUR_JWT_TOKEN'</span>
  {'}'}
{'}'})
                </pre>
              </div>
            </section>

            <section id="projects" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-success">
                  <Layout size={20} />
                </div>
                <h2 className="text-3xl font-bold text-gray-100">Projects</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-4 max-w-3xl">
                Projects serve as isolated workspaces. An entity created in one project does not exist in another.
              </p>
              <div className="glass-panel p-6 mt-4">
                <h3 className="text-xl font-bold text-gray-100 mb-4">Creating a Project</h3>
                <ol className="list-decimal pl-5 text-gray-300 space-y-2">
                  <li>Navigate to your Dashboard.</li>
                  <li>Click the <span className="font-semibold text-primary-400">New Project</span> button.</li>
                  <li>Provide a unique Name and optional Description.</li>
                  <li>Click Create. Your new workspace is immediately ready.</li>
                </ol>
              </div>
            </section>

            <section id="entities" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-primary-500">
                  <Database size={20} />
                </div>
                <h2 className="text-3xl font-bold text-gray-100">Entities (Data Models)</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-6 max-w-3xl">
                Entities are the core building blocks. Each entity generates a unique schema composed of Fields, supporting texts, numbers, enums, booleans, dates, and more.
              </p>
              <div className="glass-panel p-6 mt-4">
                <h3 className="text-xl font-bold text-gray-100 mb-4">Creating an Entity</h3>
                <ol className="list-decimal pl-5 text-gray-300 space-y-2">
                  <li>Open your Project Workspace.</li>
                  <li>Click <span className="font-semibold text-primary-400">New Entity</span> in the sidebar.</li>
                  <li>Set the Entity Name (e.g., <code>Customer</code>) and API Slug (e.g., <code>customers</code>).</li>
                  <li>Add fields using the Schema Builder. Select types (Text, Number, Boolean, Date) and set constraints like Required or Unique.</li>
                  <li>Click Save. Entiq immediately provisions the database table.</li>
                </ol>
              </div>
            </section>
            
            <section id="records" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-secondary-500">
                  <BookOpen size={20} />
                </div>
                <h2 className="text-3xl font-bold text-gray-100">Records</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-4 max-w-3xl">
                Records are individual rows of data conforming to the schema of an entity. Entiq dynamically renders Admin UIs to create, read, update, and delete these rows without writing SQL.
              </p>
            </section>

            <section id="generated-apis" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-success">
                  <Terminal size={20} />
                </div>
                <h2 className="text-3xl font-bold text-gray-100">Generated APIs</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-6 max-w-3xl">
                Every entity automatically provisions a standard set of RESTful CRUD routes. Explore them in your workspace API Explorer.
              </p>
            </section>
            
            <section id="validation" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-error">
                  <Shield size={20} />
                </div>
                <h2 className="text-3xl font-bold text-gray-100">Validation</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-6 max-w-3xl">
                Entiq automatically enforces validation on API requests based on entity schema. Required fields, type coercion, and enum verification are handled out-of-the-box.
              </p>
            </section>
            
            <section id="faq" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-gray-400">
                  <Code2 size={20} />
                </div>
                <h2 className="text-3xl font-bold text-gray-100">FAQ</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-6 max-w-3xl">
                Frequently asked questions about Entiq capabilities.
              </p>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
