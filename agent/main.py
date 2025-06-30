# agent/main.py
import os, httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

EDA_HOST = os.getenv("EDA_HOST", "http://localhost:8001")
ML_HOST  = os.getenv("ML_HOST",  "http://localhost:8002")

app = FastAPI(title="Ask-Your-Data agent")

client = httpx.AsyncClient(timeout=60)

# ---------- NL prompt schema -----------------------------------------------
class NLQuery(BaseModel):
    question: str
    dataset_id: str | None = None   # allow UI to pin to a dataset

# very naive routing
def classify(q: str) -> str:
    q = q.lower()
    if "model" in q or "predict" in q:
        return "model"
    if any(w in q for w in ["age", "hist", "plot", "distribution"]):
        return "hist"
    if any(w in q for w in ["missing", "null"]):
        return "missing"
    return "describe"

# ---------- endpoints -------------------------------------------------------
@app.post("/chat")
async def chat(req: NLQuery):
    intent = classify(req.question)
    if intent == "describe":
        if not req.dataset_id:
            raise HTTPException(400, "dataset_id required")
        r = await client.get(f"{EDA_HOST}/describe/{req.dataset_id}")
        return r.json()

    if intent == "missing":
        r = await client.get(f"{EDA_HOST}/missing/{req.dataset_id}")
        return r.json()

    if intent == "hist":
        # very naive column extraction
        col = (
            req.question.replace("plot", "")
            .replace("distribution", "")
            .strip()
            .split()[-1]
        )
        r = await client.get(
            f"{EDA_HOST}/plot/hist/{req.dataset_id}",
            params={"column": col},
        )
        return r.json()

    if intent == "model":
        body = {
            "ds_id": req.dataset_id,
            "target": "Survived",
        }
        r = await client.post(f"{ML_HOST}/train_model", json=body)
        return r.json()

    raise HTTPException(400, "unrecognised query")

# simple pass-through for CSV load so the UI only talks to one host
@app.post("/load_data")
async def load_data():
    r = await client.post(f"{EDA_HOST}/load_csv", json={})
    return r.json()
