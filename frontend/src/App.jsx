import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import { Projects, Clients } from './pages/OtherPages';
import { NotificationToast } from './components/NotificationToast';
import { simulateIncomingEvents } from './services/socket';
import { useTaskStore } from './store/useTaskStore';
import { LoginScreen } from './pages/LoginScreen';

function App() {
  const handleServerEvent = useTaskStore((state) => state.handleServerEvent);
  const initAuth = useTaskStore((state) => state.initAuth);
  const currentUser = useTaskStore((state) => state.currentUser);

  useEffect(() => {
    // Try to restore session from token
    initAuth();

    // Initialize WebSocket simulation
    const cleanup = simulateIncomingEvents((event) => {
      handleServerEvent(event);
    });

    return cleanup;
  }, [handleServerEvent, initAuth]);

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
          <Route path="/clients" element={<Clients />} />
          <Route path="/team" element={<div className="p-8">Раздел Команда</div>} />
          <Route path="/reports" element={<div className="p-8">Раздел Отчеты</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
      <NotificationToast />
    </Router>
  );
}

export default App;
