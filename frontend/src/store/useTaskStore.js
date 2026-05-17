import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import initialTasks from '../mocks/tasks.json';

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
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=4f46e5&color=fff`
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
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=4f46e5&color=fff`
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
      const response = await fetch('/api/tasks/?project_id=global', { headers });
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
    const localId = task.id || `VT-${Math.floor(Math.random() * 1000)}`;
    const tempTask = {
      ...task,
      id: localId,
      createdAt: task.createdAt || new Date().toISOString()
    };
    
    set((state) => ({
      tasks: [tempTask, ...state.tasks]
    }));

    try {
      const token = get().token || localStorage.getItem('token');
      const taskPayload = { ...task, id: localId };
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
    set((state) => ({
      tasks: state.tasks.map((task) => 
        task.id === taskId ? { ...task, ...updatedFields } : task
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
  }
}));
