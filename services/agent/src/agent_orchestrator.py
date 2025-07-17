import json
from typing import Dict, Any
from . import tool_registry

class AgentOrchestrator:
    """
    Orchestrates tasks based on user input by routing them to the appropriate tool.
    In a real system, this would involve complex reasoning, likely using an LLM.
    This is a simplified rule-based example for demonstration.
    """
    
    async def process_user_request(self, message: str) -> Dict[str, Any]:
        """
        Processes a raw JSON string message from the client.

        Args:
            message (str): A JSON string from the websocket client.
        
        Returns:
            A dictionary with the result of the tool call or an error message.
        """
        try:
            request_data = json.loads(message)
            action = request_data.get("action")
            payload = request_data.get("payload", {})

            if not action:
                return self._create_error_response("No 'action' specified in the request.")

            # Simple rule-based routing
            if action == "get_initial_visualizations":
                return await tool_registry.call_eda_service("/initial-visualizations", payload)
            elif action == "generate_chart":
                return await tool_registry.call_eda_service("/generate-chart", payload)
            elif action == "train_model":
                return await tool_registry.call_ml_service("/train", payload)
            elif action == "get_dataset_summary":
                return await tool_registry.call_eda_service("/summarize", payload)
            else:
                return self._create_error_response(f"Unknown action: {action}")

        except json.JSONDecodeError:
            return self._create_error_response("Invalid JSON message received.")
        except tool_registry.ToolError as e:
            return self._create_error_response(f"Tool execution failed: {e.message}", e.status_code)
        except Exception as e:
            return self._create_error_response(f"An unexpected error occurred: {str(e)}")

    def _create_error_response(self, message: str, status_code: int = 400) -> Dict[str, Any]:
        """Creates a standardized error response dictionary."""
        return {
            "status": "error",
            "statusCode": status_code,
            "message": message
        }