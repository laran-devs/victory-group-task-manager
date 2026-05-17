import React from 'react';
import { Search, Mail, Shield, Briefcase } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export const Team = () => {
  const users = useTaskStore((state) => state.users);
  const [search, setSearch] = React.useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.login.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Команда</h1>
          <p className="text-zinc-500 font-medium mt-1">Состав проектного офиса Victory Tasks</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Поиск сотрудников..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div 
            key={user.id} 
            className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-4 mb-4">
                <img 
                  className="w-14 h-14 rounded-2xl shadow-inner object-cover border border-gray-100 group-hover:scale-105 transition-transform" 
                  src={user.avatar} 
                  alt={user.name} 
                />
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 leading-snug group-hover:text-indigo-600 transition-colors">
                    {user.name}
                  </h3>
                  <span className="text-xs font-semibold text-zinc-400">@{user.login}</span>
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-gray-50 text-sm font-medium">
                <div className="flex items-center gap-2.5 text-zinc-600">
                  <Briefcase size={16} className="text-gray-400" />
                  <span>{user.position || 'Разработчик'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-600">
                  <Mail size={16} className="text-gray-400" />
                  <span className="truncate">{user.login}@victory.ru</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-600">
                  <Shield size={16} className="text-gray-400" />
                  <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                    user.role === 'Superuser' ? 'bg-red-50 text-red-600 border border-red-100' :
                    user.role === 'Admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                    'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {user.role === 'Superuser' ? 'Суперпользователь' :
                     user.role === 'Admin' ? 'Администратор' :
                     'Сотрудник'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex gap-2">
              <a 
                href={`mailto:${user.login}@victory.ru`}
                className="flex-1 text-center py-2.5 border border-gray-100 hover:border-gray-200 text-zinc-700 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all bg-gray-50/50 hover:bg-indigo-50/10"
              >
                Написать
              </a>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`@${user.login}`);
                  useTaskStore.getState().addNotification('Ник скопирован', 'success');
                }}
                className="px-3 border border-gray-100 hover:border-gray-200 text-zinc-400 hover:text-zinc-600 rounded-xl transition-all hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <h3 className="text-lg font-bold text-zinc-900 mb-1">Никого не нашли</h3>
            <p className="text-zinc-500 text-sm">Попробуйте изменить поисковый запрос</p>
          </div>
        )}
      </div>
    </div>
  );
};
