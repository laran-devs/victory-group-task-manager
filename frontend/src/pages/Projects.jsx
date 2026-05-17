import React from 'react';
import { Search, Plus, Calendar, CheckCircle2, Clock, Users } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { NavLink } from 'react-router-dom';

export const Projects = () => {
  const projects = useProjectStore((state) => state.projects);
  const searchQuery = useProjectStore((state) => state.searchQuery);
  const setSearchQuery = useProjectStore((state) => state.setSearchQuery);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'В работе': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Завершен': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'На паузе': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'В работе': return <Clock size={14} className="mr-1" />;
      case 'Завершен': return <CheckCircle2 size={14} className="mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Проекты</h1>
          <p className="text-zinc-500 font-medium mt-1">Управление всеми проектами компании</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Поиск проектов..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-bold shadow-md shadow-indigo-200">
            <Plus size={18} />
            Создать проект
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <NavLink 
            key={project.id} 
            to="/tasks" 
            className="block group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className={`h-2 w-full ${project.color}`}></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center ${getStatusStyle(project.status)}`}>
                  {getStatusIcon(project.status)}
                  {project.status}
                </span>
                <span className="flex items-center text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                  <Calendar size={12} className="mr-1.5" />
                  {project.dueDate}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {project.title}
              </h3>
              <p className="text-zinc-500 text-sm mb-6 line-clamp-2 h-10">
                {project.description}
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-zinc-500">Прогресс</span>
                  <span className={project.progress > 80 ? 'text-emerald-500' : 'text-indigo-600'}>
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${project.color}`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex -space-x-2">
                  {project.members.map(member => (
                    <img 
                      key={member.id}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110" 
                      src={member.avatar} 
                      alt={member.name}
                      title={member.name}
                    />
                  ))}
                  {project.members.length === 0 && (
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400">
                      <Users size={14} />
                    </div>
                  )}
                </div>
                <div className="text-xs font-bold text-zinc-400 flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                  <CheckSquareIcon className="w-3.5 h-3.5 mr-1.5" />
                  {project.taskCount} задач
                </div>
              </div>
            </div>
          </NavLink>
        ))}
        
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-1">Проекты не найдены</h3>
            <p className="text-zinc-500 text-sm">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple icon for tasks
const CheckSquareIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
