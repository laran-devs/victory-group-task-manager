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
  Filter
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AddTaskModal } from '../AddTaskModal';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Sidebar = () => {
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
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
            <img src="https://ui-avatars.com/api/?name=Ivan+Ivanov&background=4f46e5&color=fff" alt="Profile" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Иванов И.И.</span>
            <span className="text-xs text-zinc-500">Тимлид</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ onAddTask }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск задач..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium">
          <Filter size={18} />
          Фильтры
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button className="px-3 py-1.5 bg-white shadow-sm rounded-md text-xs font-semibold text-zinc-900">Доска</button>
          <button className="px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700">Список</button>
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="pl-64">
        <TopBar onAddTask={() => setIsModalOpen(true)} />
        <main className="p-8">
          {children}
        </main>
      </div>

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};
