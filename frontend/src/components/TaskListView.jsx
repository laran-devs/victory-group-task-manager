import React from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { MoreHorizontal, Calendar, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PriorityBadge = ({ priority }) => {
  const styles = {
    'Критический': 'bg-red-50 text-red-600 border-red-100',
    'Высокий': 'bg-orange-50 text-orange-600 border-orange-100',
    'Средний': 'bg-blue-50 text-blue-600 border-blue-100',
    'Низкий': 'bg-gray-50 text-gray-600 border-gray-100'
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider", styles[priority])}>
      {priority}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const columns = useTaskStore((state) => state.columns);
  const col = columns.find(c => c.status === status);
  const title = col ? col.title : status;
  
  const bgClass = 
    status === 'TO_DO' ? 'bg-zinc-100 text-zinc-700 border border-zinc-200/50' :
    status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
    status === 'DONE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
    'bg-purple-50 text-purple-700 border border-purple-100';

  return (
    <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border", bgClass)}>
      {title}
    </span>
  );
};

export const TaskListView = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const openAddTaskModal = useTaskStore((state) => state.openAddTaskModal);
  const users = useTaskStore((state) => state.users);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const filterPriority = useTaskStore((state) => state.filterPriority);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = (task.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Задача</th>
              <th className="px-6 py-4">Статус</th>
              <th className="px-6 py-4">Приоритет</th>
              <th className="px-6 py-4">Дедлайн</th>
              <th className="px-6 py-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTasks.map(task => {
              const assignee = users.find(u => u.id === task.assigneeId) || users[0];
              return (
              <tr 
                key={task.id} 
                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() => openAddTaskModal(task.status, task)}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</span>
                      <span className="text-xs text-gray-500 truncate max-w-xs">{task.description}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-6 py-4">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                    <Calendar size={14} />
                    {task.deadline 
                      ? new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                      : 'Без срока'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-3">
                    <img 
                      className="w-7 h-7 rounded-full border-2 border-white shadow-sm" 
                      src={assignee.avatar} 
                      title={assignee.name}
                      alt={assignee.name} 
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddTaskModal(task.status, task);
                      }}
                      className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  Нет задач
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
