import { TaskCard } from './TaskCard';
import { Plus, MoreHorizontal } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

export const KanbanColumn = ({ title, status, tasks }) => {
  const { setNodeRef } = useDroppable({
    id: status,
    data: { status }
  });

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
          <button className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500">
            <Plus size={16} />
          </button>
          <button className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500">
            <MoreHorizontal size={16} />
          </button>
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
        
        <button className="mt-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-gray-300 hover:text-gray-500 hover:bg-white transition-all flex items-center justify-center gap-2 text-sm font-medium">
          <Plus size={18} />
          Добавить задачу
        </button>
      </div>
    </div>
  );
};
