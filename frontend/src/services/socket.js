/**
 * WebSocket Simulation Service
 * In production, this will use socket.io-client to connect to the FastAPI backend.
 * For now, it simulates incoming events from the server/analytics engine.
 */

export const simulateIncomingEvents = (onEvent) => {
  console.log('🔌 WebSocket Simulation Started');

  const eventTypes = [
    {
      type: 'TASK_UPDATED',
      payload: {
        id: 'VT-101',
        status: 'In Progress',
        message: 'Бэкенд-разработчик начал работу над модулем'
      }
    },
    {
      type: 'VDL_ALERT',
      payload: {
        id: 'VT-103',
        vdlEvent: {
          type: 'ROI',
          message: 'ROI Критическое снижение -15%',
          severity: 'critical'
        }
      }
    },
    {
      type: 'NEW_TASK',
      payload: {
        id: `VT-${Math.floor(Math.random() * 1000)}`,
        title: 'Срочный аудит безопасности',
        description: 'Система зафиксировала подозрительную активность в модуле Victory ID',
        status: 'To Do',
        priority: 'Критический',
        tags: ['#Security'],
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 86400000).toISOString(),
        vdlEvent: null
      }
    }
  ];

  // Trigger a random event every 20-30 seconds to simulate real-time traffic
  const interval = setInterval(() => {
    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    console.log('📡 Incoming WS Event:', randomEvent);
    onEvent(randomEvent);
  }, 25000);

  return () => clearInterval(interval);
};
