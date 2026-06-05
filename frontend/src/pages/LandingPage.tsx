import { useNavigate } from 'react-router-dom';
import { Terminal, Shield, ArrowRight, Database, Cpu, Workflow, Layers, Box, BookOpen, User } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const token = useStore((state) => state.token);

  return (
    <div className="app-container min-h-screen selection:bg-primary-500/30 selection:text-white">
      
      {/* Navbar */}
      <nav className="header fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Entiq Logo" className="w-8 h-8" />
            <span className="font-semibold tracking-tight text-gray-100 text-lg">Entiq</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/docs')} className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors hidden sm:block">Documentation</button>
            <div className="flex items-center gap-3">
              {token ? (
                <button onClick={() => navigate('/dashboard')} className="btn-primary py-1.5 px-5">
                  Dashboard
                </button>
              ) : (
                <>
                  <button onClick={() => navigate('/auth')} className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Sign In</button>
                  <button onClick={() => navigate('/auth')} className="btn-primary py-1.5 px-5">
                    Start Building
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col mt-14">
        
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 max-w-5xl mx-auto w-full overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] -z-10 opacity-70"></div>
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-secondary-500/10 rounded-full blur-[100px] -z-10 opacity-60"></div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold mb-8 shadow-sm">
            <Cpu size={14} /> Metadata-Driven Application Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-100 mb-6 leading-[1.1]">
            Build backend APIs <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-secondary-400 to-success">
              in seconds, not days.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
            Visually define your data models and instantly provision high-performance database schemas, auto-generated REST APIs, and dynamic admin interfaces. No code required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => navigate(token ? '/dashboard' : '/auth')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 btn-primary px-8 py-3.5 text-base"
            >
              Start Building <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => navigate('/docs')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface hover:bg-surfaceHover text-gray-100 border border-border text-base font-medium px-8 py-3.5 rounded-lg transition-all shadow-subtle"
            >
              <Terminal size={18} className="text-gray-400" /> Read Documentation
            </button>
          </div>
        </section>

        {/* Product Screenshot Mock */}
        <section className="px-6 pb-32 max-w-6xl mx-auto w-full relative z-10">
          <div className="relative rounded-2xl border border-border bg-surface shadow-2xl shadow-primary-500/5 overflow-hidden">
            <div className="h-10 border-b border-border bg-bg flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-error/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-success/80"></div>
              <div className="mx-auto text-xs font-mono text-gray-500 bg-surface px-4 py-1 rounded-md border border-border">entiq.app / dashboard</div>
            </div>
            <div className="flex h-[400px] md:h-[500px]">
              {/* Sidebar */}
              <div className="w-48 border-r border-border bg-surface/50 p-4 hidden md:flex flex-col gap-4">
                <div className="h-4 w-24 bg-border rounded mb-4"></div>
                <div className="h-8 bg-primary-500/10 border border-primary-500/20 rounded-md flex items-center px-3 gap-2 text-primary-400">
                  <Database size={14} /> <div className="h-2 w-16 bg-primary-500/50 rounded"></div>
                </div>
                <div className="h-8 hover:bg-surfaceHover rounded-md flex items-center px-3 gap-2 text-gray-500">
                  <Terminal size={14} /> <div className="h-2 w-12 bg-border rounded"></div>
                </div>
                <div className="h-8 hover:bg-surfaceHover rounded-md flex items-center px-3 gap-2 text-gray-500">
                  <Layers size={14} /> <div className="h-2 w-14 bg-border rounded"></div>
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 bg-bg p-8 flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <div className="h-6 w-40 bg-border rounded"></div>
                  <div className="h-8 w-28 bg-primary-500/20 rounded-md border border-primary-500/30"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-24 glass-panel rounded-xl"></div>
                  <div className="h-24 glass-panel rounded-xl"></div>
                  <div className="h-24 glass-panel rounded-xl"></div>
                </div>
                <div className="flex-1 glass-panel rounded-xl p-4 flex flex-col gap-4">
                  <div className="h-8 border-b border-border/50"></div>
                  <div className="h-10 bg-surfaceHover rounded border border-border/50"></div>
                  <div className="h-10 bg-surfaceHover rounded border border-border/50"></div>
                  <div className="h-10 bg-surfaceHover rounded border border-border/50"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Visualization */}
        <section className="px-6 py-32 bg-surface/30 border-y border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-success/5 rounded-full blur-[100px] -z-10"></div>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold tracking-tight text-gray-100 mb-4">How it works</h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">From idea to production-ready API in 3 simple steps.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-primary-500 via-secondary-500 to-success -translate-y-1/2 opacity-20"></div>
              
              <div className="glass-panel p-8 relative z-10 group hover:-translate-y-1 hover:border-primary-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6 text-primary-400 font-bold text-xl shadow-glow">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">Define Schema</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Use our visual builder to create entities and fields. Define types, constraints, and relationships without writing migrations.
                </p>
              </div>
              
              <div className="glass-panel p-8 relative z-10 group hover:-translate-y-1 hover:border-secondary-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-secondary-500/10 border border-secondary-500/20 flex items-center justify-center mb-6 text-secondary-400 font-bold text-xl shadow-glow">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">Auto Provision</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Entiq instantly provisions the underlying database tables and generates highly optimized REST API endpoints.
                </p>
              </div>
              
              <div className="glass-panel p-8 relative z-10 group hover:-translate-y-1 hover:border-success/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mb-6 text-success font-bold text-xl shadow-glow">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">Consume APIs</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Integrate your frontend with secure, paginated, and filterable CRUD APIs out of the box. No backend code required.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Demo Templates */}
        <section className="px-6 py-32 bg-bg border-b border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-100 mb-4">Start with a Template</h2>
              <p className="text-gray-400">Jumpstart your project with pre-built entities and relationships.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Gym Management', icon: <User size={24} />, desc: 'Members, Plans, and Payments.' },
                { name: 'CRM System', icon: <Layers size={24} />, desc: 'Contacts, Companies, Deals.' },
                { name: 'Inventory Tracker', icon: <Box size={24} />, desc: 'Products, Categories, Orders.' },
                { name: 'School Portal', icon: <BookOpen size={24} />, desc: 'Students, Courses, Grades.' }
              ].map((tpl, i) => (
                <div key={i} className="glass-panel p-6 flex flex-col items-start hover:border-primary-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-surface border border-border rounded-xl flex items-center justify-center text-gray-300 mb-4 group-hover:bg-primary-500/10 group-hover:text-primary-400 group-hover:border-primary-500/30 transition-colors">
                    {tpl.icon}
                  </div>
                  <h3 className="font-bold text-gray-100 mb-1">{tpl.name}</h3>
                  <p className="text-sm text-gray-400 mb-6 flex-1">{tpl.desc}</p>
                  <button onClick={() => navigate('/auth')} className="text-sm font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1 mt-auto">
                    Try Demo <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-32 bg-bg">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-100 mb-4">Everything you need</h2>
              <p className="text-gray-400">Robust primitives to build complex applications fast.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass-panel p-8 group hover:border-primary-500/30 transition-colors">
                <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Database className="text-primary-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-100 mb-2">Dynamic Data Models</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Support for all standard types including Booleans, Enums, Dates, and Relationships with robust validation.</p>
              </div>
              <div className="glass-panel p-8 group hover:border-secondary-500/30 transition-colors">
                <div className="w-12 h-12 bg-secondary-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Workflow className="text-secondary-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-100 mb-2">Automated Operations</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Sorting, filtering, and pagination are handled out of the box on all generated endpoints.</p>
              </div>
              <div className="glass-panel p-8 group hover:border-success/30 transition-colors">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="text-success" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-100 mb-2">Secure & Sandboxed</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Every project runs in an isolated workspace with strict JWT-based authentication enforcing access control.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-surface text-center flex flex-col items-center justify-center">
        <img src="/logo.png" alt="Entiq Logo" className="w-8 h-8 mb-4 opacity-50" />
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} Entiq Platform. Crafted for builders.</p>
      </footer>
    </div>
  );
}
