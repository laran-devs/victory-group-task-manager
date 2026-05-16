import React, { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { X, Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const NotificationToast = () => {
  const notifications = useTaskStore((state) => state.notifications);
  const removeNotification = useTaskStore((state) => state.removeNotification);

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {notifications.map((n) => (
        <div 
          key={n.id}
          className="pointer-events-auto bg-white border border-gray-200 shadow-2xl rounded-xl p-4 w-80 animate-in slide-in-from-right-full duration-300 flex gap-3 relative overflow-hidden group"
        >
          {/* Progress bar simulation */}
          <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 animate-shrink" style={{ width: '100%' }}></div>
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            n.type === 'success' ? 'bg-green-50 text-green-500' :
            n.type === 'warning' ? 'bg-red-50 text-red-500' :
            'bg-blue-50 text-blue-500'
          }`}>
            {n.type === 'success' ? <CheckCircle size={20} /> :
             n.type === 'warning' ? <AlertTriangle size={20} /> :
             <Info size={20} />}
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
              {n.type === 'warning' ? 'Алерт аналитики' : 'Обновление системы'}
            </p>
            <p className="text-sm font-medium text-zinc-700 leading-snug">
              {n.message}
            </p>
          </div>

          <button 
            onClick={() => removeNotification(n.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
