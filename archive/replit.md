# Ask-Your-Data - Data Exploration Workbench

## Overview

Ask-Your-Data is a web-based data exploration and machine learning workbench that allows users to interact with datasets using natural language queries. The application features an Excalidraw-inspired infinite canvas interface where users can explore the Titanic dataset through interactive visualizations and baseline machine learning models.

## System Architecture

The application follows a traditional Flask-based web architecture with real-time communication capabilities:

**Frontend**: Single-page application with vanilla JavaScript featuring an infinite canvas interface inspired by Excalidraw's minimalist design
**Backend**: Flask web server with SQLAlchemy ORM for database operations
**Real-time Communication**: Flask-SocketIO for WebSocket connections enabling live chat and data updates
**AI Integration**: OpenAI GPT-4o for natural language processing of data queries
**Database**: SQLite (development) with PostgreSQL support for production

## Key Components

### Web Framework Stack
- **Flask**: Core web framework with CORS enabled for cross-origin requests
- **Flask-SocketIO**: WebSocket support for real-time chat functionality
- **Flask-SQLAlchemy**: ORM layer with declarative base for database models

### Data Processing Services
- **DataService**: Handles dataset loading, analysis, and management with built-in Titanic dataset generation
- **MLService**: Machine learning pipeline using scikit-learn for model training and evaluation
- **OpenAIService**: Natural language query processing using GPT-4o model

### Database Models
- **Dataset**: Stores dataset metadata, column information, and session associations
- **ChatMessage**: Persists user conversations and AI responses
- **ModelResult**: Tracks ML model performance metrics and feature importance

### Frontend Architecture
- **Canvas System**: Infinite scrollable workspace with zoom controls and hand-drawn style toggle
- **Chart Management**: Drag-and-drop chart creation with Chart.js integration
- **Real-time Chat**: WebSocket-based communication for data queries and AI responses

## Data Flow

1. **Session Initialization**: User receives unique session ID for data isolation
2. **Dataset Loading**: Titanic dataset loaded via one-click button, stored in session memory
3. **Natural Language Queries**: User questions processed by OpenAI service with dataset context
4. **Visualization Creation**: Charts generated on infinite canvas with move/resize capabilities
5. **ML Model Training**: Baseline models trained on user-selected target variables
6. **Results Persistence**: All interactions, datasets, and model results stored in database

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o model for natural language understanding and data insights
- Environment variable: `OPENAI_API_KEY`

### Frontend Libraries
- **Chart.js**: Interactive chart rendering with date adapter support
- **Socket.io**: Client-side WebSocket communication
- **Inter Font**: Typography from Google Fonts

### Python Packages
- **Flask ecosystem**: Core web framework with extensions
- **Pandas/NumPy**: Data manipulation and analysis
- **Scikit-learn**: Machine learning algorithms and preprocessing
- **OpenAI**: Official Python client for GPT integration

## Deployment Strategy

### Development Environment
- SQLite database for local development
- Flask development server with debug mode enabled
- File-based upload storage in local 'uploads' directory

### Production Considerations
- PostgreSQL database via `DATABASE_URL` environment variable
- SQLAlchemy connection pooling with health checks enabled
- ProxyFix middleware for reverse proxy deployments
- Session secret from environment variable for security

### File Management
- Local filesystem storage for uploaded datasets
- Automatic directory creation for uploads folder
- Support for CSV, Excel file formats with secure filename handling

## Changelog
- May 29, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.