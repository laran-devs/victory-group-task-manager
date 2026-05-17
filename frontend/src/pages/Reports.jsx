import React, { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, TrendingUp, Clock, CheckCircle2, Users, Loader2 } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { useTaskStore } from '../store/useTaskStore';

export const Reports = () => {
  const projects = useProjectStore((state) => state.projects);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const downloadProjectReport = useProjectStore((state) => state.downloadProjectReport);
  
  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const addNotification = useTaskStore((state) => state.addNotification);

  const selectedProject = useProjectStore((state) => state.selectedProject);
  const setSelectedProject = useProjectStore((state) => state.setSelectedProject);
  const selectedProjectId = selectedProject ? selectedProject.id : 'all';

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchProjects();
      await fetchTasks();
    };
    init();
  }, [fetchProjects, fetchTasks]);

  const activeProject = selectedProject || null;


  // Calculate dynamic metrics based on the tasks inside selected project
  // Fallback to default mock if no tasks
  const projectTasks = tasks.filter(t => t.projectId === selectedProjectId || t.project_id === selectedProjectId || selectedProjectId === 'all');
  const completedTasks = projectTasks.filter(t => t.status === 'DONE');
  const taskCount = projectTasks.length;
  const progressPercent = taskCount > 0 ? Math.round((completedTasks.length / taskCount) * 100) : (activeProject?.id === 'all' ? 65 : 0);
  
  // Hours calculated dynamically: completed task is 8 hours, in progress is 4 hours
  const inProgressTasks = projectTasks.filter(t => t.status === 'IN_PROGRESS');
  const hoursSpent = (completedTasks.length * 8) + (inProgressTasks.length * 4) || (activeProject?.id === 'all' ? 48 : 0);

  // Members count based on unique assignees, minimum 1
  const uniqueAssigneeIds = new Set(projectTasks.map(t => t.assigneeId || t.assignee_id).filter(Boolean));
  const membersCount = uniqueAssigneeIds.size || 1;

  const handleDownload = async (format) => {
    if (!selectedProjectId) return;
    const setLoader = format === 'pdf' ? setDownloadingPdf : setDownloadingExcel;
    
    setLoader(true);
    try {
      await downloadProjectReport(selectedProjectId, format);
      addNotification('Отчет успешно скачан!', 'success');
    } catch (error) {
      console.error(`Failed to download ${format} report:`, error);
      addNotification('Ошибка при скачивании отчета', 'error');
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[80vh] bg-white text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Отчеты и аналитика</h1>
          <p className="text-zinc-500 font-medium mt-1">Экспорт документов и анализ эффективности проектов</p>
        </div>
        
        {/* Project Selector */}
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Проект:</span>
          <select 
            className="bg-transparent border-none text-zinc-800 font-bold text-sm outline-none cursor-pointer focus:ring-0 pr-8"
            value={selectedProjectId}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all') {
                setSelectedProject(null);
              } else {
                const found = projects.find(p => p.id === val);
                if (found) setSelectedProject(found);
              }
              setTimeout(() => fetchTasks(), 0);
            }}
          >
            <option value="all" className="font-bold text-zinc-800">Все проекты</option>
            {projects.map(p => (
              <option key={p.id} value={p.id} className="font-bold text-zinc-800">
                {p.title || p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Progress Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-zinc-400">Прогресс проекта</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-zinc-950 mb-3">{progressPercent}%</h3>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Hours Spent Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-zinc-400">Затрачено часов</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-zinc-950 mb-1">{hoursSpent} ч.</h3>
          <p className="text-xs text-gray-500 font-semibold mt-2">На основе закрытых задач</p>
        </div>

        {/* Tasks Solved Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-zinc-400">Решено задач</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-zinc-950 mb-1">
            {completedTasks.length} / {taskCount}
          </h3>
          <p className="text-xs text-gray-500 font-semibold mt-2">Выполнено от общего числа</p>
        </div>

        {/* Members Count Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-zinc-400">Участников</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-zinc-950 mb-1">{membersCount}</h3>
          <p className="text-xs text-gray-500 font-semibold mt-2">Активные исполнители</p>
        </div>
      </div>

      {/* Export Documents Panel */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-zinc-900">Экспорт документов</h2>
          <p className="text-zinc-500 text-sm mt-1">Сформируйте и скачайте отчетность по проекту в нужном формате</p>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
          <div className="max-w-2xl text-sm leading-relaxed text-zinc-600 font-medium">
            <p className="mb-2">
              <strong>PDF-отчет:</strong> Содержит красивую визуализацию с графиками KPI, сводкой закрытых задач, списком исполнителей и критическими инцидентами аналитики VDL. Подходит для отправки клиентам.
            </p>
            <p>
              <strong>Excel-таблица:</strong> Выгружает детальный реестр задач с датами, дедлайнами, оценками времени, приоритетами и комментариями для углубленного анализа в электронных таблицах.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            {/* PDF Download Button */}
            <button 
              onClick={() => handleDownload('pdf')}
              disabled={downloadingPdf || downloadingExcel}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold px-6 py-3.5 rounded-xl shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm outline-none"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Генерация PDF...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Скачать PDF-отчет
                </>
              )}
            </button>

            {/* Excel Download Button */}
            <button 
              onClick={() => handleDownload('xlsx')}
              disabled={downloadingPdf || downloadingExcel}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold px-6 py-3.5 rounded-xl shadow-sm hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm outline-none"
            >
              {downloadingExcel ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Генерация Excel...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={18} />
                  Скачать Excel-сводку
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
