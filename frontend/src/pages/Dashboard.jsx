import { KanbanBoard } from '../components/Kanban/KanbanBoard';

const Dashboard = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 m-0 mb-1">Задачи проекта</h1>
          <p className="text-gray-500 text-sm">Управление рабочим процессом Victory Group</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1,2,3,4].map(i => (
              <img 
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white" 
                src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} 
                alt="Member" 
              />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">+12</div>
          </div>
          <button className="ml-4 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-white transition-colors">Поделиться</button>
        </div>
      </div>
      
      <KanbanBoard />
    </div>
  );
};

export default Dashboard;
