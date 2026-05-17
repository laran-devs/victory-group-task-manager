import { KanbanBoard } from '../components/Kanban/KanbanBoard';
import { TaskListView } from '../components/TaskListView';
import { useTaskStore } from '../store/useTaskStore';

const Dashboard = () => {
  const viewMode = useTaskStore((state) => state.viewMode);
  const currentUser = useTaskStore((state) => state.currentUser);
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 m-0 mb-1">Задачи проекта</h1>
          <p className="text-gray-500 text-sm">Управление рабочим процессом Victory Group</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <img 
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
              src={currentUser?.avatar} 
              title={`${currentUser?.name} (Вы онлайн)`}
              alt={currentUser?.name} 
            />
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              useTaskStore.getState().addNotification('Ссылка на проект скопирована в буфер обмена', 'success');
            }}
            className="ml-4 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
          >
            Поделиться
          </button>
        </div>
      </div>
      
      {viewMode === 'board' ? <KanbanBoard /> : <TaskListView />}
    </div>
  );
};

export default Dashboard;
