# services/sklearn-lab/main.py
import joblib, uuid, tempfile, base64, io
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.ensemble import RandomForestClassifier

DATASETS: dict[str, pd.DataFrame] = {}

app = FastAPI(title="sklearn-lab")

class TrainRequest(BaseModel):
    csv_url: str | None = None
    ds_id: str | None = None  # alternative: pass existing cache key
    target: str
    max_depth: int | None = 8
    n_estimators: int = 200

@app.post("/train_model")
def train(req: TrainRequest):
    # --- grab dataframe ------------------------------------------------------
    if req.ds_id:
        if req.ds_id not in DATASETS:
            raise HTTPException(404, "dataset not found")
        df = DATASETS[req.ds_id]
    else:
        url = req.csv_url or (
            "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
        )
        df = pd.read_csv(url)
        req.ds_id = str(uuid.uuid4())
        DATASETS[req.ds_id] = df

    y = df[req.target]
    X = df.drop(columns=[req.target])

    num_cols = X.select_dtypes(include=["int64", "float64"]).columns
    cat_cols = X.select_dtypes(include=["object"]).columns

    pre = ColumnTransformer(
        [
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=req.n_estimators, max_depth=req.max_depth, random_state=42
    )

    pipe = Pipeline([("pre", pre), ("rf", model)])
    pipe.fit(X, y)

    # --- metrics -------------------------------------------------------------
    pred = pipe.predict(X)
    prob = pipe.predict_proba(X)[:, 1]
    acc = accuracy_score(y, pred)
    auc = roc_auc_score(y, prob)

    # --- feature importance helper-------------------------------------------
    rf = pipe.named_steps["rf"]
    feat_names = (
        list(num_cols)
        + list(pipe.named_steps["pre"]
                .named_transformers_["cat"]
                .get_feature_names_out(cat_cols))
    )
    importances = dict(
        sorted(
            zip(feat_names, rf.feature_importances_),
            key=lambda t: t[1],
            reverse=True,
        )[:15]
    )

    # --- persist model -------------------------------------------------------
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".joblib")
    joblib.dump(pipe, tmp.name)

    with open(tmp.name, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    return {
        "dataset_id": req.ds_id,
        "accuracy": acc,
        "roc_auc": auc,
        "feature_importance": importances,
        "model_b64": b64,
    }
