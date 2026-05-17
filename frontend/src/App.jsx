import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { NotificationToast } from './components/NotificationToast';
import { simulateIncomingEvents } from './services/socket';
import { useTaskStore } from './store/useTaskStore';
import { LoginScreen } from './pages/LoginScreen';
import { Team } from './pages/Team';
import AdminPanel from './pages/AdminPanel';

function App() {
  const handleServerEvent = useTaskStore((state) => state.handleServerEvent);
  const initAuth = useTaskStore((state) => state.initAuth);
  const currentUser = useTaskStore((state) => state.currentUser);
  const isAuthLoading = useTaskStore((state) => state.isAuthLoading);

  useEffect(() => {
    // Try to restore session from token
    initAuth();

    // Initialize WebSocket simulation
    const cleanup = simulateIncomingEvents((event) => {
      handleServerEvent(event);
    });

    return cleanup;
  }, [handleServerEvent, initAuth]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-zinc-400 font-bold text-sm tracking-wide">Инициализация сессии Victory Tasks...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/team" element={<Team />} />
          {(currentUser.role === 'Admin' || currentUser.role === 'Superuser') && (
            <Route path="/admin" element={<AdminPanel />} />
          )}
          <Route path="/reports" element={<div className="p-8">Раздел Отчеты</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
      <NotificationToast />
    </Router>
  );
}

export default App;
