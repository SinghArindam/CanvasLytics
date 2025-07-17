import pandas as pd
import joblib
import io
import base64

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# Classification models
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

# Regression models
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor

# Metrics
from sklearn.metrics import accuracy_score, confusion_matrix, r2_score, mean_squared_error

from typing import Dict, Any, List, Tuple

def create_preprocessor(numeric_features: List[str], categorical_features: List[str]) -> ColumnTransformer:
    """Creates a preprocessing pipeline for numeric and categorical features."""
    
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ],
        remainder='passthrough' # Keep other columns if any
    )
    return preprocessor

def get_model(model_name: str, task_type: str):
    """Returns an instantiated model based on its name and task type."""
    models = {
        "classification": {
            "Logistic Regression": LogisticRegression(random_state=42),
            "Random Forest": RandomForestClassifier(random_state=42)
        },
        "regression": {
            "Linear Regression": LinearRegression(),
            "Random Forest": RandomForestRegressor(random_state=42)
        }
    }
    if task_type not in models or model_name not in models[task_type]:
        raise ValueError(f"Unsupported model '{model_name}' for task '{task_type}'.")
    
    return models[task_type][model_name]

def train_model_pipeline(
    df: pd.DataFrame, 
    features: List[str], 
    target: str, 
    model_name: str,
    task_type: str = "classification"
) -> Dict[str, Any]:
    """
    Trains a full ML pipeline and returns metrics and the serialized model.
    """
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not in DataFrame.")
    if not all(f in df.columns for f in features):
        raise ValueError("One or more feature columns not found in DataFrame.")

    X = df[features]
    y = df[target]

    # Identify feature types
    numeric_features = X.select_dtypes(include=['number']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()

    # Create preprocessor and model
    preprocessor = create_preprocessor(numeric_features, categorical_features)
    model = get_model(model_name, task_type)

    # Create the full pipeline
    pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', model)])

    # Split data and train
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipeline.fit(X_train, y_train)

    # Evaluate model
    y_pred = pipeline.predict(X_test)

    metrics = {}
    if task_type == "classification":
        metrics['accuracy'] = accuracy_score(y_test, y_pred)
        metrics['confusion_matrix'] = confusion_matrix(y_test, y_pred).tolist()
    elif task_type == "regression":
        metrics['r2_score'] = r2_score(y_test, y_pred)
        metrics['mean_squared_error'] = mean_squared_error(y_test, y_pred)

    # Serialize the trained pipeline using joblib and encode with base64
    buffer = io.BytesIO()
    joblib.dump(pipeline, buffer)
    buffer.seek(0)
    model_artifact = base64.b64encode(buffer.read()).decode('utf-8')

    return {
        "metrics": metrics,
        "model_name": model_name,
        "model_artifact_b64": model_artifact
    }