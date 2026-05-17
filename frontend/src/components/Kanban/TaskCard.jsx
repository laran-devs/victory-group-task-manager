import React, { useState, useRef, useEffect } from 'react';
import { Calendar, AlertCircle, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '../../store/useTaskStore';

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

export const TaskCard = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const addNotification = useTaskStore((state) => state.addNotification);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const openAddTaskModal = useTaskStore((state) => state.openAddTaskModal);
  const users = useTaskStore((state) => state.users);
  
  const assignee = users.find(u => u.id === task.assigneeId) || users[0];
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const isCritical = task.vdlEvent?.severity === 'critical';

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
        isCritical 
          ? "bg-red-50 border-red-200 shadow-sm" 
          : "bg-white border-gray-200",
        isDragging && "shadow-2xl z-50 ring-2 ring-indigo-500 border-transparent"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          {task.tags.map(tag => (
            <span key={tag} className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
        <div className="relative" ref={menuRef}>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md ${isMenuOpen ? 'opacity-100 bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            <MoreHorizontal size={16} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-[100] animate-in fade-in zoom-in duration-150">
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  openAddTaskModal(task.status, task);
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
              >
                Редактировать
              </button>
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  deleteTask(task.id);
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Удалить
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-bold text-sm text-zinc-800 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
        {task.title}
      </h3>
      
      <p className="text-xs text-gray-500 line-clamp-2 mb-4">
        {task.description}
      </p>

      {task.vdlEvent && (
        <div className="mb-4 p-2 bg-red-100/50 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-tight">
            VDL EVENT: {task.vdlEvent.message}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-gray-400">
            <Calendar size={12} />
            <span className="text-[10px] font-medium">
              {new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <PriorityBadge priority={task.priority} />
        </div>
        
        <div className="flex -space-x-1.5">
          <img 
            className="w-6 h-6 rounded-full border-2 border-white" 
            src={assignee.avatar} 
            title={assignee.name}
            alt={assignee.name} 
          />
        </div>
      </div>
    </div>
  );
};
