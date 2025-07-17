from app import db
from datetime import datetime
import json

class Dataset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    columns_info = db.Column(db.Text)  # JSON string of column information
    total_rows = db.Column(db.Integer)
    missing_values = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    session_id = db.Column(db.String(100))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'filename': self.filename,
            'total_rows': self.total_rows,
            'missing_values': self.missing_values,
            'columns_info': json.loads(self.columns_info) if self.columns_info else {},
            'created_at': self.created_at.isoformat()
        }

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text)
    message_type = db.Column(db.String(20), default='user')  # 'user' or 'ai'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ModelResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    dataset_id = db.Column(db.Integer, db.ForeignKey('dataset.id'))
    model_type = db.Column(db.String(50), nullable=False)
    target_variable = db.Column(db.String(50), nullable=False)
    accuracy = db.Column(db.Float)
    precision = db.Column(db.Float)
    recall = db.Column(db.Float)
    f1_score = db.Column(db.Float)
    feature_importance = db.Column(db.Text)  # JSON string
    model_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'model_type': self.model_type,
            'target_variable': self.target_variable,
            'accuracy': self.accuracy,
            'precision': self.precision,
            'recall': self.recall,
            'f1_score': self.f1_score,
            'feature_importance': json.loads(self.feature_importance) if self.feature_importance else {},
            'created_at': self.created_at.isoformat()
        }
