import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { 
  Sliders, 
  UserPlus, 
  Activity, 
  ShieldAlert, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  Trash2, 
  Sparkles,
  RefreshCw,
  Users
} from 'lucide-react';

const AdminPanel = () => {
  const currentUser = useTaskStore((state) => state.currentUser);
  const columns = useTaskStore((state) => state.columns);
  const automationRules = useTaskStore((state) => state.automationRules);
  const updateWIPLimit = useTaskStore((state) => state.updateWIPLimit);
  const renameColumn = useTaskStore((state) => state.renameColumn);
  const addColumn = useTaskStore((state) => state.addColumn);
  const deleteColumn = useTaskStore((state) => state.deleteColumn);
  const moveColumn = useTaskStore((state) => state.moveColumn);
  const toggleAutomationRule = useTaskStore((state) => state.toggleAutomationRule);
  const registerUser = useTaskStore((state) => state.registerUser);
  const systemUsers = useTaskStore((state) => state.users);

  // Tab State: 'processes', 'queue', 'users'
  const [activeTab, setActiveTab] = useState('processes');
  const [newColTitle, setNewColTitle] = useState('');
  
  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('User');
  const [regPosition, setRegPosition] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulated RabbitMQ Traffic State
  const [trafficRate, setTrafficRate] = useState(15);
  const [liveLogs, setLiveLogs] = useState([
    { id: 1, type: 'INFO', time: '17:15:32', msg: 'RabbitMQ Consumer connected. Listening on queue "victory.events".' },
    { id: 2, type: 'EVENT', time: '17:16:11', msg: 'Received EVENT [TASK_CREATED] - VT-104. Processing...' },
    { id: 3, type: 'AMQP', time: '17:16:12', msg: 'Message VT-104 acknowledged (ack) successfully.' }
  ]);

  // Simulate incoming live queue traffic logs
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'queue') {
        const events = ['TASK_UPDATED', 'TASK_CREATED', 'TASK_MOVED', 'VDL_WARNING'];
        const logs = [
          'Received event from Victory Auto routing engine.',
          'Broadcasting real-time update to web clients via WebSocket.',
          'Event stored in audit database and acknowledged.',
          'SLA background thread verified deadline thresholds.'
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const randomLog = logs[Math.floor(Math.random() * logs.length)];
        const time = new Date().toTimeString().split(' ')[0];
        
        setLiveLogs(prev => [
          { id: Date.now(), type: randomEvent, time, msg: `[${randomEvent}] ${randomLog}` },
          ...prev.slice(0, 14)
        ]);
        
        // Slightly wiggle traffic rate
        setTrafficRate(prev => Math.max(5, Math.min(45, prev + Math.floor(Math.random() * 7) - 3)));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!regName || !regEmail || !regPassword) {
      setFormError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    const result = await registerUser({
      email: regEmail,
      full_name: regName,
      password: regPassword,
      role: regRole,
      position: regPosition || null
    });
    setIsSubmitting(false);

    if (result.success) {
      setFormSuccess(`Сотрудник ${regName} успешно добавлен!`);
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegRole('User');
      setRegPosition('');
    } else {
      setFormError(result.error || 'Ошибка регистрации');
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'Superuser') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">Superuser</span>;
    if (role === 'Admin') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">Admin</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">User</span>;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 m-0 mb-1 flex items-center gap-2">
            Панель управления
            <span className="text-xs px-2.5 py-1 bg-zinc-900 text-white rounded-full font-bold uppercase tracking-wider">
              {currentUser?.role === 'Superuser' ? 'Superuser' : 'Admin'}
            </span>
          </h1>
          <p className="text-gray-500 text-sm">
            Настройка рабочих колонок, правил автоматизации и управление доступами
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 mb-8 bg-white p-1 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('processes')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'processes' 
              ? 'bg-zinc-950 text-white shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-gray-50'
          }`}
        >
          <Sliders size={18} />
          Управление процессами
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'queue' 
              ? 'bg-zinc-950 text-white shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-gray-50'
          }`}
        >
          <Activity size={18} />
          Очередь задач (RabbitMQ)
        </button>

        {currentUser?.role === 'Superuser' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'users' 
                ? 'bg-zinc-950 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-gray-50'
            }`}
          >
            <UserPlus size={18} />
            Управление пользователями
          </button>
        )}
      </div>

      {/* Tab 1: Column WIP limits and Automation rules */}
      {activeTab === 'processes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Column WIP settings */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-extrabold text-zinc-900 text-lg mb-1 flex items-center gap-2">
              Настройка колонок и WIP-лимитов
            </h3>
            <p className="text-gray-500 text-xs mb-6">
              Управляйте структурой доски: системные колонки ("To Do", "In Progress", "Done") всегда присутствуют, кастомные колонки можно добавлять, перемещать и удалять.
            </p>

            {/* Add Custom Column Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newColTitle.trim()) return;
                addColumn(newColTitle.trim());
                setNewColTitle('');
              }}
              className="flex gap-3 mb-6 bg-zinc-50 p-4 rounded-xl border border-gray-100"
            >
              <input 
                type="text" 
                placeholder="Название новой колонки (например, Тестирование)"
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium text-zinc-800"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-zinc-950 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus size={14} />
                Добавить
              </button>
            </form>

            <div className="space-y-4">
              {columns.map((col, idx) => (
                <div key={col.status} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={col.title}
                        disabled={col.isCore}
                        onChange={(e) => renameColumn(col.status, e.target.value)}
                        className={`bg-transparent border border-transparent rounded px-2 py-1 text-sm font-bold text-zinc-800 focus:outline-none transition-all w-full ${
                          col.isCore 
                            ? 'cursor-not-allowed text-zinc-500 font-extrabold' 
                            : 'hover:border-gray-300 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                        }`}
                      />
                      {col.isCore ? (
                        <span className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-600 text-[9px] font-bold uppercase shrink-0">Системная</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-bold uppercase shrink-0">Кастомная</span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono pl-2">{col.status}</span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-semibold">WIP:</span>
                      <input 
                        type="number" 
                        min="0"
                        value={col.limit || ''}
                        placeholder="Без лимита"
                        onChange={(e) => updateWIPLimit(col.status, e.target.value)}
                        className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm text-center font-bold text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm shrink-0">
                      <button 
                        type="button"
                        onClick={() => moveColumn(col.status, 'left')}
                        disabled={idx === 0}
                        className="p-1 px-2 hover:bg-gray-100 rounded text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-xs"
                        title="Сдвинуть левее (вверх)"
                      >
                        ←
                      </button>
                      <button 
                        type="button"
                        onClick={() => moveColumn(col.status, 'right')}
                        disabled={idx === columns.length - 1}
                        className="p-1 px-2 hover:bg-gray-100 rounded text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-xs"
                        title="Сдвинуть правее (вниз)"
                      >
                        →
                      </button>
                    </div>

                    {!col.isCore && (
                      <button 
                        type="button"
                        onClick={() => deleteColumn(col.status)}
                        className="p-2 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100 shrink-0"
                        title="Удалить колонку"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automation Rules triggers */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-zinc-900 text-lg mb-1 flex items-center gap-2">
                Автоматизация и триггеры
                <Sparkles size={16} className="text-yellow-500 animate-pulse" />
              </h3>
              <p className="text-gray-500 text-xs mb-6">
                Настройте автоматические правила для мгновенной обработки событий.
              </p>

              <div className="space-y-5">
                {/* Rule 1 */}
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <span className="text-sm font-bold text-zinc-800 block">Автоназначение Критичности</span>
                    <span className="text-[11px] text-gray-500 leading-relaxed block">
                      Автоматически назначать задачи с наивысшим приоритетом на Team Lead.
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleAutomationRule('autoAssignCritical')}
                    className="text-zinc-800 hover:scale-105 active:scale-95 transition-all shrink-0 mt-1"
                  >
                    {automationRules.autoAssignCritical ? (
                      <ToggleRight size={44} className="text-zinc-950" />
                    ) : (
                      <ToggleLeft size={44} className="text-gray-300" />
                    )}
                  </button>
                </div>

                {/* Rule 2 */}
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <span className="text-sm font-bold text-zinc-800 block">SLA-индикаторы</span>
                    <span className="text-[11px] text-gray-500 leading-relaxed block">
                      Маркировать задачи флагом VDL «Внимание», если они находятся в разработке дольше 48 часов.
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleAutomationRule('highlightSLA')}
                    className="text-zinc-800 hover:scale-105 active:scale-95 transition-all shrink-0 mt-1"
                  >
                    {automationRules.highlightSLA ? (
                      <ToggleRight size={44} className="text-zinc-950" />
                    ) : (
                      <ToggleLeft size={44} className="text-gray-300" />
                    )}
                  </button>
                </div>

                {/* Rule 3 */}
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <span className="text-sm font-bold text-zinc-800 block">Автоархивация выполненных</span>
                    <span className="text-[11px] text-gray-500 leading-relaxed block">
                      Автоматически скрывать задачи из колонки «Готово» через 7 дней.
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleAutomationRule('autoArchiveDone')}
                    className="text-zinc-800 hover:scale-105 active:scale-95 transition-all shrink-0 mt-1"
                  >
                    {automationRules.autoArchiveDone ? (
                      <ToggleRight size={44} className="text-zinc-950" />
                    ) : (
                      <ToggleLeft size={44} className="text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 bg-zinc-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Статус ядра автоматизации</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                АКТИВЕН И СЛУШАЕТ СОБЫТИЯ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: RabbitMQ Live Queue Monitor */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Chart and traffic stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-zinc-900 text-lg mb-1 flex items-center gap-2">
                Поток брокера RabbitMQ
              </h3>
              <p className="text-gray-500 text-xs mb-6">
                Текущие показатели пропускной способности и статус соединения с контейнером `rabbitmq`.
              </p>

              {/* Status Indicator */}
              <div className="mb-6 p-4 bg-zinc-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-bold">Статус брокера:</span>
                  <span className="text-xs font-bold text-green-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold">Активная очередь:</span>
                  <span className="text-xs font-mono font-bold text-zinc-700">victory.events</span>
                </div>
              </div>

              {/* Simulated Gauge */}
              <div className="text-center py-6">
                <span className="text-5xl font-black text-zinc-950 block mb-1">
                  {trafficRate}
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  событий в минуту
                </span>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3">
              <ShieldAlert className="text-indigo-600 shrink-0 mt-0.5" size={20} />
              <div className="text-[11px] text-indigo-900 leading-relaxed">
                <strong>Дедупликация активна:</strong> Сообщения проходят проверку по уникальным `event_id` для предотвращения повторной записи.
              </div>
            </div>
          </div>

          {/* Simulated AMQP live audit log */}
          <div className="md:col-span-2 bg-zinc-950 rounded-2xl shadow-xl border border-zinc-900 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-white text-md flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
                Аудит событий реального времени (AMQP Live)
              </h3>
              <button 
                onClick={() => setLiveLogs(prev => [
                  { id: Date.now(), type: 'SYS', time: new Date().toTimeString().split(' ')[0], msg: 'User manually cleared the audit console.' }
                ])}
                className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <RefreshCw size={12} />
                Очистить
              </button>
            </div>

            {/* Terminal View */}
            <div className="flex-1 bg-zinc-900/90 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-y-auto min-h-[300px] max-h-[380px] space-y-2 border border-zinc-800 custom-scrollbar shadow-inner">
              {liveLogs.map(log => (
                <div key={log.id} className="flex gap-3 hover:bg-zinc-800/40 py-0.5 px-1 rounded transition-colors">
                  <span className="text-zinc-600 shrink-0">{log.time}</span>
                  <span className={`font-bold shrink-0 ${
                    log.type === 'EVENT' ? 'text-green-400' :
                    log.type === 'AMQP' ? 'text-indigo-400' :
                    log.type === 'VDL_WARNING' ? 'text-amber-400' :
                    'text-zinc-500'
                  }`}>{`[${log.type}]`}</span>
                  <span className="text-zinc-200 select-all">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Superuser Account Management Form */}
      {activeTab === 'users' && currentUser?.role === 'Superuser' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* User registration form */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-extrabold text-zinc-900 text-lg mb-1 flex items-center gap-2">
              <UserPlus className="text-zinc-900" size={20} />
              Добавить нового сотрудника
            </h3>
            <p className="text-gray-500 text-xs mb-6">
              Создайте новую учетную запись. Пароль будет автоматически захэширован в PostgreSQL.
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full name */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">ФИО сотрудника *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Например, Анна Смирнова"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Email / Login */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Электронная почта (Логин) *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="anna@victory.ru"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Временный пароль *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Должность сотрудника</label>
                  <input
                    type="text"
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value)}
                    placeholder="Например, UI Designer"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Role Select */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Назначаемая роль в системе</label>
                <div className="flex gap-4">
                  {['User', 'Admin', 'Superuser'].map(role => (
                    <label 
                      key={role} 
                      className={`flex-1 border-2 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                        regRole === role 
                          ? 'border-indigo-500 bg-indigo-50/50 font-bold text-indigo-900 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="text-xs">{role}</span>
                      <input 
                        type="radio" 
                        name="regRole"
                        value={role}
                        checked={regRole === role}
                        onChange={() => setRegRole(role)}
                        className="text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Feedback */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg animate-shake">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg animate-in zoom-in duration-200">
                  🎉 {formSuccess}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xl text-sm transition-all shadow hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Создание аккаунта...' : 'Создать учетную запись'}
                </button>
              </div>
            </form>
          </div>

          {/* Current system users list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-zinc-900 text-lg mb-1 flex items-center gap-2">
                Команда Victory Group
                <Users size={18} className="text-zinc-600" />
              </h3>
              <p className="text-gray-500 text-xs mb-6">
                Текущий список зарегистрированных пользователей.
              </p>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {systemUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full border border-gray-200 shrink-0" 
                      />
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-zinc-800 block truncate">{user.name}</span>
                        <span className="text-[10px] text-zinc-400 block truncate">{user.login}@victory.ru</span>
                      </div>
                    </div>
                    {getRoleBadge(user.role || 'User')}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest pt-4 border-t border-gray-100">
              Всего пользователей: {systemUsers.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
