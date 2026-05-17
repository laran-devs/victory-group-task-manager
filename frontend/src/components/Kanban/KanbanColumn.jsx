import React, { useState, useRef, useEffect } from 'react';
import { TaskCard } from './TaskCard';
import { Plus, MoreHorizontal } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useTaskStore } from '../../store/useTaskStore';

export const KanbanColumn = ({ title, status, tasks }) => {
  const openAddTaskModal = useTaskStore((state) => state.openAddTaskModal);
  const addNotification = useTaskStore((state) => state.addNotification);
  const { setNodeRef } = useDroppable({
    id: status,
    data: { status }
  });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col w-80 min-w-[20rem]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm text-zinc-700 uppercase tracking-wider">{title}</h2>
          <span className="bg-gray-200 text-zinc-600 px-2 py-0.5 rounded-full text-[10px] font-black">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => openAddTaskModal(status)}
            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
          >
            <Plus size={16} />
          </button>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-1 rounded transition-colors ${isMenuOpen ? 'bg-gray-200 text-gray-700' : 'hover:bg-gray-200 text-gray-500'}`}
            >
              <MoreHorizontal size={16} />
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-[100] animate-in fade-in zoom-in duration-150">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    openAddTaskModal(status);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  Добавить задачу
                </button>
                <div className="h-px bg-gray-100 my-1"></div>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    tasks.forEach(t => deleteTask(t.id));
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Очистить колонку
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-3 min-h-[500px] bg-gray-100/50 rounded-xl p-1"
      >
        <SortableContext 
          items={tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        
        <button 
          onClick={() => openAddTaskModal(status)}
          className="mt-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-gray-300 hover:text-gray-500 hover:bg-white transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus size={18} />
          Добавить задачу
        </button>
      </div>
    </div>
  );
};
