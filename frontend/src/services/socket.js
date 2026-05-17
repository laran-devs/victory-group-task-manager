/**
 * WebSocket Connection & Simulation Service
 * Automatically connects to the live FastAPI WebSocket endpoint in production or development.
 * If the connection fails or isn't available, it falls back to the simulation to ensure the UI works.
 */

export const simulateIncomingEvents = (onEvent) => {
  console.log('🔌 WebSocket Service Initialized');

  let socket = null;
  let simulatedInterval = null;
  let isConnected = false;

  // Determine correct WebSocket URL
  const isDevPort = window.location.port === '5173';
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = isDevPort
    ? 'ws://localhost:8000/ws/tasks?project_id=global'
    : `${wsProtocol}//${window.location.host}/ws/tasks?project_id=global`;

  const connectRealWebSocket = () => {
    try {
      console.log(`🔌 Attempting WebSocket connection to: ${wsUrl}`);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('🚀 Live WebSocket Connection Established!');
        isConnected = true;
        if (simulatedInterval) {
          clearInterval(simulatedInterval);
          simulatedInterval = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 Live WS Event Received:', data);
          onEvent(data);
        } catch (err) {
          console.error('❌ Failed to parse live WS message:', err);
        }
      };

      socket.onclose = (event) => {
        console.log('🔌 Live WebSocket Connection Closed:', event.reason || 'No reason');
        isConnected = false;
        // Start simulation fallback if not already running
        startSimulationFallback();
        // Reconnect attempt after 10 seconds
        setTimeout(connectRealWebSocket, 10000);
      };

      socket.onerror = (err) => {
        console.warn('⚠️ WebSocket encountered an error. Falling back to simulation.', err);
        isConnected = false;
      };
    } catch (e) {
      console.error('❌ Failed to create WebSocket connection:', e);
      startSimulationFallback();
    }
  };

  const startSimulationFallback = () => {
    if (simulatedInterval) return;

    console.log('🕹️ Starting Mock WebSocket Simulation');
    const eventTypes = [
      {
        type: 'TASK_UPDATED',
        payload: {
          id: 'VT-101',
          status: 'IN_PROGRESS',
          message: 'Бэкенд-разработчик начал работу над модулем'
        }
      },
      {
        type: 'VDL_ALERT',
        payload: {
          id: 'VT-103',
          message: 'ROI Критическое снижение -15%',
          severity: 'critical'
        }
      },
      {
        type: 'NEW_TASK',
        payload: {
          id: `VT-${Math.floor(Math.random() * 100 + 200)}`,
          title: 'Срочный аудит безопасности',
          description: 'Система зафиксировала подозрительную активность в модуле Victory ID',
          status: 'TO_DO',
          priority: 'Критический',
          tags: ['#Security'],
          createdAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 86400000).toISOString(),
          vdlEvent: null
        }
      }
    ];

    simulatedInterval = setInterval(() => {
      if (isConnected) return;
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      // Randomize target task for VDL alert from existing mocked tasks
      if (randomEvent.type === 'VDL_ALERT') {
        const mockTaskIds = ['VT-101', 'VT-102', 'VT-103', 'VT-105'];
        randomEvent.payload.id = mockTaskIds[Math.floor(Math.random() * mockTaskIds.length)];
      }
      console.log('📡 Simulated WS Event:', randomEvent);
      onEvent(randomEvent);
    }, 25000);
  };

  // Start both: attempt live WebSocket, and set up fallback in case it fails to connect
  connectRealWebSocket();
  startSimulationFallback();

  return () => {
    if (socket) {
      socket.close();
    }
    if (simulatedInterval) {
      clearInterval(simulatedInterval);
    }
  };
};
