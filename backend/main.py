# backend/main.py
"""
FastAPI service that powers:
• CSV loading  • quick EDA  • ready-made charts  • baseline ML model
All payloads match the structure already consumed in index.html + app.js.
"""
import io, base64, uuid, textwrap
from typing import Dict, Any

import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score
)

app = FastAPI(title="Ask-Your-Data API")
_DATASETS: Dict[str, pd.DataFrame] = {}       # in-memory registry
_DEFAULT_TITANIC = (
    "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
)


# ---------- helpers ----------------------------------------------------------
def _png(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode()


# ---------- I/O models -------------------------------------------------------
class LoadRequest(BaseModel):
    url: str | None = None


class TrainRequest(BaseModel):
    ds_id: str
    target: str = "Survived"      # keeps UI simple for the demo


# ---------- CRUD -------------------------------------------------------------
@app.post("/load_csv")
def load_csv(req: LoadRequest):
    url = req.url or _DEFAULT_TITANIC
    df = pd.read_csv(url)
    ds_id = str(uuid.uuid4())
    _DATASETS[ds_id] = df

    return {
        "dataset_id": ds_id,
        "total_rows": len(df),
        "columns": df.shape[1],
        "missing": int(df.isna().sum().sum()),
        "dtypes": df.dtypes.astype(str).to_dict(),
    }


@app.get("/describe/{ds_id}")
def describe(ds_id: str):
    if ds_id not in _DATASETS:
        raise HTTPException(404, "dataset not found")
    return _DATASETS[ds_id].describe(include="all").reset_index().to_dict("records")


# ---------- ready-made charts used by homepage -------------------------------
@app.get("/chart/survival_overview/{ds_id}")
def chart_survival_overview(ds_id: str):
    if ds_id not in _DATASETS:
        raise HTTPException(404, "dataset not found")
    df = _DATASETS[ds_id]

    fig, ax = plt.subplots(figsize=(3, 3))
    counts = df["Survived"].value_counts().reindex([0, 1]).fillna(0)
    ax.pie(
        counts,
        labels=["Did not survive", "Survived"],
        colors=["#f4a261", "#2a9d8f"],
        startangle=90,
        wedgeprops={"width": 0.35},
    )
    ax.set_title("Survival Rate Overview")
    return {"png": _png(fig)}


@app.get("/chart/survival_by_class/{ds_id}")
def chart_survival_by_class(ds_id: str):
    if ds_id not in _DATASETS:
        raise HTTPException(404, "dataset not found")
    df = _DATASETS[ds_id]

    fig, ax = plt.subplots()
    sns.countplot(data=df, x="Pclass", hue="Survived",
                  palette=["#f4a261", "#2a9d8f"], ax=ax)
    ax.set_title("Survival by Passenger Class")
    return {"png": _png(fig)}


@app.get("/chart/age_hist/{ds_id}")
def chart_age_hist(ds_id: str):
    if ds_id not in _DATASETS:
        raise HTTPException(404, "dataset not found")
    df = _DATASETS[ds_id]

    fig, ax = plt.subplots()
    sns.histplot(df["Age"].dropna(), bins=25, color="#e63946", ax=ax)
    ax.set_title("Age Distribution")
    return {"png": _png(fig)}


@app.get("/chart/survival_by_gender/{ds_id}")
def chart_survival_by_gender(ds_id: str):
    if ds_id not in _DATASETS:
        raise HTTPException(404, "dataset not found")
    df = _DATASETS[ds_id]

    fig, ax = plt.subplots()
    sns.countplot(data=df, x="Sex", hue="Survived",
                  palette=["#f4a261", "#2a9d8f"], ax=ax)
    ax.set_title("Survival by Gender")
    return {"png": _png(fig)}


# ---------- baseline model ---------------------------------------------------
@app.post("/model/train")
def model_train(req: TrainRequest):
    if req.ds_id not in _DATASETS:
        raise HTTPException(404, "dataset not found")
    df = _DATASETS[req.ds_id]

    X = df.drop(columns=[req.target])
    y = df[req.target]

    num = X.select_dtypes(include=["int64", "float64"]).columns
    cat = X.select_dtypes(include=["object", "category"]).columns

    pre = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num),
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat),
        ]
    )
    mod = Pipeline([
        ("pre", pre),
        ("rf", RandomForestClassifier(
            n_estimators=200, max_depth=8, random_state=42))
    ])

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    mod.fit(X_tr, y_tr)
    pred = mod.predict(X_te)

    return {
        "accuracy": accuracy_score(y_te, pred),
        "precision": precision_score(y_te, pred),
        "recall": recall_score(y_te, pred),
        "f1": f1_score(y_te, pred),
    }
