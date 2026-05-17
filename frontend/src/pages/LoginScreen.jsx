import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';

export const LoginScreen = () => {
  const users = useTaskStore((state) => state.users);
  const loginAction = useTaskStore((state) => state.login);

  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = users.find(u => u.login.toLowerCase() === loginInput.toLowerCase().trim());
    
    if (!user) {
      setError('Неверный логин. Доступные: ivan, anna, petr');
      return;
    }

    if (passwordInput !== '') {
      setError('Неверный пароль. (В тестовом режиме оставьте поле пустым)');
      return;
    }

    loginAction(user);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-200">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-2 text-center">Вход в систему</h1>
        <p className="text-gray-500 text-sm mb-8 text-center">Введите свои учетные данные</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Логин</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Например: ivan"
              value={loginInput}
              onChange={(e) => { setLoginInput(e.target.value); setError(''); }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Пароль</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Любой пароль"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
          </div>

          {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors mt-4"
          >
            Войти
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-semibold mb-2 text-center">ТЕСТОВЫЕ ДОСТУПЫ:</p>
          <div className="flex gap-2 justify-center">
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">ivan</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">anna</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">petr</span>
          </div>
        </div>
      </div>
    </div>
  );
};
