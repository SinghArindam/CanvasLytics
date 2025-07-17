import httpx
import os
from dotenv import load_dotenv
from typing import Dict, Any

# Load environment variables from a .env file for local development
load_dotenv()

# Get service URLs from environment variables, with sensible defaults for Docker networking
PANDAS_EDA_URL = os.getenv("PANDAS_EDA_URL", "http://pandas-eda:8001")
SKLEARN_LAB_URL = os.getenv("SKLEARN_LAB_URL", "http://sklearn-lab:8002")

# Set a timeout for the HTTP requests
TIMEOUT = httpx.Timeout(30.0, connect=5.0)

class ToolError(Exception):
    """Custom exception for tool-related errors."""
    def __init__(self, message, status_code=500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

async def call_eda_service(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Asynchronously calls an endpoint on the pandas-eda service.

    Args:
        endpoint (str): The specific API endpoint to hit (e.g., '/summarize').
        payload (Dict): The data to send in the request body.

    Returns:
        A dictionary containing the JSON response from the service.
    
    Raises:
        ToolError: If the API call fails or returns a non-200 status code.
    """
    url = f"{PANDAS_EDA_URL}{endpoint}"
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            print(f"Calling EDA service at {url} with payload: {payload}")
            response = await client.post(url, json=payload)
            response.raise_for_status()  # Raises HTTPStatusError for 4xx/5xx responses
            return response.json()
        except httpx.HTTPStatusError as e:
            raise ToolError(f"EDA service returned an error: {e.response.text}", status_code=e.response.status_code)
        except httpx.RequestError as e:
            raise ToolError(f"Failed to connect to EDA service: {e}")

async def call_ml_service(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Asynchronously calls an endpoint on the sklearn-lab service.

    Args:
        endpoint (str): The specific API endpoint to hit (e.g., '/train').
        payload (Dict): The data to send in the request body.

    Returns:
        A dictionary containing the JSON response from the service.

    Raises:
        ToolError: If the API call fails or returns a non-200 status code.
    """
    url = f"{SKLEARN_LAB_URL}{endpoint}"
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            print(f"Calling ML service at {url} with payload: {payload}")
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise ToolError(f"ML service returned an error: {e.response.text}", status_code=e.response.status_code)
        except httpx.RequestError as e:
            raise ToolError(f"Failed to connect to ML service: {e}")