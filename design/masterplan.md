# CanvasLytics — Masterplan.md

## 🧭 Overview & Objective

**CanvasLytics** is a web-based, Excalidraw-style data exploration canvas that allows data scientists to interact with and model their datasets using visual elements and natural language commands. It aims to streamline the exploratory data analysis (EDA) and baseline machine learning workflow through a multimodal interface — combining charts, wizards, and an intelligent NL assistant.

The objective is to accelerate data understanding and experimentation without requiring users to write code, while preserving the control and flexibility expected by experienced data practitioners.

---

## 🎯 Target Audience

- **Primary users**: Data scientists and ML practitioners
- **Needs addressed**:
  - Rapid EDA via automated visual summaries
  - One-click baseline modeling and benchmarking
  - Frictionless UI with natural language-driven exploration
  - Shareable, visual representation of exploratory workflows

---

## 🧩 Core Features

- **Canvas Interface**:
  - Infinite canvas layout with draggable, resizable cards
  - Dataset nodes, charts, model boxes, annotations
  - Drag-to-connect elements (e.g. dataset ➝ model)
  - Contextual right-click menus and action buttons

- **Dataset Upload**:
  - Accepts `.csv`, `.json`, and `.parquet` files
  - Files stored in memory only (max 100MB per file)
  - Multiple datasets per canvas with easy switching

- **Automated EDA**:
  - Visualizations: histograms, bar charts, correlation heatmaps
  - Dataset summary: column schema, missing values, distribution
  - Prompt suggestions from AI assistant

- **ML Modeling Wizard**:
  - Tasks: Classification, Regression, Clustering
  - Models: Logistic Regression, Random Forest, Linear Regression, KMeans, etc.
  - Output: Accuracy, confusion matrix, ROC, R², feature importance
  - Artifacts: Downloadable pipeline code and pickle model

- **Natural Language Interaction**:
  - “Train a random forest to predict survival”
  - “Show me age distribution by gender”
  - Integrated AI assistant suggesting top queries

- **Canvas Export & Sharing**:
  - Export board as visual summary or code/model artifacts
  - Public sharing via URL (editable via duplication)

---

## 🧱 Technical Architecture

### Frontend (Client)
- React + Next.js SPA
- Infinite canvas (Excalidraw-style)
- WebSocket-based chat and actions

### Backend
- **Agent**: Orchestrator (MCP Agent) with multi-step reasoning
- **Microservices**:
  - `pandas-eda` (Pandas, Seaborn visualization tools)
  - `sklearn-lab` (scikit-learn modeling and pipelines)

### Hosting
- Entire app containerized via Docker and deployed on **Hugging Face Spaces**

---

## 🧰 High-Level Tech Stack

| Layer           | Technology               | Notes                                   |
|----------------|--------------------------|-----------------------------------------|
| Frontend       | React, Next.js, Excalidraw | SPA with interactive canvas             |
| Backend Agent  | Python, WebSockets       | Handles chat, tool routing              |
| EDA Service    | Pandas, Seaborn          | Generates visualizations                |
| ML Service     | Scikit-learn             | Trains and evaluates models             |
| Hosting        | Hugging Face Spaces      | Fast deployment via Docker              |
| Storage        | In-memory only           | No persistent DB; optional S3/exported artifacts |

---

## 🗃️ Conceptual Data Model

- **Canvas**: Includes references to datasets, charts, models
- **Dataset**: ID, name, schema, in-memory file
- **Chart Block**: Type, data source, rendered metadata
- **Model Block**: Task type, model type, metrics, downloadable output
- **Chat Log**: NL prompt history (session only)

---

## 🎨 UI/UX Design Principles

- **Zero-friction onboarding**: No login, immediate interaction
- **Multimodal control**: Buttons, drag-and-drop, right-click, and NL input
- **Visual-first**: All analysis and modeling reflected as cards on canvas
- **Responsiveness**: Zoom, pan, rearrange elements fluidly
- **Reusability**: Shareable canvases act as both workspace and report

---

## 🔐 Security & Privacy Considerations

- Anonymous usage only (no login or user tracking)
- Shared boards are editable via duplication
- No user code execution (only internal scikit-learn/pandas toolchains)
- In-memory processing only (no long-term dataset storage)

---

## 🚦Development Phases

**Phase 1: Core MVP**
- Upload dataset (CSV/JSON/Parquet)
- Auto-generated EDA cards
- NL prompt assistant
- ML pipeline wizard (baseline models)
- Canvas drag/drop + export

**Phase 2: Share & Enhance**
- Public board sharing + duplication
- Artifact download (charts, pickle, code)
- Expanded chart options

**Phase 3: Power Features**
- Hyperparameter tuning (via UI sliders)
- Dataset versioning or diffing
- Multi-dataset linking and merging

---

## ⚠️ Potential Challenges & Solutions

| Challenge                         | Suggested Solution                                      |
|----------------------------------|---------------------------------------------------------|
| Large files affecting performance| 100MB cap, stream uploads, paginate previews            |
| Natural language ambiguity       | Guided NL prompts + contextual hints                    |
| Memory usage in multi-user mode  | Implement per-session cleanup, idle timeouts            |
| Canvas complexity as boards grow | Zoom-level filtering, card minimization, search/filter |

---

## 🔮 Future Expansion Ideas

- GitHub/Colab export integration
- Explainable AI (XAI) blocks using SHAP/LIME
- Real-time collaboration (multi-user canvas)
- AutoML recommendations for better model selection
- Full "CanvasLytics" chatbot mode with conversational chaining

---

