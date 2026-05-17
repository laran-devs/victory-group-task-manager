import { create } from 'zustand';

const MOCK_PROJECTS = [
  {
    id: 'p1',
    title: 'Редизайн корпоративного сайта',
    description: 'Полное обновление UI/UX дизайна главного сайта компании с переходом на новый стек технологий.',
    status: 'В работе',
    progress: 65,
    dueDate: '2026-10-15',
    members: [
      { id: '1', name: 'Иван Иванов', avatar: 'https://ui-avatars.com/api/?name=Ivan+Ivanov&background=4f46e5&color=fff' },
      { id: '2', name: 'Анна Смирнова', avatar: 'https://ui-avatars.com/api/?name=Anna+Smirnova&background=ec4899&color=fff' }
    ],
    taskCount: 24,
    color: 'bg-blue-500'
  },
  {
    id: 'p2',
    title: 'Интеграция CRM системы',
    description: 'Подключение внешнего API для синхронизации клиентской базы и автоматизации рассылок.',
    status: 'На паузе',
    progress: 30,
    dueDate: '2026-11-01',
    members: [
      { id: '3', name: 'Петр Сидоров', avatar: 'https://ui-avatars.com/api/?name=Petr+Sidorov&background=10b981&color=fff' },
      { id: '1', name: 'Иван Иванов', avatar: 'https://ui-avatars.com/api/?name=Ivan+Ivanov&background=4f46e5&color=fff' }
    ],
    taskCount: 12,
    color: 'bg-amber-500'
  },
  {
    id: 'p3',
    title: 'Запуск мобильного приложения',
    description: 'Разработка MVP версии мобильного приложения для iOS и Android на React Native.',
    status: 'В работе',
    progress: 85,
    dueDate: '2026-09-30',
    members: [
      { id: '2', name: 'Анна Смирнова', avatar: 'https://ui-avatars.com/api/?name=Anna+Smirnova&background=ec4899&color=fff' },
      { id: '4', name: 'Елена Попова', avatar: 'https://ui-avatars.com/api/?name=Elena+Popova&background=8b5cf6&color=fff' },
      { id: '5', name: 'Дмитрий Волков', avatar: 'https://ui-avatars.com/api/?name=Dmitry+Volkov&background=f97316&color=fff' }
    ],
    taskCount: 56,
    color: 'bg-emerald-500'
  },
  {
    id: 'p4',
    title: 'Маркетинговая кампания Q4',
    description: 'Подготовка рекламных материалов и лендингов для новогодней распродажи.',
    status: 'Планирование',
    progress: 5,
    dueDate: '2026-12-15',
    members: [
      { id: '4', name: 'Елена Попова', avatar: 'https://ui-avatars.com/api/?name=Elena+Popova&background=8b5cf6&color=fff' }
    ],
    taskCount: 8,
    color: 'bg-purple-500'
  }
];

export const useProjectStore = create((set) => ({
  projects: MOCK_PROJECTS,
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  addProject: (project) => set((state) => ({
    projects: [
      {
        ...project,
        id: `p${Date.now()}`,
        progress: 0,
        taskCount: 0,
        members: []
      },
      ...state.projects
    ]
  })),
  
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id)
  }))
}));
