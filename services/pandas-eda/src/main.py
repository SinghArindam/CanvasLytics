from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from . import tools

# --- Pydantic Models for Request/Response Validation ---

class EdaPayload(BaseModel):
    # 'data' is a list of records, like what pandas df.to_dict('records') produces
    data: List[Dict[str, Any]]
    
class ChartRequestPayload(EdaPayload):
    chart_type: str
    # Optional parameters for specific charts
    params: Dict[str, Any] = {}

# --- FastAPI Application ---

app = FastAPI(
    title="CanvasLytics EDA Service",
    description="A microservice for performing Exploratory Data Analysis with Pandas and Seaborn.",
    version="1.0.0",
)

@app.get("/", tags=["Health Check"])
async def read_root():
    """Root endpoint for health checks."""
    return {"status": "ok", "message": "Pandas-EDA service is running"}

@app.post("/summarize", tags=["EDA"])
async def get_summary(payload: EdaPayload):
    """
    Receives a dataset and returns a high-level summary.
    """
    try:
        df = tools.dataframe_from_payload(payload.dict())
        summary = tools.get_dataset_summary(df)
        return {"status": "success", "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/initial-visualizations", tags=["Visualizations"])
async def create_initial_visualizations(payload: EdaPayload):
    """
    Generates a set of default visualizations for a given dataset.
    """
    try:
        df = tools.dataframe_from_payload(payload.dict())
        charts = []

        # Generate a correlation heatmap for all numeric columns
        try:
            heatmap_b64 = tools.generate_correlation_heatmap(df)
            charts.append({
                "chart_name": "Correlation Heatmap",
                "chart_type": "heatmap",
                "image_base64": heatmap_b64
            })
        except ValueError as e:
            print(f"Skipping heatmap: {e}")

        # Generate histograms for numeric columns
        numeric_cols = df.select_dtypes(include=['number']).columns
        for col in numeric_cols:
            hist_b64 = tools.generate_histogram(df, col)
            charts.append({
                "chart_name": f"Distribution of {col}",
                "chart_type": "histogram",
                "column": col,
                "image_base64": hist_b64
            })
            
        return {"status": "success", "charts": charts}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/generate-chart", tags=["Visualizations"])
async def generate_single_chart(payload: ChartRequestPayload):
    """
    Generates a single, specified chart.
    """
    try:
        df = tools.dataframe_from_payload(payload.dict())
        chart_type = payload.chart_type
        params = payload.params
        column = params.get("column")

        if not column:
            raise ValueError("Parameter 'column' is required for chart generation.")

        if chart_type == "histogram":
            image_b64 = tools.generate_histogram(df, column)
        elif chart_type == "bar_chart":
            image_b64 = tools.generate_bar_chart(df, column)
        else:
            raise HTTPException(status_code=400, detail=f"Chart type '{chart_type}' not supported.")

        return {
            "status": "success",
            "chart_info": {
                "chart_name": f"{chart_type.replace('_', ' ').title()} of {column}",
                "chart_type": chart_type,
                "column": column,
                "image_base64": image_b64,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))