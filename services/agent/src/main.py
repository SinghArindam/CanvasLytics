from fastapi import FastAPI, WebSocket
from .websocket_handler import websocket_endpoint

# Create the FastAPI app instance
app = FastAPI(
    title="CanvasLytics Agent Orchestrator",
    description="Handles client communication and orchestrates calls to backend microservices.",
    version="1.0.0"
)

@app.get("/", tags=["Health Check"])
async def read_root():
    """
    Root endpoint for health checks.
    """
    return {"status": "ok", "message": "Agent service is running"}

@app.websocket("/ws/{client_id}")
async def ws_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket route for real-time communication with the client.
    The client_id can be used to manage sessions.
    """
    await websocket_endpoint(websocket, client_id)