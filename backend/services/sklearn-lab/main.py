import uuid
from typing import Dict, List
import joblib
import pandas as pd
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

app = FastAPI(title="Scikit-learn Lab Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory model storage ---
# In production, use a dedicated model registry or cloud storage.
trained_models: Dict[str, Pipeline] = {}

# --- Request Models ---
class PipelineConfig(BaseModel):
    features: List[str]
    target: str
    model: str # e.g., "LogisticRegression"

class TrainRequest(BaseModel):
    dataframe: str
    pipeline_config: PipelineConfig

# --- API Endpoints ---
@app.post("/train-model")
def train_model(request: TrainRequest):
    """Builds a pipeline, trains a model, and returns metrics."""
    try:
        df = pd.read_json(request.dataframe, orient="split")
        config = request.pipeline_config

        # --- Data Preprocessing ---
        # Handle missing 'Age' values common in Titanic dataset
        if 'age' in df.columns:
            df['age'].fillna(df['age'].median(), inplace=True)
        # Handle missing 'Fare'
        if 'fare' in df.columns:
             df['fare'].fillna(df['fare'].median(), inplace=True)

        # Separate features and target
        X = df[config.features]
        y = df[config.target]

        # Identify categorical and numerical features
        categorical_features = X.select_dtypes(include=['object', 'category']).columns
        numerical_features = X.select_dtypes(include=['int64', 'float64']).columns

        # --- Pipeline Creation ---
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())])

        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))])

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numerical_features),
                ('cat', categorical_transformer, categorical_features)])

        # Select model based on config
        if config.model == "LogisticRegression":
            model = LogisticRegression(max_iter=1000)
        else:
            return {"status": "error", "message": f"Model '{config.model}' not supported."}

        # Create the full pipeline
        pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', model)])

        # --- Training & Evaluation ---
        X_train, X_test, y_train, y_test = train_test_2_split(X, y, test_size=0.2, random_state=42)
        pipeline.fit(X_train, y_train)
        accuracy = pipeline.score(X_test, y_test)

        # --- Save Model ---
        model_id = str(uuid.uuid4())
        trained_models[model_id] = pipeline

        return {
            "status": "success",
            "message": "Model trained successfully.",
            "model_id": model_id,
            "metrics": {
                "accuracy": accuracy
            },
            # Provide URL to download the model artifact
            "download_url": f"/download-model/{model_id}" 
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/download-model/{model_id}")
def download_model_artifact(model_id: str):
    """Serves the trained model file for download."""
    if model_id in trained_models:
        model_path = f"/tmp/{model_id}.joblib"
        joblib.dump(trained_models[model_id], model_path)
        
        with open(model_path, "rb") as f:
            return Response(
                content=f.read(),
                media_type="application/octet-stream",
                headers={"Content-Disposition": f"attachment; filename=model_{model_id}.joblib"}
            )
    return {"status": "error", "message": "Model not found."}


if __name__ == "__main__":
    import uvicorn
    print("Starting Scikit-learn Lab Microservice on http://127.0.0.1:8002")
    uvicorn.run(app, host="127.0.0.1", port=8002)