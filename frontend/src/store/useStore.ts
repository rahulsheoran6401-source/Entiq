import { create } from 'zustand';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  entitiesCount: number;
  recordsCount: number;
}

export interface Field {
  id?: string;
  name: string;
  apiSlug: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ENUM';
  required: boolean;
  defaultValue: string | null;
  options: string[];
}

export interface Entity {
  id: string;
  name: string;
  apiSlug: string;
  fields: Field[];
  recordsCount: number;
  createdAt: string;
}

interface StoreState {
  token: string | null;
  user: User | null;
  projects: Project[];
  currentProject: any | null;
  entities: Entity[];
  currentEntity: Entity | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, name: string, description?: string) => Promise<Project>;
  updateProfile: (name: string) => Promise<void>;
  
  fetchProjectDetails: (projectId: string) => Promise<void>;
  fetchEntities: (projectId: string) => Promise<void>;
  createEntity: (projectId: string, name: string, fields: Field[]) => Promise<Entity>;
  updateEntitySchema: (projectId: string, entityId: string, name: string, fields: Field[]) => Promise<Entity>;
  deleteEntity: (projectId: string, entityId: string) => Promise<void>;
  
  setCurrentEntity: (entity: Entity | null) => void;
  clearError: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  token: localStorage.getItem('codeforge_token'),
  user: null,
  projects: [],
  currentProject: null,
  entities: [],
  currentEntity: null,
  isLoading: false,
  error: null,

  setAuth: (token, user) => {
    localStorage.setItem('codeforge_token', token);
    set({ token, user, error: null });
  },

  logout: () => {
    localStorage.removeItem('codeforge_token');
    set({ token: null, user: null, projects: [], currentProject: null, entities: [], currentEntity: null });
  },

  initializeAuth: async () => {
    const token = get().token;
    if (!token) return;
    
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.user, isLoading: false });
    } catch (err: any) {
      console.warn('Auth token expired or invalid, logging out.');
      localStorage.removeItem('codeforge_token');
      set({ token: null, user: null, isLoading: false });
    }
  },

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/projects');
      set({ projects: response.data.projects, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || 'Failed to fetch projects', isLoading: false });
    }
  },

  createProject: async (name, description) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/projects', { name, description });
      const newProj = response.data.project;
      set((state) => ({
        projects: [newProj, ...state.projects],
        isLoading: false,
      }));
      return newProj;
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to create project';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  updateProject: async (id, name, description) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/projects/${id}`, { name, description });
      const updatedProj = response.data.project;
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, name: updatedProj.name, description: updatedProj.description } : p),
        isLoading: false,
      }));
      return updatedProj;
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to update project';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  updateProfile: async (name) => {
    try {
      const response = await api.put('/auth/me', { name });
      set({ user: response.data.user });
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to update profile';
      set({ error: errMsg });
      throw new Error(errMsg);
    }
  },

  fetchProjectDetails: async (projectId) => {
    set({ isLoading: true, error: null, currentProject: null, entities: [] });
    try {
      const response = await api.get(`/projects/${projectId}`);
      set({
        currentProject: response.data.project,
        entities: response.data.project.entities || [],
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || 'Failed to load project details', isLoading: false });
    }
  },

  fetchEntities: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/projects/${projectId}/entities`);
      set({ entities: response.data.entities, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || 'Failed to load entities', isLoading: false });
    }
  },

  createEntity: async (projectId, name, fields) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/projects/${projectId}/entities`, { name, fields });
      const newEntity = response.data.entity;
      set((state) => ({
        entities: [...state.entities, newEntity],
        isLoading: false,
      }));
      return newEntity;
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to create entity';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  updateEntitySchema: async (projectId, entityId, name, fields) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/projects/${projectId}/entities/${entityId}`, { name, fields });
      const updatedEntity = response.data.entity;
      set((state) => ({
        entities: state.entities.map((e) => (e.id === entityId ? updatedEntity : e)),
        currentEntity: get().currentEntity?.id === entityId ? updatedEntity : get().currentEntity,
        isLoading: false,
      }));
      return updatedEntity;
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to update entity columns';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  deleteEntity: async (projectId, entityId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/projects/${projectId}/entities/${entityId}`);
      set((state) => ({
        entities: state.entities.filter((e) => e.id !== entityId),
        currentEntity: get().currentEntity?.id === entityId ? null : get().currentEntity,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || 'Failed to delete entity', isLoading: false });
    }
  },

  setCurrentEntity: (entity) => {
    set({ currentEntity: entity });
  },

  clearError: () => set({ error: null }),
}));
