from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from . import pipelines

# --- Pydantic Models for Request/Response Validation ---

class TrainRequestPayload(BaseModel):
    data: List[Dict[str, Any]]
    features: List[str]
    target: str
    model_name: str
    task_type: str = "classification" # Can be 'classification' or 'regression'

# --- FastAPI Application ---

app = FastAPI(
    title="CanvasLytics ML Lab Service",
    description="A microservice for training Scikit-learn models.",
    version="1.0.0",
)

@app.get("/", tags=["Health Check"])
async def read_root():
    """Root endpoint for health checks."""
    return {"status": "ok", "message": "Scikit-learn Lab service is running"}

@app.post("/train", tags=["Machine Learning"])
async def train_model(payload: TrainRequestPayload):
    """
    Receives data and training parameters, builds a pipeline,
    trains a model, and returns the evaluation metrics and model artifact.
    """
    try:
        # Convert incoming data to a DataFrame
        df = pd.DataFrame(payload.data)
        
        # Call the training pipeline
        result = pipelines.train_model_pipeline(
            df=df,
            features=payload.features,
            target=payload.target,
            model_name=payload.model_name,
            task_type=payload.task_type
        )
        
        return {"status": "success", "result": result}
        
    except ValueError as e:
        # Handle known errors like missing columns or unsupported models
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle unexpected errors during training
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")