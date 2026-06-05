import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Plus, Edit2, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Database, AlertCircle, RefreshCw, Filter, Settings, Search, Check, X, Save
} from 'lucide-react';

export default function DynamicAdminUI({ projectId, entity, entities = [], onSelectEntity, onEditSchema, onRecordsChanged }: any) {
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilterBar, setShowFilterBar] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formPayload, setFormPayload] = useState<Record<string, any>>({});
  const [dialogErr, setDialogErr] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
      Object.entries(filters).forEach(([k, v]) => { if (v) q.append(k, v); });
      const res = await api.get(`/projects/${projectId}/resources/${entity.apiSlug}?${q.toString()}`);
      setRecords(res.data.records || []);
      setTotalCount(res.data.pagination?.total || 0);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [entity.id, filters]);
  useEffect(() => { fetchRecords(); }, [entity.id, page, limit, sortBy, sortOrder, filters]);

  const handleSort = (col: string) => {
    if (sortBy === col) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('desc'); }
  };

  const openForm = (rec: any = null) => {
    setEditingRecord(rec);
    setDialogErr(null);
    const p: any = {};
    entity.fields.forEach((f: any) => {
      p[f.apiSlug] = rec ? (rec[f.apiSlug] ?? '') : (f.defaultValue ?? (f.type === 'BOOLEAN' ? false : ''));
    });
    setFormPayload(p);
    setShowDialog(true);
  };

  const saveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formPayload };
      entity.fields.forEach((f: any) => {
        if (f.type === 'NUMBER' && payload[f.apiSlug] !== '') payload[f.apiSlug] = Number(payload[f.apiSlug]);
      });
      if (editingRecord) await api.put(`/projects/${projectId}/resources/${entity.apiSlug}/${editingRecord.id}`, payload);
      else await api.post(`/projects/${projectId}/resources/${entity.apiSlug}`, payload);
      setShowDialog(false);
      fetchRecords();
      if (onRecordsChanged) onRecordsChanged();
    } catch (err: any) {
      setDialogErr(err.response?.data?.error?.message || 'Error saving record.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (confirm('Delete this record?')) {
      await api.delete(`/projects/${projectId}/resources/${entity.apiSlug}/${id}`);
      fetchRecords();
      if (onRecordsChanged) onRecordsChanged();
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg text-gray-100 rounded-xl shadow-xl relative border border-border">
      {/* Header Bar */}
      <div className="px-6 py-5 border-b border-border bg-surface/80 backdrop-blur-md shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
            <Database size={24} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-100 tracking-tight">{entity.name}</h2>
              {entities.length > 1 && (
                <div className="relative group">
                  <select 
                    className="appearance-none bg-surface border border-border text-gray-300 text-sm rounded-md px-2 py-1 pr-6 cursor-pointer focus:outline-none focus:border-primary-500 transition-colors opacity-50 hover:opacity-100"
                    value={entity.id}
                    onChange={(e) => {
                      const selected = entities.find((ent: any) => ent.id === e.target.value);
                      if (selected && onSelectEntity) onSelectEntity(selected);
                    }}
                  >
                    {entities.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <ArrowUpDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5 font-medium">{totalCount} {totalCount === 1 ? 'record' : 'records'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onEditSchema} className="bg-surface hover:bg-surfaceHover border border-border text-gray-300 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
            <Settings size={16} /> <span className="hidden sm:inline">Schema Configuration</span>
          </button>
          <button onClick={() => openForm()} className="btn-primary py-2.5 px-5 flex items-center gap-2 shadow-glow text-sm">
            <Plus size={16} /> New Record
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-bg shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilterBar(!showFilterBar)} className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shadow-sm ${showFilterBar ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' : 'bg-surface border-border text-gray-400 hover:text-gray-100'}`}>
            <Filter size={14} /> Filter & Search
          </button>
        </div>
        <div>
          <button onClick={fetchRecords} className="text-gray-400 hover:text-primary-400 p-1.5 rounded-md hover:bg-primary-500/10 transition-colors">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

    {showFilterBar && (
        <div className="border-b border-border bg-surface/50 backdrop-blur-sm p-6 shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shadow-inner">
          {entity.fields.map((f: any) => (
            <div key={f.id} className="flex flex-col gap-2">
              <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">{f.name}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-primary-500 transition-colors placeholder-gray-600 shadow-sm"
                  placeholder={`Search ${f.name}...`}
                  value={filters[f.apiSlug] || ''}
                  onChange={e => setFilters({...filters, [f.apiSlug]: e.target.value})}
                />
              </div>
            </div>
          ))}
          <div className="flex items-end">
            <button onClick={() => setFilters({})} className="text-xs font-medium text-gray-500 hover:text-gray-100 px-3 py-1.5 rounded-lg hover:bg-surface border border-transparent hover:border-border transition-colors">Clear Filters</button>
          </div>
        </div>
      )}

      {/* Main Table Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-bg">
        {isLoading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={28} /></div>
        ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-error"><AlertCircle size={28} className="mb-2"/>{error}</div>
        ) : records.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-6 text-gray-500 shadow-sm">
                <Database size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">No Records Found</h3>
              <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">This entity doesn't have any data yet. Create the first record or adjust your filters.</p>
              <button onClick={() => openForm()} className="btn-primary py-2 px-6 flex items-center gap-2 shadow-glow text-sm">
                <Plus size={16}/> Add New Record
              </button>
            </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto custom-scrollbar relative">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-border z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">ID</th>
                    {entity.fields.map((f: any) => (
                      <th key={f.id} className="px-6 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-100 transition-colors group" onClick={() => handleSort(f.apiSlug)}>
                        <div className="flex items-center gap-2">
                          {f.name}
                          {sortBy === f.apiSlug ? (
                            <ArrowUpDown size={16} className="text-primary-400" />
                          ) : (
                            <ArrowUpDown size={16} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-surface/50 transition-colors group text-base">
                      <td className="px-6 py-4 font-mono text-gray-500">{r.id.split('-')[0]}</td>
                      {entity.fields.map((f: any) => {
                        const val = r[f.apiSlug];
                        return (
                          <td key={f.id} className="px-6 py-4 text-gray-300">
                            {f.type === 'BOOLEAN' ? (
                              <span className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 border ${val ? 'bg-success/10 text-success border-success/20' : 'bg-surface text-gray-500 border-border'}`}>
                                {val ? <Check size={14}/> : <X size={14}/>} {val ? 'TRUE' : 'FALSE'}
                              </span>
                            ) : f.type === 'ENUM' ? (
                              <span className="px-3 py-1.5 rounded-md text-xs font-bold bg-surfaceHover text-gray-300 border border-border uppercase tracking-wider">{String(val)}</span>
                            ) : (
                              <span className="truncate max-w-xs inline-block">{String(val ?? '-')}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openForm(r)} className="p-2 rounded-md hover:bg-surfaceHover text-gray-400 hover:text-primary-400 transition-colors border border-transparent hover:border-border shadow-sm"><Edit2 size={16}/></button>
                          <button onClick={() => deleteRecord(r.id)} className="p-2 rounded-md hover:bg-error/10 text-gray-400 hover:text-error transition-colors border border-transparent hover:border-error/20 shadow-sm"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-border bg-surface/80 backdrop-blur-md p-3 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
              <div className="flex items-center gap-6 text-xs text-gray-500 font-medium">
                <span>{(page - 1) * limit + 1}-{Math.min(page * limit, totalCount)} of <span className="text-gray-300">{totalCount}</span></span>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">Rows per page:</span>
                  <select value={limit} onChange={e => {setLimit(Number(e.target.value)); setPage(1);}} className="bg-bg border border-border rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-primary-500 transition-colors">
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md hover:bg-surface border border-transparent hover:border-border text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors shadow-sm"><ChevronLeft size={16}/></button>
                <span className="text-xs text-gray-300 px-3 font-bold">{page} <span className="text-gray-600 font-medium mx-1">/</span> {totalPages || 1}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded-md hover:bg-surface border border-transparent hover:border-border text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors shadow-sm"><ChevronRight size={16}/></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Form */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-md p-6">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform scale-100 transition-transform">
            <div className="p-6 border-b border-border bg-surface/50">
              <h3 className="text-xl font-bold text-gray-100 tracking-tight">{editingRecord ? 'Edit Record' : 'New Record'}</h3>
              <p className="text-sm text-gray-400 mt-1">Manage data for {entity.name}.</p>
            </div>
            
            <form onSubmit={saveRecord} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {dialogErr && <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-sm font-medium text-error mb-2 flex items-start gap-3 shadow-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" /> {dialogErr}
                </div>}
                
                {entity.fields.map((f: any) => (
                  <div key={f.id} className="flex flex-col gap-3">
                    <label className="text-base font-medium text-gray-300 flex justify-between items-center">
                      <span>{f.name} {f.required && <span className="text-error ml-1">*</span>}</span>
                      <span className="text-xs uppercase font-bold text-gray-600 bg-bg px-2 py-1 rounded border border-border">{f.type}</span>
                    </label>
                    {f.type === 'ENUM' ? (
                      <select value={formPayload[f.apiSlug] || ''} onChange={e => setFormPayload({...formPayload, [f.apiSlug]: e.target.value})} className="cf-input w-full text-base py-3 appearance-none cursor-pointer" required={f.required} disabled={isSaving} style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.2em 1.2em', paddingRight: '2.5rem' }}>
                        <option value="" disabled>Select Option</option>
                        {(Array.isArray(f.options) ? f.options : (typeof f.options === 'string' ? (f.options.startsWith('[') ? JSON.parse(f.options) : f.options.split(',')) : [])).map((opt: string, i: number) => <option key={i} value={opt.trim ? opt.trim() : opt}>{opt.trim ? opt.trim() : opt}</option>)}
                      </select>
                    ) : f.type === 'BOOLEAN' ? (
                      <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer mt-1 p-3 rounded-lg border border-border bg-bg hover:border-primary-500/50 transition-colors">
                         <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={!!formPayload[f.apiSlug]}
                                onChange={e => setFormPayload({...formPayload, [f.apiSlug]: e.target.checked})}
                                disabled={isSaving}
                                className="peer sr-only"
                              />
                              <div className="w-5 h-5 rounded border border-border bg-surface peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-colors flex items-center justify-center shadow-sm">
                                {!!formPayload[f.apiSlug] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                            </div>
                        <span className="font-medium select-none">{formPayload[f.apiSlug] ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    ) : (
                      <input 
                        type={f.type === 'NUMBER' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}
                        value={f.type === 'DATE' && formPayload[f.apiSlug] ? String(formPayload[f.apiSlug]).split('T')[0] : formPayload[f.apiSlug] || ''}
                        onChange={e => setFormPayload({...formPayload, [f.apiSlug]: e.target.value})}
                        className="cf-input w-full text-base py-3" required={f.required} disabled={isSaving}
                        placeholder={`Enter ${f.name.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-border bg-surface/50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                <button type="button" onClick={() => setShowDialog(false)} className="text-sm font-medium text-gray-400 hover:text-gray-100 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-border hover:bg-surface" disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn-primary py-2 px-6 flex items-center gap-2 shadow-glow text-sm" disabled={isSaving}>
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
