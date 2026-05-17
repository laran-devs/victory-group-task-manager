import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';

export const LoginScreen = () => {
  const loginAction = useTaskStore((state) => state.login);

  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!loginInput.trim()) {
      setError('Пожалуйста, введите логин');
      setLoading(false);
      return;
    }

    // Call the real JWT login API action
    const success = await loginAction(loginInput, passwordInput);
    
    setLoading(false);
    if (!success) {
      setError('Неверный логин или пароль. Убедитесь, что бэкенд запущен.');
    }
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
        <p className="text-gray-500 text-sm mb-8 text-center">Авторизация через Victory ID</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Логин или Email</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="ivan или ivan@victory.ru"
              value={loginInput}
              disabled={loading}
              onChange={(e) => { setLoginInput(e.target.value); setError(''); }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Пароль</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Введите пароль"
              value={passwordInput}
              disabled={loading}
              onChange={(e) => { setPasswordInput(e.target.value); setError(''); }}
            />
          </div>

          {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors mt-4 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Входим...
              </>
            ) : 'Войти'}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-semibold mb-2 text-center">ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ:</p>
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2 justify-center">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">ivan</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">petr</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Пароль для всех: <span className="font-mono font-bold text-indigo-600">victory123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
