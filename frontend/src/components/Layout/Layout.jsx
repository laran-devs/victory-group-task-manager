import { useState } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Users, 
  BarChart3, 
  UserCircle,
  Search,
  Plus,
  Filter,
  LogOut
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AddTaskModal } from '../AddTaskModal';
import { useTaskStore } from '../../store/useTaskStore';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Sidebar = () => {
  const currentUser = useTaskStore((state) => state.currentUser);
  const logout = useTaskStore((state) => state.logout);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Briefcase, label: 'Projects', path: '/projects' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Users, label: 'Team', path: '/team' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: UserCircle, label: 'Clients', path: '/clients' },
  ];

  return (
    <aside className="w-64 bg-zinc-900 text-white h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">V</div>
          <span className="font-bold text-xl tracking-tight">Victory Group</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
            <img src={currentUser?.avatar} alt="Profile" />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-semibold truncate">{currentUser?.name}</span>
            <span className="text-xs text-zinc-500 truncate">Сотрудник</span>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
            title="Выйти"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ onAddTask, onFeatureNotReady }) => {
  const viewMode = useTaskStore((state) => state.viewMode);
  const setViewMode = useTaskStore((state) => state.setViewMode);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск задач..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            value={useTaskStore((state) => state.searchQuery)}
            onChange={(e) => useTaskStore.getState().setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center bg-gray-100 rounded-lg px-2 text-sm font-medium text-gray-600">
          <Filter size={16} className="mr-2" />
          <select 
            className="bg-transparent border-none py-2 focus:ring-0 outline-none cursor-pointer text-sm font-semibold"
            value={useTaskStore((state) => state.filterPriority)}
            onChange={(e) => useTaskStore.getState().setFilterPriority(e.target.value)}
          >
            <option value="all">Все приоритеты</option>
            <option value="Критический">Критический</option>
            <option value="Высокий">Высокий</option>
            <option value="Средний">Средний</option>
            <option value="Низкий">Низкий</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('board')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all", 
              viewMode === 'board' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Доска
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all", 
              viewMode === 'list' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Список
          </button>
        </div>
        <button 
          onClick={onAddTask}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-bold"
        >
          <Plus size={18} />
          Добавить задачу
        </button>
      </div>
    </header>
  );
};

export const MainLayout = ({ children }) => {
  const openAddTaskModal = useTaskStore((state) => state.openAddTaskModal);
  const addNotification = useTaskStore((state) => state.addNotification);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="pl-64">
        <TopBar 
          onAddTask={() => openAddTaskModal('TO_DO')} 
          onFeatureNotReady={(feature) => addNotification(`${feature} в разработке`, 'info')}
        />
        <main className="p-8">
          {children}
        </main>
      </div>

      <AddTaskModal />
    </div>
  );
};
