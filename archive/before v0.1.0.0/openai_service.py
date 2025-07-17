import json
import os
from openai import OpenAI
from data_service import DataService

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
        self.data_service = DataService()
    
    def process_data_query(self, query, session_id):
        """Process a natural language query about the data"""
        try:
            if not self.client.api_key:
                return "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            
            # Get dataset context
            dataset_context = self._get_dataset_context(session_id)
            
            # Prepare the prompt
            system_prompt = f"""
            You are a data analysis assistant helping users explore and understand their dataset.
            
            Current dataset context:
            {dataset_context}
            
            Based on the user's query, provide helpful insights, explanations, or suggestions.
            If the query asks for specific analysis that requires computation, explain what the analysis would show.
            Keep responses concise but informative.
            Focus on actionable insights and clear explanations.
            """
            
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"I apologize, but I encountered an error processing your query: {str(e)}"
    
    def generate_suggestions(self, session_id):
        """Generate suggested questions based on the current dataset"""
        try:
            if not self.client.api_key:
                return [
                    "What factors most influenced survival rates?",
                    "How did passenger class affect survival?",
                    "What was the age distribution of survivors?",
                    "Did fare price correlate with survival?",
                    "How did family size impact survival chances?"
                ]
            
            dataset_context = self._get_dataset_context(session_id)
            
            system_prompt = f"""
            Based on this dataset context, generate 5 insightful questions that would be interesting to explore:
            
            {dataset_context}
            
            Return the response as a JSON array of strings.
            Focus on questions that would reveal meaningful patterns and insights.
            """
            
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Generate 5 interesting questions about this dataset."}
                ],
                response_format={"type": "json_object"},
                max_tokens=300
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get('questions', [
                "What factors most influenced survival rates?",
                "How did passenger class affect survival?",
                "What was the age distribution of survivors?",
                "Did fare price correlate with survival?",
                "How did family size impact survival chances?"
            ])
            
        except Exception as e:
            # Return default suggestions if OpenAI fails
            return [
                "What factors most influenced survival rates?",
                "How did passenger class affect survival?",
                "What was the age distribution of survivors?",
                "Did fare price correlate with survival?",
                "How did family size impact survival chances?"
            ]
    
    def generate_insights(self, session_id):
        """Generate automated insights from the dataset"""
        try:
            if not self.client.api_key:
                return self.data_service.generate_insights(session_id)
            
            dataset_context = self._get_dataset_context(session_id)
            stats = self.data_service.get_dataset_statistics(session_id)
            
            system_prompt = f"""
            Analyze this dataset and provide 3-5 key insights that would be valuable for understanding the data.
            
            Dataset context:
            {dataset_context}
            
            Statistics:
            {json.dumps(stats, indent=2)}
            
            Focus on:
            - Significant patterns or relationships
            - Data quality observations
            - Surprising or notable findings
            - Actionable insights
            
            Return a JSON array of insight strings.
            """
            
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Generate key insights from this dataset."}
                ],
                response_format={"type": "json_object"},
                max_tokens=400
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get('insights', self.data_service.generate_insights(session_id))
            
        except Exception as e:
            # Fallback to basic insights if OpenAI fails
            return self.data_service.generate_insights(session_id)
    
    def _get_dataset_context(self, session_id):
        """Get context about the current dataset"""
        try:
            if session_id not in self.data_service.current_datasets:
                return "No dataset currently loaded."
            
            df = self.data_service.current_datasets[session_id]
            
            context = f"""
            Dataset: {len(df)} rows, {len(df.columns)} columns
            Columns: {', '.join(df.columns.tolist())}
            
            Column types:
            """
            
            for col in df.columns:
                dtype = str(df[col].dtype)
                missing = df[col].isnull().sum()
                unique = df[col].nunique()
                context += f"- {col}: {dtype}, {missing} missing, {unique} unique values\n"
            
            return context
            
        except Exception as e:
            return f"Error getting dataset context: {str(e)}"
