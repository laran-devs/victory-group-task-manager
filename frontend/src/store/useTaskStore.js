import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import initialTasks from '../mocks/tasks.json';
import { useProjectStore } from './useProjectStore';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  notifications: [],
  users: [
    { id: '1', login: 'ivan', name: 'Иван Иванов', avatar: 'https://ui-avatars.com/api/?name=Ivan+Ivanov&background=4f46e5&color=fff' },
    { id: '2', login: 'anna', name: 'Анна Смирнова', avatar: 'https://ui-avatars.com/api/?name=Anna+Smirnova&background=ec4899&color=fff' },
    { id: '3', login: 'petr', name: 'Петр Сидоров', avatar: 'https://ui-avatars.com/api/?name=Petr+Sidorov&background=10b981&color=fff' }
  ],
  currentUser: null,
  token: localStorage.getItem('token') || null,
  isAuthLoading: !!localStorage.getItem('token'),
  isAddTaskModalOpen: false,
  defaultNewTaskStatus: 'TO_DO',
  editingTask: null,
  viewMode: 'board',
  searchQuery: '',
  filterPriority: 'all',
  columns: [
    { title: 'To Do', status: 'TO_DO', limit: 0, isCore: true },
    { title: 'In Progress', status: 'IN_PROGRESS', limit: 3, isCore: true },
    { title: 'Done', status: 'DONE', limit: 0, isCore: true }
  ],
  automationRules: {
    autoAssignCritical: true,
    highlightSLA: true,
    autoArchiveDone: false
  },
  
  initAuth: async () => {
    const token = get().token || localStorage.getItem('token');
    if (!token) {
      set({ isAuthLoading: false });
      return;
    }
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const user = await response.json();
        const mappedUser = {
          id: user.id,
          login: user.email.split('@')[0],
          name: user.full_name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=4f46e5&color=fff`,
          role: user.role
        };
        set({ currentUser: mappedUser, token, isAuthLoading: false });
        get().fetchTasks();
        get().fetchUsers();
      } else {
        get().logout();
      }
    } catch (error) {
      console.error('Failed to initialize auth from saved token:', error);
      set({ isAuthLoading: false });
    }
  },

  login: async (loginInput, passwordInput) => {
    try {
      const email = loginInput.includes('@') ? loginInput : `${loginInput.trim()}@victory.ru`;
      const password = passwordInput || 'victory123';
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        const { access_token } = data;
        localStorage.setItem('token', access_token);
        set({ token: access_token, isAuthLoading: false });
        
        const meResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        if (meResponse.ok) {
          const user = await meResponse.json();
          const mappedUser = {
            id: user.id,
            login: user.email.split('@')[0],
            name: user.full_name,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=4f46e5&color=fff`,
            role: user.role
          };
          set({ currentUser: mappedUser });
          get().fetchTasks();
          get().fetchUsers();
          get().addNotification(`Успешный вход! Добро пожаловать, ${user.full_name}`, 'success');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login action failed:', error);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ currentUser: null, token: null, tasks: [], isAuthLoading: false });
    get().addNotification('Вы вышли из системы', 'info');
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setViewMode: (mode) => set({ viewMode: mode }),
  openAddTaskModal: (status = 'TO_DO', taskToEdit = null) => set({ 
    isAddTaskModalOpen: true, 
    defaultNewTaskStatus: status,
    editingTask: taskToEdit 
  }),
  closeAddTaskModal: () => set({ isAddTaskModalOpen: false, editingTask: null }),

  setColumns: (newColumns) => set({ columns: newColumns }),
  updateWIPLimit: (status, limit) => set((state) => ({ 
    columns: state.columns.map(c => c.status === status ? { ...c, limit: parseInt(limit) || 0 } : c) 
  })),
  renameColumn: (status, newTitle) => set((state) => {
    const col = state.columns.find(c => c.status === status);
    if (col && col.isCore) return {}; // Ignore renames on core columns
    return { 
      columns: state.columns.map(c => c.status === status ? { ...c, title: newTitle } : c) 
    };
  }),
  addColumn: (title) => set((state) => {
    const activeStatuses = state.columns.map(c => c.status);
    const availableCustom = ['CUSTOM_1', 'CUSTOM_2', 'CUSTOM_3', 'CUSTOM_4', 'CUSTOM_5'].find(
      status => !activeStatuses.includes(status)
    );
    if (!availableCustom) {
      get().addNotification('Достигнут лимит кастомных колонок (макс. 5)', 'error');
      return {};
    }
    const newCol = { title, status: availableCustom, limit: 0, isCore: false };
    const newColumns = [...state.columns, newCol];
    get().addNotification(`Колонка "${title}" создана!`, 'success');
    return { columns: newColumns };
  }),
  deleteColumn: (status) => set((state) => {
    const col = state.columns.find(c => c.status === status);
    if (!col) return {};
    if (col.isCore) {
      get().addNotification('Нельзя удалить системную колонку!', 'error');
      return {};
    }
    
    // Move all tasks in this column back to TO_DO
    const updatedTasks = state.tasks.map(t => 
      t.status === status ? { ...t, status: 'TO_DO' } : t
    );
    
    const newColumns = state.columns.filter(c => c.status !== status);
    get().addNotification(`Колонка "${col.title}" удалена. Задачи перенесены в "To Do".`, 'info');
    return { columns: newColumns, tasks: updatedTasks };
  }),
  moveColumn: (status, direction) => set((state) => {
    const index = state.columns.findIndex(c => c.status === status);
    if (index === -1) return {};
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= state.columns.length) return {};
    
    const newColumns = [...state.columns];
    const temp = newColumns[index];
    newColumns[index] = newColumns[targetIndex];
    newColumns[targetIndex] = temp;
    return { columns: newColumns };
  }),
  toggleAutomationRule: (ruleName) => set((state) => ({
    automationRules: { 
      ...state.automationRules, 
      [ruleName]: !state.automationRules[ruleName] 
    }
  })),

  addNotification: (message, type = 'info') => set((state) => {
    const newNotification = { id: Date.now(), message, type };
    setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter(n => n.id !== newNotification.id) }));
    }, 4000);
    return { notifications: [...state.notifications, newNotification] };
  }),
  
  fetchTasks: async () => {
    const token = get().token || localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      const selectedProject = useProjectStore.getState().selectedProject;
      const projectId = selectedProject ? selectedProject.id : 'all';
      const response = await fetch(`/api/tasks/?project_id=${projectId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        set({ tasks: data });
      } else {
        throw new Error('Server returned ' + response.status);
      }
    } catch (error) {
      console.error('Failed to fetch tasks, fallback to local data:', error);
      set({ tasks: initialTasks });
    }
  },

  fetchUsers: async () => {
    const token = get().token || localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('/api/team/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedUsers = data.map(user => ({
          id: user.id,
          login: user.email.split('@')[0],
          name: user.full_name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=4f46e5&color=fff`
        }));
        set({ users: mappedUsers });
      }
    } catch (error) {
      console.error('Failed to fetch team users from API:', error);
    }
  },

  moveTask: async (taskId, newStatus) => {
    set((state) => ({
      tasks: state.tasks.map((task) => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    }));
    try {
      const token = get().token || localStorage.getItem('token');
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  },

  reorderTasks: (activeId, overId) => set((state) => {
    const oldIndex = state.tasks.findIndex((t) => t.id === activeId);
    const newIndex = state.tasks.findIndex((t) => t.id === overId);
    return {
      tasks: arrayMove(state.tasks, oldIndex, newIndex)
    };
  }),

  moveTaskToColumn: async (taskId, overStatus, overId) => {
    const state = get();
    const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const updatedTasks = [...state.tasks];
    updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: overStatus };
    
    let nextTasks = updatedTasks;
    if (overId && overId !== taskId) {
      const overIndex = state.tasks.findIndex((t) => t.id === overId);
      nextTasks = arrayMove(updatedTasks, taskIndex, overIndex);
    }
    
    set({ tasks: nextTasks });

    // Auto-Archive Done Tasks automation rule
    if (state.automationRules.autoArchiveDone && overStatus === 'DONE') {
      setTimeout(() => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== taskId)
        }));
        get().addNotification(`Задача ${taskId} автоматически архивирована!`, 'success');
      }, 1500);
    }

    try {
      const token = get().token || localStorage.getItem('token');
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: overStatus })
      });
    } catch (error) {
      console.error('Failed to move task to column:', error);
    }
  },

  addTask: async (task) => {
    const state = get();
    let finalTask = { ...task };
    if (state.automationRules.autoAssignCritical && finalTask.priority === 'Критический') {
      const leadPM = state.users.find(u => u.role === 'Admin') || state.users[0];
      if (leadPM) {
        finalTask.assigneeId = leadPM.id;
      }
    }

    const localId = finalTask.id || `VT-${Math.floor(Math.random() * 1000)}`;
    const selectedProject = useProjectStore.getState().selectedProject;
    const projectId = selectedProject ? selectedProject.id : 'all';
    
    const tempTask = {
      ...finalTask,
      id: localId,
      projectId: projectId,
      createdAt: finalTask.createdAt || new Date().toISOString()
    };
    
    set((s) => ({
      tasks: [tempTask, ...s.tasks]
    }));

    try {
      const token = get().token || localStorage.getItem('token');
      const taskPayload = { ...task, id: localId, projectId: projectId };
      const response = await fetch('/api/tasks/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(taskPayload)
      });
      if (response.ok) {
        const savedTask = await response.json();
        set((state) => ({
          tasks: state.tasks.map(t => t.id === localId ? savedTask : t)
        }));
      }
    } catch (error) {
      console.error('Failed to add task on server (working in local mode):', error);
    }
  },

  handleServerEvent: (event) => {
    const state = get();
    const eventType = event.event_type || event.type;
    const { payload } = event;
    if (!eventType || !payload) return;

    let newTasks = [...state.tasks];
    let message = '';
    let type = 'info';

    switch (eventType) {
      case 'TASK_UPDATED':
        newTasks = newTasks.map(t => 
          t.id === payload.id ? { ...t, ...payload } : t
        );
        message = `Задача ${payload.id} обновлена: ${payload.status}`;
        break;
      
      case 'VDL_ALERT':
        const targetTaskId = payload.task_id || payload.id;
        newTasks = newTasks.map(t => 
          t.id === targetTaskId ? { ...t, vdlEvent: payload } : t
        );
        message = `Критическое событие аналитики: ${payload.message}`;
        type = 'warning';
        break;

      case 'NEW_TASK':
        if (!newTasks.find(t => t.id === payload.id)) {
          newTasks = [payload, ...newTasks];
          message = `Добавлена новая задача: ${payload.title}`;
          type = 'success';
        }
        break;

      case 'TASK_DELETED':
        const deletedId = payload.task_id || payload.id;
        if (deletedId) {
          newTasks = newTasks.filter(t => t.id !== deletedId);
          message = `Задача ${deletedId} удалена`;
        }
        break;
      
      default:
        return;
    }

    set({ tasks: newTasks });
    if (message) {
      get().addNotification(message, type);
    }
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  clearAllNotifications: () => set({ notifications: [] }),

  deleteTask: async (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId)
    }));

    try {
      const token = get().token || localStorage.getItem('token');
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (error) {
      console.error('Failed to delete task on server:', error);
    }
  },

  updateTask: async (taskId, updatedFields) => {
    const state = get();
    let nextFields = { ...updatedFields };
    if (state.automationRules.autoAssignCritical && nextFields.priority === 'Критический') {
      const leadPM = state.users.find(u => u.role === 'Admin') || state.users[0];
      if (leadPM) {
        nextFields.assigneeId = leadPM.id;
      }
    }

    set((s) => ({
      tasks: s.tasks.map((task) => 
        task.id === taskId ? { ...task, ...nextFields } : task
      )
    }));

    try {
      const token = get().token || localStorage.getItem('token');
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updatedFields)
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  },

  registerUser: async (userData) => {
    try {
      const token = get().token || localStorage.getItem('token');
      const response = await fetch('/api/team/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(userData)
      });
      if (response.ok) {
        const newUser = await response.json();
        set((state) => ({ users: [...state.users, {
          id: newUser.id,
          login: newUser.email.split('@')[0],
          name: newUser.full_name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.full_name)}&background=4f46e5&color=fff`,
          role: newUser.role
        }] }));
        get().addNotification(`Сотрудник ${newUser.full_name} успешно зарегистрирован!`, 'success');
        return { success: true, data: newUser };
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || 'Не удалось зарегистрировать сотрудника');
      }
    } catch (error) {
      console.error('Error registering team member:', error);
      get().addNotification(`Ошибка: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }
}));
