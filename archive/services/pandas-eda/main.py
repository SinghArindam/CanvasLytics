# services/pandas-eda/main.py
import io, uuid, base64
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

DATASETS: dict[str, pd.DataFrame] = {}   # in-memory cache

class LoadRequest(BaseModel):
    url: str | None = None     # optional custom CSV
    name: str = "titanic"

app = FastAPI(title="pandas-eda")

TITANIC_CSV = (
    "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
)

# ---------- helpers ----------------------------------------------------------
def _df_to_json(df: pd.DataFrame) -> list[dict]:
    return df.reset_index().to_dict(orient="records")

def _fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode()

# ---------- endpoints --------------------------------------------------------
@app.post("/load_csv")
def load_csv(req: LoadRequest):
    url = req.url or TITANIC_CSV
    df = pd.read_csv(url)
    ds_id = str(uuid.uuid4())
    DATASETS[ds_id] = df
    meta = {
        "dataset_id": ds_id,
        "shape": df.shape,
        "dtypes": df.dtypes.astype(str).to_dict(),
        "missing": df.isna().sum().to_dict(),
    }
    return meta

@app.get("/describe/{ds_id}")
def describe(ds_id: str):
    if ds_id not in DATASETS:
        raise HTTPException(404, "dataset not found")
    return _df_to_json(DATASETS[ds_id].describe(include="all"))

@app.get("/missing/{ds_id}")
def missing(ds_id: str):
    if ds_id not in DATASETS:
        raise HTTPException(404, "dataset not found")
    s = DATASETS[ds_id].isna().sum().sort_values(ascending=False)
    return s.to_dict()

@app.get("/plot/hist/{ds_id}")
def hist(
    ds_id: str,
    column: str = Query(..., description="numeric column to plot"),
    bins: int = 30,
):
    if ds_id not in DATASETS:
        raise HTTPException(404, "dataset not found")
    df = DATASETS[ds_id]
    if column not in df:
        raise HTTPException(400, "column not found")
    fig, ax = plt.subplots()
    sns.histplot(df[column].dropna(), bins=bins, ax=ax, kde=False, color="#21808d")
    ax.set_title(f"{column} distribution")
    return {"png": _fig_to_base64(fig)}
