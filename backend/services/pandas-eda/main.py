import json
import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Pandas EDA Microservice")

# --- Models for request bodies ---
class DataFrameRequest(BaseModel):
    dataframe: str # JSON string of the DataFrame

class HistogramRequest(BaseModel):
    dataframe: str
    column: str

# --- API Endpoints ---
@app.get("/load-titanic")
def load_titanic_dataset():
    """Loads the Titanic dataset from a public URL."""
    try:
        # Using a reliable URL for the Titanic dataset
        url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
        df = pd.read_csv(url)
        return {
            "status": "success",
            "message": "Titanic dataset loaded successfully.",
            "dataframe": df.to_json(orient="split"),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/histogram")
def get_histogram(request: HistogramRequest):
    """Generates data for a histogram plot."""
    try:
        df = pd.read_json(request.dataframe, orient="split")
        column = request.column
        if column not in df.columns:
            return {"status": "error", "message": f"Column '{column}' not found."}

        # Remove nulls for plotting
        clean_data = df[column].dropna()
        
        # Generate histogram data
        counts, bin_edges = np.histogram(clean_data, bins=20)

        return {
            "status": "success",
            "type": "histogram",
            "data": {
                "labels": [f"{edge:.1f}" for edge in bin_edges[:-1]],
                "values": counts.tolist(),
            },
            "column": column,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/correlation-heatmap")
def get_correlation_heatmap(request: DataFrameRequest):
    """Calculates the correlation matrix for numeric columns."""
    try:
        df = pd.read_json(request.dataframe, orient="split")
        # Select only numeric columns for correlation
        numeric_df = df.select_dtypes(include=np.number)
        corr_matrix = numeric_df.corr()
        
        # Format for a heatmap visualization library
        heatmap_data = {
            "columns": corr_matrix.columns.tolist(),
            "data": corr_matrix.values.tolist(),
        }

        return {
            "status": "success",
            "type": "heatmap",
            "data": heatmap_data,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("Starting Pandas EDA Microservice on http://127.0.0.1:8001")
    uvicorn.run(app, host="127.0.0.1", port=8001)