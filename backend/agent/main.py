import asyncio
import json
import uuid
from typing import Dict

import pandas as pd
import requests
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# --- Configuration ---
EDA_SERVICE_URL = "http://127.0.0.1:8001"
SKLEARN_SERVICE_URL = "http://127.0.0.1:8002"

# --- In-Memory Session Storage ---
# In a production environment, use a proper database or cache like Redis.
sessions: Dict[str, Dict] = {}

# --- FastAPI App ---
app = FastAPI(title="CanvasLytics Agent")

# --- CORS Middleware ---
# This is the crucial part that fixes the "404 Not Found" on OPTIONS requests.
# It tells the agent to accept requests from your React frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    """Manages active WebSocket connections."""
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        sessions[session_id] = {"dataframe": None}
        print(f"New session connected: {session_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in sessions:
            del sessions[session_id]
        print(f"Session disconnected: {session_id}")

    async def send_json(self, data: dict, session_id: str):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(data)

manager = ConnectionManager()

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    session_id = str(uuid.uuid4())
    await manager.connect(websocket, session_id)

    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received command from {session_id}: {data}")
            # Simple command parsing
            command_parts = data.lower().split()
            command = command_parts[0]

            response_data = {"status": "error", "message": "Unknown command"}

            try:
                # --- EDA Commands ---
                if command == "load" and "titanic" in command_parts:
                    response_data = requests.get(f"{EDA_SERVICE_URL}/load-titanic").json()
                    df = pd.read_json(response_data["dataframe"])
                    sessions[session_id]["dataframe"] = df
                    # Send only summary, not the whole dataframe
                    response_data["summary"] = json.loads(df.head().to_json(orient="records"))

                elif command == "histogram" and sessions[session_id]["dataframe"] is not None:
                    column = command_parts[-1] # e.g., "histogram of age"
                    df_json = sessions[session_id]["dataframe"].to_json()
                    res = requests.post(f"{EDA_SERVICE_URL}/histogram", json={"dataframe": df_json, "column": column})
                    response_data = res.json()

                elif command == "heatmap" and sessions[session_id]["dataframe"] is not None:
                    df_json = sessions[session_id]["dataframe"].to_json()
                    res = requests.post(f"{EDA_SERVICE_URL}/correlation-heatmap", json={"dataframe": df_json})
                    response_data = res.json()
                
                # --- Scikit-learn Commands (Simplified) ---
                elif command == "train" and "titanic" in command_parts:
                    # A simplified hardcoded pipeline for demo purposes
                    pipeline_config = {
                        "features": ["pclass", "sex", "age", "sibsp", "parch", "fare"],
                        "target": "survived",
                        "model": "LogisticRegression"
                    }
                    df_json = sessions[session_id]["dataframe"].to_json()
                    res = requests.post(
                        f"{SKLEARN_SERVICE_URL}/train-model", 
                        json={"dataframe": df_json, "pipeline_config": pipeline_config}
                    )
                    response_data = res.json()
                    if response_data.get("status") == "success":
                        # Store model id for potential download
                        sessions[session_id]["model_id"] = response_data.get("model_id")


            except Exception as e:
                response_data = {"status": "error", "message": f"Failed to execute command: {str(e)}"}

            await manager.send_json(response_data, session_id)

    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        print(f"An error occurred in session {session_id}: {e}")
        manager.disconnect(session_id)


if __name__ == "__main__":
    import uvicorn
    print("Starting Agent/Orchestrator on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)