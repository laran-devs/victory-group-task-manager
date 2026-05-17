from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        # Map project_id (as string) to a list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: str):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)

    def disconnect(self, websocket: WebSocket, project_id: str):
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def broadcast_to_project(self, project_id: str, message: dict):
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast_global(self, message: dict):
        for connections in self.active_connections.values():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

router = APIRouter()

@router.websocket("/ws/tasks")
async def websocket_endpoint(websocket: WebSocket, project_id: str = "global"):
    await manager.connect(websocket, project_id)
    try:
        while True:
            # Keep connection open, handle client heartbeats or messages if any
            data = await websocket.receive_text()
            # For now, we just echo back or ignore
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
