import { create } from 'zustand';
import initialTasks from '../mocks/tasks.json';
import { arrayMove } from '@dnd-kit/sortable';

export const useTaskStore = create((set) => ({
  tasks: initialTasks,
  notifications: [],

  moveTask: (taskId, newStatus) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId ? { ...task, status: newStatus } : task
    )
  })),

  reorderTasks: (activeId, overId) => set((state) => {
    const oldIndex = state.tasks.findIndex((t) => t.id === activeId);
    const newIndex = state.tasks.findIndex((t) => t.id === overId);
    return {
      tasks: arrayMove(state.tasks, oldIndex, newIndex)
    };
  }),

  moveTaskToColumn: (taskId, overStatus, overId) => set((state) => {
    const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return state;

    const updatedTasks = [...state.tasks];
    updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: overStatus };

    if (overId && overId !== taskId) {
      const overIndex = state.tasks.findIndex((t) => t.id === overId);
      return { tasks: arrayMove(updatedTasks, taskIndex, overIndex) };
    }

    return { tasks: updatedTasks };
  }),

  addTask: (task) => set((state) => ({
    tasks: [
      {
        ...task,
        id: task.id || `VT-${Math.floor(Math.random() * 1000)}`,
        createdAt: task.createdAt || new Date().toISOString()
      },
      ...state.tasks
    ]
  })),

  handleServerEvent: (event) => set((state) => {
    const { type, payload } = event;
    let newTasks = [...state.tasks];
    let newNotification = {
      id: Date.now(),
      type: 'info',
      message: ''
    };

    switch (type) {
      case 'TASK_UPDATED':
        newTasks = newTasks.map(t =>
          t.id === payload.id ? { ...t, status: payload.status } : t
        );
        newNotification.message = `Задача ${payload.id} обновлена: ${payload.status}`;
        break;

      case 'VDL_ALERT':
        newTasks = newTasks.map(t =>
          t.id === payload.id ? { ...t, vdlEvent: payload.vdlEvent } : t
        );
        newNotification.message = `Критическое событие аналитики по задаче ${payload.id}`;
        newNotification.type = 'warning';
        break;

      case 'NEW_TASK':
        if (!newTasks.find(t => t.id === payload.id)) {
          newTasks = [payload, ...newTasks];
          newNotification.message = `Добавлена новая задача: ${payload.title}`;
          newNotification.type = 'success';
        }
        break;

      default:
        return state;
    }

    return {
      tasks: newTasks,
      notifications: [...state.notifications, newNotification]
    };
  }),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  deleteTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== taskId)
  })),

  updateTask: (taskId, updatedFields) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId ? { ...task, ...updatedFields } : task
    )
  }))
}));
