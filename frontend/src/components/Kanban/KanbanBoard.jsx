import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  sortableKeyboardCoordinates, 
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { useTaskStore } from '../../store/useTaskStore';

export const KanbanBoard = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const filterPriority = useTaskStore((state) => state.filterPriority);
  const moveTaskToColumn = useTaskStore((state) => state.moveTaskToColumn);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = (task.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Avoid accidental drags on click
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = useTaskStore((state) => state.columns);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the status of the over item (it could be a column status or a task id)
    const overTask = tasks.find(t => t.id === overId);
    const overStatus = overTask ? overTask.status : over.data.current?.status;

    if (overStatus) {
      moveTaskToColumn(activeId, overStatus, overTask ? overId : null);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
        {columns.map(column => (
          <KanbanColumn 
            key={column.status}
            title={column.title}
            status={column.status}
            tasks={filteredTasks.filter(t => t.status === column.status)}
          />
        ))}
      </div>
      
      {/* Optional: Add DragOverlay for better visual feedback */}
    </DndContext>
  );
};
