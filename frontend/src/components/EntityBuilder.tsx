import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Plus, Trash2, ArrowLeft, Loader2, Database, AlertCircle, Save, Type, List, Settings, Tag, Key, Code
} from 'lucide-react';

interface FieldInput {
  id?: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ENUM';
  required: boolean;
  defaultValue: string;
  enumOptionsString: string;
}

export default function EntityBuilder({ projectId, entity, onBack }: any) {
  const isEditMode = !!entity;
  const { createEntity, updateEntitySchema, isLoading, error, clearError } = useStore();

  const [entityName, setEntityName] = useState('');
  const [fields, setFields] = useState<FieldInput[]>([]);
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    setLocalErr(null);
    if (isEditMode && entity) {
      setEntityName(entity.name);
      setFields(entity.fields.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        required: f.required,
        defaultValue: f.defaultValue || '',
        enumOptionsString: f.options ? f.options.join(', ') : '',
      })));
    } else {
      setEntityName('');
      setFields([
        { name: 'Title', type: 'TEXT', required: true, defaultValue: '', enumOptionsString: '' }
      ]);
    }
  }, [entity, isEditMode]);

  const handleFieldChange = (index: number, key: keyof FieldInput, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const handleSaveSchema = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    clearError();

    if (!entityName.trim()) return setLocalErr('Entity schema name is required');
    if (fields.length === 0) return setLocalErr('You must add at least one column');

    const preparedFields = [];
    const seenNames = new Set<string>();

    for (const f of fields) {
      if (!f.name.trim()) return setLocalErr('All active columns must have a label');
      const normalized = f.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (seenNames.has(normalized)) return setLocalErr(`Duplicate column slugs detected for '${f.name}'`);
      seenNames.add(normalized);

      let parsedOptions: string[] = [];
      if (f.type === 'ENUM') {
        if (!f.enumOptionsString.trim()) return setLocalErr(`ENUM column '${f.name}' requires options`);
        parsedOptions = f.enumOptionsString.split(',').map(opt => opt.trim()).filter(Boolean);
        if (parsedOptions.length === 0) return setLocalErr(`ENUM column '${f.name}' must have at least one option`);
      }

      preparedFields.push({
        id: f.id,
        name: f.name.trim(),
        type: f.type,
        required: f.required,
        defaultValue: f.defaultValue.trim() || null,
        options: parsedOptions,
      });
    }

    try {
      if (isEditMode && entity) {
        await updateEntitySchema(projectId, entity.id, entityName.trim(), preparedFields as any);
      } else {
        await createEntity(projectId, entityName.trim(), preparedFields as any);
      }
      onBack();
    } catch (err) {}
  };

  return (
    <div className="h-full flex flex-col bg-bg text-gray-100 font-sans relative">
      {/* Top Header - Sticky Action Bar */}
      <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-100 transition-colors p-1 bg-surface rounded-md border border-border">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-100 tracking-tight">{isEditMode ? 'Edit Schema' : 'Create Entity'}</h2>
            <p className="text-xs text-gray-500 hidden sm:block">Define data structures and API parameters.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors px-3 py-1.5" disabled={isLoading}>Cancel</button>
          <button onClick={handleSaveSchema} disabled={isLoading} className="btn-primary py-1.5 px-4 flex items-center gap-2">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Schema</>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-8">
          
          {(localErr || error) && (
            <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error flex items-start gap-3 shadow-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{localErr || error}</span>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: Basics & Preview */}
            <div className="xl:col-span-4 flex flex-col gap-6 sticky top-8">
              <div className="glass-panel p-6 shadow-sm border border-primary-500/10">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Database size={16} className="text-primary-400" /> General Info
                </h3>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-gray-300">Entity Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Project, Task, Employee"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    className="cf-input text-sm"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    <Key size={12} className="text-gray-400" /> Auto-generates database table & REST routes.
                  </p>
                </div>
              </div>

              {/* Schema Live Preview */}
              <div className="glass-panel p-6 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Type size={16} className="text-secondary-400" /> JSON Payload Preview
                </h3>
                <div className="bg-[#050505] rounded-xl border border-border p-4 font-mono text-xs text-gray-300 overflow-x-auto shadow-inner relative">
                  <div className="absolute top-0 right-0 p-2 opacity-10"><Code size={40} /></div>
                  <pre className="relative z-10">
<span className="text-gray-500">{`{`}</span>
  <span className="text-primary-400">"id"</span>: <span className="text-success">"uuid"</span>,
  <span className="text-primary-400">"createdAt"</span>: <span className="text-success">"timestamp"</span>,
{fields.map(f => `  <span className="text-primary-400">"${f.name || 'field'}"</span>: <span className="text-secondary-400">"${f.type}"</span>${f.required ? ' <span className="text-gray-500 italic">// required</span>' : ''}`).join(',\n')}
<span className="text-gray-500">{`}`}</span>
                  </pre>
                </div>
              </div>
            </div>

            {/* Right Col: Fields Array */}
            <div className="xl:col-span-8 flex flex-col gap-6">
              <div className="flex items-center justify-between bg-surface/50 p-4 rounded-xl border border-border backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-gray-300">
                    <List size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-100">Schema Fields</h3>
                    <p className="text-xs text-gray-400">Define the columns and constraints for this entity.</p>
                  </div>
                </div>
                <button onClick={() => setFields([...fields, { name: '', type: 'TEXT', required: false, defaultValue: '', enumOptionsString: '' }])} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm shadow-glow">
                  <Plus size={16} /> Add Field
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {fields.map((f, index) => (
                  <div key={index} className="glass-panel p-0 overflow-hidden group hover:border-primary-500/30 transition-all shadow-sm">
                    <div className="p-5 flex flex-col gap-5">
                      {/* Top Row: Name & Type */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        <div className="md:col-span-7 flex flex-col gap-2">
                          <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5"><Tag size={12} className="text-gray-500"/> Field Name</label>
                          <input
                            type="text"
                            placeholder="e.g. status, age, email"
                            value={f.name}
                            onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                            className="cf-input bg-[#0A0A0A] font-mono text-sm"
                          />
                        </div>
                        <div className="md:col-span-5 flex flex-col gap-2">
                          <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5"><Settings size={12} className="text-gray-500"/> Data Type</label>
                          <select
                            value={f.type}
                            onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                            className="cf-input bg-[#0A0A0A] text-sm appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em', paddingRight: '2.5rem' }}
                          >
                            <option value="TEXT">Text (String)</option>
                            <option value="NUMBER">Number (Float/Int)</option>
                            <option value="BOOLEAN">Boolean (True/False)</option>
                            <option value="DATE">Date Time (ISO 8601)</option>
                            <option value="ENUM">Enum (Select List)</option>
                          </select>
                        </div>
                      </div>

                      {/* Validation & Extra Settings Row */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 bg-surfaceHover/50 p-4 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-gray-300 select-none">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={f.required}
                                onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                                className="peer sr-only"
                              />
                              <div className="w-5 h-5 rounded border border-border bg-bg peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-colors flex items-center justify-center">
                                {f.required && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                            </div>
                            Required Field
                          </label>
                        </div>

                        <div className="flex-1 w-full md:w-auto">
                          {f.type === 'ENUM' ? (
                            <input
                              type="text"
                              placeholder="Options (comma separated): ACTIVE, PENDING"
                              value={f.enumOptionsString}
                              onChange={(e) => handleFieldChange(index, 'enumOptionsString', e.target.value)}
                              className="cf-input bg-bg text-xs w-full placeholder:text-gray-600 focus:border-secondary-500"
                            />
                          ) : (
                            <input
                              type="text"
                              placeholder="Default value (optional)"
                              value={f.defaultValue}
                              onChange={(e) => handleFieldChange(index, 'defaultValue', e.target.value)}
                              className="cf-input bg-bg text-xs w-full placeholder:text-gray-600"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete Action Banner */}
                    <div className="bg-surface/50 border-t border-border px-5 py-2.5 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                       <button
                        onClick={() => setFields(fields.filter((_, i) => i !== index))}
                        className="text-xs font-medium text-gray-400 hover:text-error flex items-center gap-1.5 transition-colors"
                        type="button"
                      >
                        <Trash2 size={14} /> Remove Field
                      </button>
                    </div>
                  </div>
                ))}

                {fields.length === 0 && (
                  <div className="glass-panel border-dashed p-16 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-gray-500 mb-4">
                      <List size={20} />
                    </div>
                    <p className="text-base text-gray-300 font-medium mb-1">No fields configured</p>
                    <p className="text-sm text-gray-500">Click "Add Field" to start building your data model.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
