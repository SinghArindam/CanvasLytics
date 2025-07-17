import os
import uuid
import json
from flask import request, jsonify, session, send_from_directory
from flask_socketio import emit, join_room, leave_room
from werkzeug.utils import secure_filename
import pandas as pd

from app import app, db, socketio
from models import Dataset, ChatMessage, ModelResult
from data_service import DataService
from ml_service import MLService
from openai_service import OpenAIService

# Initialize services
data_service = DataService()
ml_service = MLService()
openai_service = OpenAIService()

# Allowed file extensions
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/session', methods=['GET'])
def get_session():
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    return jsonify({'session_id': session['session_id']})

@app.route('/api/load-titanic', methods=['POST'])
def load_titanic_dataset():
    try:
        session_id = session.get('session_id', str(uuid.uuid4()))
        session['session_id'] = session_id
        
        # Load the Titanic dataset
        dataset_info = data_service.load_titanic_dataset(session_id)
        
        return jsonify({
            'success': True,
            'dataset': dataset_info,
            'message': 'Titanic dataset loaded successfully'
        })
    except Exception as e:
        app.logger.error(f"Error loading Titanic dataset: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/upload-dataset', methods=['POST'])
def upload_dataset():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            session_id = session.get('session_id', str(uuid.uuid4()))
            session['session_id'] = session_id
            
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{session_id}_{filename}")
            file.save(file_path)
            
            # Process the uploaded dataset
            dataset_info = data_service.load_custom_dataset(file_path, filename, session_id)
            
            return jsonify({
                'success': True,
                'dataset': dataset_info,
                'message': f'Dataset {filename} loaded successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
            
    except Exception as e:
        app.logger.error(f"Error uploading dataset: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/dataset/stats', methods=['GET'])
def get_dataset_stats():
    try:
        session_id = session.get('session_id')
        if not session_id:
            return jsonify({'success': False, 'error': 'No active session'}), 400
        
        stats = data_service.get_dataset_statistics(session_id)
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        app.logger.error(f"Error getting dataset stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/chart-data/<chart_type>', methods=['GET'])
def get_chart_data(chart_type):
    try:
        session_id = session.get('session_id')
        if not session_id:
            return jsonify({'success': False, 'error': 'No active session'}), 400
        
        chart_data = data_service.generate_chart_data(session_id, chart_type)
        return jsonify({
            'success': True,
            'data': chart_data
        })
    except Exception as e:
        app.logger.error(f"Error generating chart data: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/insights', methods=['GET'])
def get_insights():
    try:
        session_id = session.get('session_id')
        if not session_id:
            return jsonify({'success': False, 'error': 'No active session'}), 400
        
        insights = data_service.generate_insights(session_id)
        return jsonify({
            'success': True,
            'insights': insights
        })
    except Exception as e:
        app.logger.error(f"Error generating insights: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/train', methods=['POST'])
def train_model():
    try:
        session_id = session.get('session_id')
        if not session_id:
            return jsonify({'success': False, 'error': 'No active session'}), 400
        
        data = request.get_json()
        target_variable = data.get('target_variable', 'Survived')
        model_type = data.get('model_type', 'RandomForest')
        
        result = ml_service.train_model(session_id, target_variable, model_type)
        
        return jsonify({
            'success': True,
            'result': result
        })
    except Exception as e:
        app.logger.error(f"Error training model: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/models', methods=['GET'])
def get_models():
    try:
        session_id = session.get('session_id')
        if not session_id:
            return jsonify({'success': False, 'error': 'No active session'}), 400
        
        models = ModelResult.query.filter_by(session_id=session_id).all()
        return jsonify({
            'success': True,
            'models': [model.to_dict() for model in models]
        })
    except Exception as e:
        app.logger.error(f"Error getting models: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# WebSocket events for AI Chat
@socketio.on('connect')
def handle_connect():
    session_id = session.get('session_id', str(uuid.uuid4()))
    session['session_id'] = session_id
    join_room(session_id)
    emit('connected', {'session_id': session_id})

@socketio.on('disconnect')
def handle_disconnect():
    session_id = session.get('session_id')
    if session_id:
        leave_room(session_id)

@socketio.on('chat_message')
def handle_chat_message(data):
    try:
        session_id = session.get('session_id')
        if not session_id:
            emit('error', {'message': 'No active session'})
            return
        
        message = data.get('message', '')
        if not message.strip():
            emit('error', {'message': 'Empty message'})
            return
        
        # Save user message
        chat_message = ChatMessage(
            session_id=session_id,
            message=message,
            message_type='user'
        )
        db.session.add(chat_message)
        db.session.commit()
        
        # Echo user message
        emit('chat_response', {
            'type': 'user',
            'message': message,
            'timestamp': chat_message.created_at.isoformat()
        }, room=session_id)
        
        # Generate AI response
        response = openai_service.process_data_query(message, session_id)
        
        # Save AI response
        ai_message = ChatMessage(
            session_id=session_id,
            message=response,
            message_type='ai'
        )
        db.session.add(ai_message)
        db.session.commit()
        
        # Send AI response
        emit('chat_response', {
            'type': 'ai',
            'message': response,
            'timestamp': ai_message.created_at.isoformat()
        }, room=session_id)
        
    except Exception as e:
        app.logger.error(f"Error processing chat message: {str(e)}")
        emit('error', {'message': f'Error processing message: {str(e)}'})

@socketio.on('request_suggestions')
def handle_suggestions_request():
    try:
        session_id = session.get('session_id')
        if not session_id:
            emit('error', {'message': 'No active session'})
            return
        
        suggestions = openai_service.generate_suggestions(session_id)
        emit('suggestions_response', {'suggestions': suggestions}, room=session_id)
        
    except Exception as e:
        app.logger.error(f"Error generating suggestions: {str(e)}")
        emit('error', {'message': f'Error generating suggestions: {str(e)}'})
