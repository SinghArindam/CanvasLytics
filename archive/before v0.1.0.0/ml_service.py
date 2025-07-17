import pandas as pd
import numpy as np
import json
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.impute import SimpleImputer

from app import db
from models import ModelResult
from data_service import DataService

class MLService:
    def __init__(self):
        self.data_service = DataService()
        self.models = {
            'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42),
            'LogisticRegression': LogisticRegression(random_state=42, max_iter=1000)
        }
    
    def train_model(self, session_id, target_variable, model_type='RandomForest'):
        """Train a machine learning model"""
        try:
            if session_id not in self.data_service.current_datasets:
                raise Exception("No dataset loaded for this session")
            
            df = self.data_service.current_datasets[session_id].copy()
            
            if target_variable not in df.columns:
                raise Exception(f"Target variable '{target_variable}' not found in dataset")
            
            # Prepare the data
            X, y = self._prepare_data(df, target_variable)
            
            # Split the data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Select and train model
            if model_type not in self.models:
                raise Exception(f"Unknown model type: {model_type}")
            
            model = self.models[model_type]
            model.fit(X_train, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test)
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted')
            recall = recall_score(y_test, y_pred, average='weighted')
            f1 = f1_score(y_test, y_pred, average='weighted')
            
            # Get feature importance
            feature_importance = {}
            if hasattr(model, 'feature_importances_'):
                for feature, importance in zip(X.columns, model.feature_importances_):
                    feature_importance[feature] = float(importance)
            elif hasattr(model, 'coef_'):
                for feature, coef in zip(X.columns, model.coef_[0]):
                    feature_importance[feature] = float(abs(coef))
            
            # Save model
            model_dir = 'models'
            if not os.path.exists(model_dir):
                os.makedirs(model_dir)
            
            model_filename = f"{session_id}_{model_type}_{target_variable}.pkl"
            model_path = os.path.join(model_dir, model_filename)
            
            with open(model_path, 'wb') as f:
                pickle.dump({
                    'model': model,
                    'feature_columns': X.columns.tolist(),
                    'preprocessors': self._get_preprocessors()
                }, f)
            
            # Save results to database
            model_result = ModelResult(
                session_id=session_id,
                model_type=model_type,
                target_variable=target_variable,
                accuracy=accuracy,
                precision=precision,
                recall=recall,
                f1_score=f1,
                feature_importance=json.dumps(feature_importance),
                model_path=model_path
            )
            db.session.add(model_result)
            db.session.commit()
            
            return {
                'model_id': model_result.id,
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'feature_importance': feature_importance,
                'classification_report': classification_report(y_test, y_pred, output_dict=True),
                'cross_val_scores': cross_val_score(model, X, y, cv=5).tolist()
            }
            
        except Exception as e:
            raise Exception(f"Failed to train model: {str(e)}")
    
    def _prepare_data(self, df, target_variable):
        """Prepare data for machine learning"""
        # Separate features and target
        y = df[target_variable]
        X = df.drop(columns=[target_variable])
        
        # Handle different column types
        numeric_columns = X.select_dtypes(include=[np.number]).columns
        categorical_columns = X.select_dtypes(include=['object']).columns
        
        # Process numeric columns
        if len(numeric_columns) > 0:
            # Impute missing values
            numeric_imputer = SimpleImputer(strategy='median')
            X[numeric_columns] = numeric_imputer.fit_transform(X[numeric_columns])
        
        # Process categorical columns
        if len(categorical_columns) > 0:
            for col in categorical_columns:
                # Skip high cardinality columns (like names, tickets)
                if X[col].nunique() > 50:
                    X = X.drop(columns=[col])
                    continue
                
                # Impute missing values
                X[col] = X[col].fillna('Unknown')
                
                # Encode categorical variables
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col])
        
        # Remove any remaining non-numeric columns
        X = X.select_dtypes(include=[np.number])
        
        return X, y
    
    def _get_preprocessors(self):
        """Get preprocessors used for the model (for future predictions)"""
        return {
            'numeric_imputer': 'median',
            'categorical_imputer': 'Unknown',
            'encoding': 'label'
        }
    
    def predict(self, session_id, model_id, data):
        """Make predictions using a trained model"""
        try:
            # Load model from database
            model_result = ModelResult.query.get(model_id)
            if not model_result or model_result.session_id != session_id:
                raise Exception("Model not found")
            
            # Load the saved model
            with open(model_result.model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            model = model_data['model']
            feature_columns = model_data['feature_columns']
            
            # Prepare input data (similar to training preparation)
            # This would need to be implemented based on the specific preprocessing steps
            
            predictions = model.predict(data)
            probabilities = model.predict_proba(data) if hasattr(model, 'predict_proba') else None
            
            return {
                'predictions': predictions.tolist(),
                'probabilities': probabilities.tolist() if probabilities is not None else None
            }
            
        except Exception as e:
            raise Exception(f"Failed to make predictions: {str(e)}")
    
    def get_model_performance(self, session_id):
        """Get performance metrics for all models in a session"""
        try:
            models = ModelResult.query.filter_by(session_id=session_id).all()
            
            performance_data = []
            for model in models:
                performance_data.append({
                    'model_id': model.id,
                    'model_type': model.model_type,
                    'target_variable': model.target_variable,
                    'accuracy': model.accuracy,
                    'precision': model.precision,
                    'recall': model.recall,
                    'f1_score': model.f1_score,
                    'created_at': model.created_at.isoformat()
                })
            
            return performance_data
            
        except Exception as e:
            raise Exception(f"Failed to get model performance: {str(e)}")
