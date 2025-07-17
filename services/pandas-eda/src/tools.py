import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import io
import base64
from typing import List, Dict, Any

def dataframe_from_payload(payload: Dict[str, Any]) -> pd.DataFrame:
    """Creates a pandas DataFrame from the 'data' key in a JSON payload."""
    data = payload.get("data")
    if not data or not isinstance(data, list):
        raise ValueError("Payload must contain a 'data' key with a list of records.")
    return pd.DataFrame(data)

def get_dataset_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Generates a summary of the dataset including schema and missing values.
    """
    missing_values = df.isnull().sum()
    missing_values_dict = missing_values[missing_values > 0].to_dict()

    schema = {col: str(dtype) for col, dtype in df.dtypes.items()}

    summary = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "missing_values": missing_values_dict,
        "column_summary": schema,
    }
    return summary

def generate_plot_base64(fig) -> str:
    """
    Converts a matplotlib figure to a base64 encoded string.
    """
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)  # Close the figure to free up memory
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    return img_str

def generate_histogram(df: pd.DataFrame, column: str) -> str:
    """Generates a histogram for a given numerical column and returns it as a base64 string."""
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found in DataFrame.")
    
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.histplot(df[column], kde=True, ax=ax)
    ax.set_title(f'Distribution of {column}')
    ax.set_xlabel(column)
    ax.set_ylabel('Frequency')
    
    return generate_plot_base64(fig)

def generate_bar_chart(df: pd.DataFrame, column: str) -> str:
    """Generates a bar chart for a given categorical column and returns it as a base64 string."""
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found in DataFrame.")
    
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.countplot(y=df[column], ax=ax, order=df[column].value_counts().index)
    ax.set_title(f'Count of {column}')
    ax.set_xlabel('Count')
    ax.set_ylabel(column)
    
    return generate_plot_base64(fig)

def generate_correlation_heatmap(df: pd.DataFrame) -> str:
    """Generates a correlation heatmap for numerical columns and returns it as a base64 string."""
    numeric_df = df.select_dtypes(include=['number'])
    if numeric_df.shape[1] < 2:
        raise ValueError("Not enough numeric columns for a correlation heatmap.")
    
    corr = numeric_df.corr()
    
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", ax=ax)
    ax.set_title('Correlation Heatmap')
    
    return generate_plot_base64(fig)