import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useProjectStore } from '../store/useProjectStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const AddTaskModal = () => {
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const isOpen = useTaskStore((state) => state.isAddTaskModalOpen);
  const onClose = useTaskStore((state) => state.closeAddTaskModal);
  const defaultStatus = useTaskStore((state) => state.defaultNewTaskStatus);
  const editingTask = useTaskStore((state) => state.editingTask);
  const users = useTaskStore((state) => state.users);
  const currentUser = useTaskStore((state) => state.currentUser);
  const columns = useTaskStore((state) => state.columns);
  
  const projects = useProjectStore((state) => state.projects);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const selectedProject = useProjectStore((state) => state.selectedProject);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus || 'TO_DO',
    priority: 'Средний',
    assigneeId: currentUser?.id || '1',
    tags: [],
    deadline: new Date().toISOString().split('T')[0],
    project_id: selectedProject?.id || ''
  });

  // Fetch projects on load if empty
  React.useEffect(() => {
    if (isOpen && projects.length === 0) {
      fetchProjects();
    }
  }, [isOpen, projects.length, fetchProjects]);

  // Сброс формы при открытии модалки, установка нужного статуса колонки
  React.useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setFormData({
          title: editingTask.title || '',
          description: editingTask.description || '',
          status: editingTask.status || 'TO_DO',
          priority: editingTask.priority || 'Средний',
          assigneeId: editingTask.assigneeId || editingTask.assignee_id || '1',
          tags: editingTask.tags || [],
          deadline: editingTask.deadline 
            ? new Date(editingTask.deadline).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
          project_id: editingTask.project_id || ''
        });
        setTagInput('');
      } else {
        setFormData({
          title: '',
          description: '',
          status: defaultStatus || 'TO_DO',
          priority: 'Средний',
          assigneeId: currentUser?.id || '1',
          tags: [],
          deadline: new Date().toISOString().split('T')[0],
          project_id: selectedProject?.id || (projects[0]?.id || '')
        });
        setTagInput('');
      }
    }
  }, [isOpen, defaultStatus, editingTask, selectedProject, projects]);

  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    if (editingTask) {
      updateTask(editingTask.id, formData);
    } else {
      addTask(formData);
    }
    
    onClose();
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.startsWith('#') ? tagInput : `#${tagInput}`;
      if (!formData.tags.includes(newTag)) {
        setFormData({ ...formData, tags: [...formData.tags, newTag] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-zinc-900">
            {editingTask ? 'Редактировать задачу' : 'Новая задача'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Название задачи</label>
            <input 
              autoFocus
              type="text"
              required
              placeholder="Например: Обновить UI-кит"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Описание</label>
            <textarea 
              rows={3}
              placeholder="Опишите детали задачи..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Проект <span className="text-red-500">*</span></label>
            <select 
              required
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer text-zinc-800"
              value={formData.project_id}
              onChange={(e) => setFormData({...formData, project_id: e.target.value})}
            >
              <option value="" disabled>Выберите проект...</option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>{proj.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Статус</label>
              <select 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer text-zinc-800 font-medium"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                {columns.map(col => (
                  <option key={col.status} value={col.status}>{col.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Приоритет</label>
              <select 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="Низкий">Низкий</option>
                <option value="Средний">Средний</option>
                <option value="Высокий">Высокий</option>
                <option value="Критический">Критический</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Дедлайн</label>
              <input 
                type="date"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Исполнитель</label>
              <select 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                value={formData.assigneeId}
                onChange={(e) => setFormData({...formData, assigneeId: e.target.value})}
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Теги (Enter для добавления)</label>
            <input 
              type="text"
              placeholder="SEO, Development, Medical..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-md border border-indigo-100">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-800">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
            >
              {editingTask ? 'Сохранить изменения' : 'Создать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
