from typing import List
from fastapi import WebSocket, WebSocketDisconnect
from .agent_orchestrator import AgentOrchestrator

class ConnectionManager:
    """Manages active WebSocket connections."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.orchestrator = AgentOrchestrator()

    async def connect(self, websocket: WebSocket):
        """Accepts a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"New client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Removes a WebSocket connection."""
        self.active_connections.remove(websocket)
        print(f"Client disconnected. Total clients: {len(self.active_connections)}")

    async def handle_message(self, websocket: WebSocket, message: str):
        """
        Receives a message, processes it with the orchestrator, 
        and sends the result back to the client.
        """
        print(f"Received message: {message}")
        result = await self.orchestrator.process_user_request(message)
        await websocket.send_json(result)
        print(f"Sent response: {result}")

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    The main WebSocket endpoint that clients connect to.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Wait for a message from the client
            message = await websocket.receive_text()
            await manager.handle_message(websocket, message)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"Client #{client_id} disconnected.")