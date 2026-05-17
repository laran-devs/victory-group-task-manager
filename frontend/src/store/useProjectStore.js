import { create } from 'zustand';

export const useProjectStore = create((set, get) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,

  setSelectedProject: (project) => set({ selectedProject: project }),

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/projects/');
      if (response.ok) {
        const data = await response.json();
        set({ projects: data, isLoading: false });
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  addProject: async (projectData) => {
    try {
      const response = await fetch('/api/projects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (response.ok) {
        const newProject = await response.json();
        set((state) => ({ projects: [...state.projects, newProject] }));
        return { success: true, data: newProject };
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error adding project:', error);
      return { success: false, error: error.message };
    }
  },
}));
