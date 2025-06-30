import pandas as pd
import numpy as np
import json
import os
from app import db
from models import Dataset

class DataService:
    def __init__(self):
        self.current_datasets = {}  # session_id -> dataframe
    
    def load_titanic_dataset(self, session_id):
        """Load the Titanic dataset"""
        try:
            # Create Titanic CSV if it doesn't exist
            titanic_path = 'data/titanic.csv'
            if not os.path.exists('data'):
                os.makedirs('data')
            
            if not os.path.exists(titanic_path):
                # Generate Titanic dataset with realistic data
                df = self._generate_titanic_dataset()
                df.to_csv(titanic_path, index=False)
            else:
                df = pd.read_csv(titanic_path)
            
            # Store in memory for this session
            self.current_datasets[session_id] = df
            
            # Calculate dataset info
            columns_info = self._analyze_columns(df)
            total_rows = len(df)
            missing_values = df.isnull().sum().sum()
            
            # Save to database
            dataset = Dataset(
                name="Titanic Survival Dataset",
                filename="titanic.csv",
                file_path=titanic_path,
                columns_info=json.dumps(columns_info),
                total_rows=total_rows,
                missing_values=missing_values,
                session_id=session_id
            )
            db.session.add(dataset)
            db.session.commit()
            
            return dataset.to_dict()
            
        except Exception as e:
            raise Exception(f"Failed to load Titanic dataset: {str(e)}")
    
    def load_custom_dataset(self, file_path, filename, session_id):
        """Load a custom dataset from file"""
        try:
            # Read the file based on extension
            if filename.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            else:
                raise ValueError("Unsupported file format")
            
            # Store in memory for this session
            self.current_datasets[session_id] = df
            
            # Calculate dataset info
            columns_info = self._analyze_columns(df)
            total_rows = len(df)
            missing_values = df.isnull().sum().sum()
            
            # Save to database
            dataset = Dataset(
                name=filename.split('.')[0],
                filename=filename,
                file_path=file_path,
                columns_info=json.dumps(columns_info),
                total_rows=total_rows,
                missing_values=missing_values,
                session_id=session_id
            )
            db.session.add(dataset)
            db.session.commit()
            
            return dataset.to_dict()
            
        except Exception as e:
            raise Exception(f"Failed to load dataset: {str(e)}")
    
    def _analyze_columns(self, df):
        """Analyze columns and return detailed information"""
        columns_info = {}
        
        for column in df.columns:
            col_data = df[column]
            dtype = str(col_data.dtype)
            
            # Determine column type
            if pd.api.types.is_numeric_dtype(col_data):
                if pd.api.types.is_integer_dtype(col_data):
                    col_type = "int"
                else:
                    col_type = "float"
            else:
                col_type = "string"
            
            # Calculate statistics
            missing_count = col_data.isnull().sum()
            unique_count = col_data.nunique()
            
            info = {
                "type": col_type,
                "missing": int(missing_count),
                "unique": int(unique_count)
            }
            
            # Add value-specific info
            if col_type in ["int", "float"] and not col_data.empty:
                info["range"] = [float(col_data.min()), float(col_data.max())]
                info["mean"] = float(col_data.mean()) if pd.notna(col_data.mean()) else None
                info["std"] = float(col_data.std()) if pd.notna(col_data.std()) else None
            elif col_type == "string" and unique_count <= 10:
                info["values"] = col_data.dropna().unique().tolist()
            
            columns_info[column] = info
        
        return columns_info
    
    def get_dataset_statistics(self, session_id):
        """Get comprehensive statistics for the dataset"""
        if session_id not in self.current_datasets:
            raise Exception("No dataset loaded for this session")
        
        df = self.current_datasets[session_id]
        
        stats = {
            "basic_stats": {
                "total_rows": len(df),
                "total_columns": len(df.columns),
                "missing_values": df.isnull().sum().sum(),
                "duplicate_rows": df.duplicated().sum()
            },
            "column_stats": {},
            "correlations": {}
        }
        
        # Calculate detailed column statistics
        for column in df.columns:
            col_data = df[column]
            col_stats = {
                "dtype": str(col_data.dtype),
                "missing": int(col_data.isnull().sum()),
                "unique": int(col_data.nunique()),
                "missing_percentage": float(col_data.isnull().sum() / len(df) * 100)
            }
            
            if pd.api.types.is_numeric_dtype(col_data):
                col_stats.update({
                    "mean": float(col_data.mean()) if pd.notna(col_data.mean()) else None,
                    "median": float(col_data.median()) if pd.notna(col_data.median()) else None,
                    "std": float(col_data.std()) if pd.notna(col_data.std()) else None,
                    "min": float(col_data.min()) if pd.notna(col_data.min()) else None,
                    "max": float(col_data.max()) if pd.notna(col_data.max()) else None,
                    "q25": float(col_data.quantile(0.25)) if pd.notna(col_data.quantile(0.25)) else None,
                    "q75": float(col_data.quantile(0.75)) if pd.notna(col_data.quantile(0.75)) else None
                })
            
            stats["column_stats"][column] = col_stats
        
        # Calculate correlations for numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 1:
            corr_matrix = df[numeric_cols].corr()
            stats["correlations"] = corr_matrix.to_dict()
        
        return stats
    
    def generate_chart_data(self, session_id, chart_type):
        """Generate data for different chart types"""
        if session_id not in self.current_datasets:
            raise Exception("No dataset loaded for this session")
        
        df = self.current_datasets[session_id]
        
        if chart_type == "survival-overview":
            return self._get_survival_overview_data(df)
        elif chart_type == "survival-by-class":
            return self._get_survival_by_class_data(df)
        elif chart_type == "age-distribution":
            return self._get_age_distribution_data(df)
        elif chart_type == "survival-by-gender":
            return self._get_survival_by_gender_data(df)
        elif chart_type == "correlation-matrix":
            return self._get_correlation_matrix_data(df)
        else:
            raise Exception(f"Unknown chart type: {chart_type}")
    
    def _get_survival_overview_data(self, df):
        """Generate survival overview donut chart data"""
        if 'Survived' not in df.columns:
            return {"error": "Survived column not found"}
        
        survival_counts = df['Survived'].value_counts()
        
        return {
            "labels": ["Did not survive", "Survived"],
            "datasets": [{
                "data": [int(survival_counts.get(0, 0)), int(survival_counts.get(1, 0))],
                "backgroundColor": ["#ff6b6b", "#4ecdc4"],
                "borderColor": ["#ff5252", "#26a69a"],
                "borderWidth": 2
            }]
        }
    
    def _get_survival_by_class_data(self, df):
        """Generate survival by passenger class data"""
        if 'Survived' not in df.columns or 'Pclass' not in df.columns:
            return {"error": "Required columns not found"}
        
        class_survival = df.groupby('Pclass')['Survived'].agg(['count', 'sum']).reset_index()
        class_survival['not_survived'] = class_survival['count'] - class_survival['sum']
        
        return {
            "labels": ["1st Class", "2nd Class", "3rd Class"],
            "datasets": [{
                "label": "Survived",
                "data": class_survival['sum'].tolist(),
                "backgroundColor": "#4ecdc4",
                "borderColor": "#26a69a",
                "borderWidth": 1
            }, {
                "label": "Did not survive",
                "data": class_survival['not_survived'].tolist(),
                "backgroundColor": "#ff6b6b",
                "borderColor": "#ff5252",
                "borderWidth": 1
            }]
        }
    
    def _get_age_distribution_data(self, df):
        """Generate age distribution histogram data"""
        if 'Age' not in df.columns:
            return {"error": "Age column not found"}
        
        age_data = df['Age'].dropna()
        bins = np.arange(0, age_data.max() + 10, 10)
        hist, bin_edges = np.histogram(age_data, bins=bins)
        
        labels = [f"{int(bin_edges[i])}-{int(bin_edges[i+1])}" for i in range(len(hist))]
        
        return {
            "labels": labels,
            "datasets": [{
                "label": "Number of Passengers",
                "data": hist.tolist(),
                "backgroundColor": "#36a2eb",
                "borderColor": "#1e88e5",
                "borderWidth": 1
            }]
        }
    
    def _get_survival_by_gender_data(self, df):
        """Generate survival by gender data"""
        if 'Survived' not in df.columns or 'Sex' not in df.columns:
            return {"error": "Required columns not found"}
        
        gender_survival = df.groupby('Sex')['Survived'].agg(['count', 'sum']).reset_index()
        gender_survival['not_survived'] = gender_survival['count'] - gender_survival['sum']
        
        return {
            "labels": ["Female", "Male"],
            "datasets": [{
                "label": "Survived",
                "data": [
                    int(gender_survival[gender_survival['Sex'] == 'female']['sum'].iloc[0]) if len(gender_survival[gender_survival['Sex'] == 'female']) > 0 else 0,
                    int(gender_survival[gender_survival['Sex'] == 'male']['sum'].iloc[0]) if len(gender_survival[gender_survival['Sex'] == 'male']) > 0 else 0
                ],
                "backgroundColor": "#4ecdc4",
                "borderColor": "#26a69a",
                "borderWidth": 1
            }, {
                "label": "Did not survive",
                "data": [
                    int(gender_survival[gender_survival['Sex'] == 'female']['not_survived'].iloc[0]) if len(gender_survival[gender_survival['Sex'] == 'female']) > 0 else 0,
                    int(gender_survival[gender_survival['Sex'] == 'male']['not_survived'].iloc[0]) if len(gender_survival[gender_survival['Sex'] == 'male']) > 0 else 0
                ],
                "backgroundColor": "#ff6b6b",
                "borderColor": "#ff5252",
                "borderWidth": 1
            }]
        }
    
    def _get_correlation_matrix_data(self, df):
        """Generate correlation matrix data"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return {"error": "Not enough numeric columns for correlation"}
        
        corr_matrix = df[numeric_cols].corr()
        
        return {
            "columns": numeric_cols.tolist(),
            "matrix": corr_matrix.values.tolist()
        }
    
    def generate_insights(self, session_id):
        """Generate automated insights from the dataset"""
        if session_id not in self.current_datasets:
            raise Exception("No dataset loaded for this session")
        
        df = self.current_datasets[session_id]
        insights = []
        
        # Basic insights
        insights.append(f"Dataset contains {len(df)} rows and {len(df.columns)} columns")
        
        missing_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        insights.append(f"Overall missing data: {missing_percentage:.1f}%")
        
        # Survival-specific insights (if Titanic dataset)
        if 'Survived' in df.columns:
            survival_rate = df['Survived'].mean() * 100
            insights.append(f"Overall survival rate: {survival_rate:.1f}%")
            
            if 'Sex' in df.columns:
                female_survival = df[df['Sex'] == 'female']['Survived'].mean() * 100
                male_survival = df[df['Sex'] == 'male']['Survived'].mean() * 100
                insights.append(f"Female survival rate: {female_survival:.1f}% vs Male: {male_survival:.1f}%")
            
            if 'Pclass' in df.columns:
                class_survival = df.groupby('Pclass')['Survived'].mean() * 100
                for pclass, rate in class_survival.items():
                    insights.append(f"Class {pclass} survival rate: {rate:.1f}%")
        
        # Age insights
        if 'Age' in df.columns:
            avg_age = df['Age'].mean()
            insights.append(f"Average age: {avg_age:.1f} years")
            
            age_missing = df['Age'].isnull().sum()
            insights.append(f"Missing age data for {age_missing} passengers")
        
        return insights
    
    def _generate_titanic_dataset(self):
        """Generate a realistic Titanic dataset"""
        np.random.seed(42)  # For reproducibility
        
        n_passengers = 891
        
        # Generate passenger data
        data = {
            'PassengerId': range(1, n_passengers + 1),
            'Pclass': np.random.choice([1, 2, 3], n_passengers, p=[0.24, 0.21, 0.55]),
            'Sex': np.random.choice(['male', 'female'], n_passengers, p=[0.65, 0.35]),
            'Age': np.random.normal(29, 14, n_passengers),
            'SibSp': np.random.choice([0, 1, 2, 3, 4, 5, 8], n_passengers, p=[0.68, 0.23, 0.06, 0.02, 0.005, 0.003, 0.002]),
            'Parch': np.random.choice([0, 1, 2, 3, 4, 5, 6], n_passengers, p=[0.76, 0.13, 0.08, 0.02, 0.004, 0.003, 0.003]),
            'Fare': np.random.lognormal(2.5, 1.2, n_passengers),
            'Embarked': np.random.choice(['S', 'C', 'Q'], n_passengers, p=[0.72, 0.19, 0.09])
        }
        
        # Clip age to reasonable bounds
        data['Age'] = np.clip(data['Age'], 0.17, 80)
        
        # Generate survival based on realistic patterns
        survival_prob = np.zeros(n_passengers)
        
        for i in range(n_passengers):
            prob = 0.3  # Base survival rate
            
            # Gender effect
            if data['Sex'][i] == 'female':
                prob += 0.4
            else:
                prob -= 0.1
            
            # Class effect
            if data['Pclass'][i] == 1:
                prob += 0.3
            elif data['Pclass'][i] == 2:
                prob += 0.1
            else:
                prob -= 0.1
            
            # Age effect
            if data['Age'][i] < 16:
                prob += 0.2
            elif data['Age'][i] > 60:
                prob -= 0.1
            
            # Family size effect
            family_size = data['SibSp'][i] + data['Parch'][i]
            if 1 <= family_size <= 3:
                prob += 0.1
            elif family_size > 3:
                prob -= 0.1
            
            survival_prob[i] = np.clip(prob, 0, 1)
        
        data['Survived'] = np.random.binomial(1, survival_prob)
        
        # Generate names (simplified)
        first_names_male = ['John', 'William', 'James', 'Charles', 'George', 'Frank', 'Joseph', 'Thomas', 'Henry', 'Robert']
        first_names_female = ['Mary', 'Anna', 'Margaret', 'Helen', 'Elizabeth', 'Ruth', 'Florence', 'Ethel', 'Emma', 'Marie']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson']
        
        names = []
        for i in range(n_passengers):
            if data['Sex'][i] == 'male':
                first_name = np.random.choice(first_names_male)
                title = 'Mr.'
            else:
                first_name = np.random.choice(first_names_female)
                title = 'Miss.' if np.random.random() < 0.6 else 'Mrs.'
            
            last_name = np.random.choice(last_names)
            names.append(f"{last_name}, {title} {first_name}")
        
        data['Name'] = names
        
        # Generate tickets (simplified)
        data['Ticket'] = [f"A/{np.random.randint(10000, 99999)}" if np.random.random() < 0.3 
                         else str(np.random.randint(100000, 999999)) for _ in range(n_passengers)]
        
        # Generate cabin data (many missing)
        cabins = []
        for i in range(n_passengers):
            if np.random.random() < 0.23:  # Only 23% have cabin data
                deck = np.random.choice(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
                number = np.random.randint(1, 200)
                cabins.append(f"{deck}{number}")
            else:
                cabins.append(None)
        
        data['Cabin'] = cabins
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Add some missing values to Age
        age_missing_indices = np.random.choice(df.index, size=177, replace=False)
        df.loc[age_missing_indices, 'Age'] = None
        
        # Add some missing values to Embarked
        embarked_missing_indices = np.random.choice(df.index, size=2, replace=False)
        df.loc[embarked_missing_indices, 'Embarked'] = None
        
        return df
