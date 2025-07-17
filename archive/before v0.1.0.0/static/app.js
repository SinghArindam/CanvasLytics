// Ask-Your-Data Application JavaScript - Backend Connected Version
class AskYourDataApp {
    constructor() {
        this.isDataLoaded = false;
        this.charts = new Map();
        this.canvasZoom = 1;
        this.canvasOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.handDrawnMode = false;
        this.selectedChart = null;
        this.sessionId = null;
        this.socket = null;
        this.currentDataset = null;
        
        this.init();
    }

    async init() {
        await this.initializeSession();
        this.initializeSocket();
        this.setupEventListeners();
        this.setupCanvas();
    }

    async initializeSession() {
        try {
            const response = await fetch('/api/session');
            const data = await response.json();
            this.sessionId = data.session_id;
            console.log('Session initialized:', this.sessionId);
        } catch (error) {
            console.error('Failed to initialize session:', error);
        }
    }

    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connected', (data) => {
            console.log('Socket connected:', data.session_id);
        });

        this.socket.on('chat_response', (data) => {
            this.displayChatMessage(data);
        });

        this.socket.on('suggestions_response', (data) => {
            this.updateSuggestions(data.suggestions);
        });

        this.socket.on('error', (data) => {
            console.error('Socket error:', data.message);
            this.showErrorMessage(data.message);
        });
    }

    setupEventListeners() {
        // Data loading buttons
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadData());
        document.getElementById('loadDataSidebarBtn').addEventListener('click', () => this.loadData());
        document.getElementById('welcomeLoadBtn').addEventListener('click', () => this.loadData());

        // Canvas controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomCanvas(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomCanvas(0.8));
        document.getElementById('handDrawnToggle').addEventListener('click', () => this.toggleHandDrawn());

        // Export functionality
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCanvas());

        // Sidebar toggles
        document.querySelectorAll('.sidebar-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                this.toggleSidebar(targetId);
            });
        });

        // Chat functionality
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });
        document.getElementById('sendBtn').addEventListener('click', () => this.sendChatMessage());

        // ML Model Builder
        document.getElementById('modelBuilderBtn').addEventListener('click', () => this.openModelBuilder());
        document.getElementById('closeModelModal').addEventListener('click', () => this.closeModelBuilder());
        document.getElementById('trainModelBtn').addEventListener('click', () => this.trainModel());
        document.getElementById('addToCanvasBtn').addEventListener('click', () => this.addModelResultsToCanvas());

        // Insights button
        document.getElementById('insightsBtn').addEventListener('click', () => this.generateInsights());

        // Canvas interactions
        this.setupCanvasInteractions();
    }

    setupCanvas() {
        const canvasWrapper = document.getElementById('canvasWrapper');
        const canvasContent = document.getElementById('canvasContent');
        
        // Mouse wheel zoom
        canvasWrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoomCanvas(zoomFactor);
        });

        // Canvas panning
        canvasWrapper.addEventListener('mousedown', (e) => {
            if (e.target === canvasWrapper || e.target === canvasContent || e.target.classList.contains('canvas-grid')) {
                this.isDragging = true;
                this.dragStart.x = e.clientX - this.canvasOffset.x;
                this.dragStart.y = e.clientY - this.canvasOffset.y;
                canvasWrapper.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.canvasOffset.x = e.clientX - this.dragStart.x;
                this.canvasOffset.y = e.clientY - this.dragStart.y;
                this.updateCanvasTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            canvasWrapper.style.cursor = 'grab';
        });
    }

    setupCanvasInteractions() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chart-object')) {
                this.selectChart(e.target.closest('.chart-object'));
            } else {
                this.deselectChart();
            }
        });
    }

    async loadData() {
        try {
            this.showLoadingOverlay();
            
            const response = await fetch('/api/load-titanic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentDataset = result.dataset;
                this.isDataLoaded = true;
                this.hideLoadingOverlay();
                this.updateUIAfterDataLoad();
                await this.generateInitialCharts();
                this.enableChatAndTools();
                this.requestSuggestions();
            } else {
                throw new Error(result.error || 'Failed to load dataset');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.hideLoadingOverlay();
            this.showErrorMessage('Failed to load Titanic dataset: ' + error.message);
        }
    }

    showLoadingOverlay() {
        document.getElementById('loadingOverlay').classList.remove('hidden');
        this.simulateProgress();
    }

    hideLoadingOverlay() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    async simulateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        const steps = [
            { percent: 20, text: "Loading dataset..." },
            { percent: 45, text: "Analyzing data structure..." },
            { percent: 70, text: "Calculating statistics..." },
            { percent: 90, text: "Generating visualizations..." },
            { percent: 100, text: "Complete!" }
        ];

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 600));
            progressFill.style.width = `${step.percent}%`;
            progressText.textContent = `${step.percent}%`;
        }
    }

    updateUIAfterDataLoad() {
        // Hide welcome message
        document.getElementById('welcomeMessage').classList.add('hidden');
        
        // Show dataset info
        document.getElementById('dataStatus').classList.add('hidden');
        document.getElementById('datasetInfo').classList.remove('hidden');
        
        // Update dataset information
        document.getElementById('datasetName').textContent = this.currentDataset.name || 'Titanic Survival Dataset';
        document.getElementById('totalRows').textContent = this.currentDataset.total_rows || '0';
        document.getElementById('totalColumns').textContent = Object.keys(this.currentDataset.columns_info || {}).length;
        document.getElementById('missingValues').textContent = this.currentDataset.missing_values || '0';
        document.getElementById('loadedTime').textContent = new Date().toLocaleTimeString();
        
        // Populate columns list
        this.populateColumnsList();
    }

    populateColumnsList() {
        const columnsList = document.getElementById('columnsList');
        columnsList.innerHTML = '';
        
        if (this.currentDataset && this.currentDataset.columns_info) {
            Object.entries(this.currentDataset.columns_info).forEach(([columnName, info]) => {
                const columnItem = document.createElement('div');
                columnItem.className = 'column-item';
                columnItem.innerHTML = `
                    <span class="column-name">${columnName}</span>
                    <span class="column-type">${info.type}</span>
                `;
                columnsList.appendChild(columnItem);
            });
        }
    }

    async generateInitialCharts() {
        try {
            // Generate survival overview donut chart
            await this.createChart('survival-overview', 'Survival Rate Overview', 'doughnut', {
                x: 100, y: 100, width: 350, height: 300
            });

            // Generate survival by class bar chart
            await this.createChart('survival-by-class', 'Survival by Passenger Class', 'bar', {
                x: 500, y: 100, width: 400, height: 300
            });

            // Generate age distribution histogram
            await this.createChart('age-distribution', 'Age Distribution', 'bar', {
                x: 100, y: 450, width: 400, height: 300
            });

            // Generate survival by gender
            await this.createChart('survival-by-gender', 'Survival by Gender', 'bar', {
                x: 550, y: 450, width: 350, height: 300
            });
        } catch (error) {
            console.error('Error generating initial charts:', error);
        }
    }

    async createChart(id, title, type, position) {
        const chartObject = document.createElement('div');
        chartObject.className = `chart-object ${this.handDrawnMode ? 'hand-drawn' : ''}`;
        chartObject.id = id;
        chartObject.style.left = `${position.x}px`;
        chartObject.style.top = `${position.y}px`;
        chartObject.style.width = `${position.width}px`;
        chartObject.style.height = `${position.height}px`;

        chartObject.innerHTML = `
            <div class="chart-header">
                <h4 class="chart-title">${title}</h4>
                <div class="chart-actions">
                    <button class="btn-icon" onclick="app.removeChart('${id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="chart-body">
                <canvas class="chart-canvas" id="${id}-canvas"></canvas>
            </div>
            <div class="resize-handle"></div>
        `;

        document.getElementById('canvasContent').appendChild(chartObject);
        
        // Make chart draggable
        this.makeChartDraggable(chartObject);
        
        // Load chart data and render
        try {
            const chartData = await this.loadChartData(id);
            if (chartData) {
                setTimeout(() => {
                    this.renderChart(id, type, title, chartData);
                }, 100);
            }
        } catch (error) {
            console.error(`Error loading data for chart ${id}:`, error);
        }

        this.charts.set(id, { element: chartObject, type, title, chart: null });
    }

    async loadChartData(chartType) {
        try {
            const response = await fetch(`/api/chart-data/${chartType}`);
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to load chart data');
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
            return null;
        }
    }

    renderChart(id, type, title, data) {
        const canvas = document.getElementById(`${id}-canvas`);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (this.charts.has(id) && this.charts.get(id).chart) {
            this.charts.get(id).chart.destroy();
        }

        let config = {
            type: type,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: false
                    }
                }
            }
        };

        // Customize options based on chart type
        if (type === 'doughnut') {
            config.options.cutout = '60%';
        } else if (type === 'bar') {
            config.options.scales = {
                y: {
                    beginAtZero: true
                }
            };
        }

        const chart = new Chart(ctx, config);
        
        // Store chart reference
        if (this.charts.has(id)) {
            this.charts.get(id).chart = chart;
        }
    }

    makeChartDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        element.addEventListener('mousedown', (e) => {
            if (e.target.closest('.chart-actions') || e.target.closest('.resize-handle')) {
                return;
            }
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = parseInt(element.style.left) || 0;
            initialY = parseInt(element.style.top) || 0;
            
            element.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            element.style.left = `${initialX + dx}px`;
            element.style.top = `${initialY + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
            }
        });
    }

    removeChart(chartId) {
        const chartData = this.charts.get(chartId);
        if (chartData) {
            if (chartData.chart) {
                chartData.chart.destroy();
            }
            if (chartData.element) {
                chartData.element.remove();
            }
            this.charts.delete(chartId);
        }
    }

    zoomCanvas(factor) {
        this.canvasZoom *= factor;
        this.canvasZoom = Math.max(0.1, Math.min(3, this.canvasZoom));
        this.updateCanvasTransform();
        this.updateZoomLevel();
    }

    updateCanvasTransform() {
        const canvasContent = document.getElementById('canvasContent');
        canvasContent.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px) scale(${this.canvasZoom})`;
    }

    updateZoomLevel() {
        document.querySelector('.zoom-level').textContent = `${Math.round(this.canvasZoom * 100)}%`;
    }

    toggleHandDrawn() {
        this.handDrawnMode = !this.handDrawnMode;
        const toggle = document.getElementById('handDrawnToggle');
        toggle.classList.toggle('active', this.handDrawnMode);
        
        // Update existing charts
        this.charts.forEach((chartData) => {
            chartData.element.classList.toggle('hand-drawn', this.handDrawnMode);
        });
    }

    toggleSidebar(sidebarId) {
        const sidebar = document.getElementById(sidebarId);
        sidebar.classList.toggle('collapsed');
    }

    selectChart(chartElement) {
        // Remove selection from other charts
        document.querySelectorAll('.chart-object').forEach(chart => {
            chart.classList.remove('selected');
        });
        
        // Add selection to clicked chart
        chartElement.classList.add('selected');
        this.selectedChart = chartElement;
    }

    deselectChart() {
        document.querySelectorAll('.chart-object').forEach(chart => {
            chart.classList.remove('selected');
        });
        this.selectedChart = null;
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message || !this.socket) return;
        
        this.socket.emit('chat_message', { message: message });
        input.value = '';
    }

    displayChatMessage(data) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        const isUser = data.type === 'user';
        const avatarClass = isUser ? 'user-avatar' : 'ai-avatar';
        const avatarContent = isUser ? '👤' : '🤖';
        
        messageDiv.innerHTML = `
            <div class="${avatarClass}">${avatarContent}</div>
            <div class="message-content">
                <p>${data.message}</p>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    requestSuggestions() {
        if (this.socket) {
            this.socket.emit('request_suggestions');
        }
    }

    updateSuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = suggestion;
            suggestionItem.addEventListener('click', () => {
                document.getElementById('chatInput').value = suggestion;
                this.sendChatMessage();
            });
            suggestionsList.appendChild(suggestionItem);
        });
    }

    enableChatAndTools() {
        // Enable chat input
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        chatInput.disabled = false;
        chatInput.placeholder = 'Ask a question about your data...';
        sendBtn.disabled = false;
        
        // Enable tool buttons
        document.getElementById('modelBuilderBtn').disabled = false;
        document.getElementById('insightsBtn').disabled = false;
    }

    async generateInsights() {
        try {
            const response = await fetch('/api/insights');
            const result = await response.json();
            
            if (result.success) {
                // Display insights in chat
                const chatMessages = document.getElementById('chatMessages');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'chat-message';
                
                messageDiv.innerHTML = `
                    <div class="ai-avatar">🤖</div>
                    <div class="message-content">
                        <p><strong>Dataset Insights:</strong></p>
                        <ul>
                            ${result.insights.map(insight => `<li>${insight}</li>`).join('')}
                        </ul>
                    </div>
                `;
                
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (error) {
            console.error('Error generating insights:', error);
            this.showErrorMessage('Failed to generate insights');
        }
    }

    openModelBuilder() {
        document.getElementById('modelModal').classList.remove('hidden');
        
        // Populate target variable options
        if (this.currentDataset && this.currentDataset.columns_info) {
            const targetSelect = document.getElementById('targetVariable');
            targetSelect.innerHTML = '';
            
            Object.keys(this.currentDataset.columns_info).forEach(column => {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                targetSelect.appendChild(option);
            });
        }
    }

    closeModelBuilder() {
        document.getElementById('modelModal').classList.add('hidden');
        document.getElementById('modelResults').classList.add('hidden');
    }

    async trainModel() {
        try {
            const targetVariable = document.getElementById('targetVariable').value;
            const modelType = document.getElementById('modelType').value;
            
            const response = await fetch('/api/ml/train', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target_variable: targetVariable,
                    model_type: modelType
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.displayModelResults(result.result);
            } else {
                throw new Error(result.error || 'Failed to train model');
            }
        } catch (error) {
            console.error('Error training model:', error);
            this.showErrorMessage('Failed to train model: ' + error.message);
        }
    }

    displayModelResults(results) {
        // Update metrics
        document.getElementById('accuracyValue').textContent = (results.accuracy * 100).toFixed(1) + '%';
        document.getElementById('precisionValue').textContent = (results.precision * 100).toFixed(1) + '%';
        document.getElementById('recallValue').textContent = (results.recall * 100).toFixed(1) + '%';
        document.getElementById('f1Value').textContent = (results.f1_score * 100).toFixed(1) + '%';
        
        // Update feature importance
        const featureList = document.getElementById('featureImportanceList');
        featureList.innerHTML = '';
        
        if (results.feature_importance) {
            const sortedFeatures = Object.entries(results.feature_importance)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            sortedFeatures.forEach(([feature, importance]) => {
                const featureItem = document.createElement('div');
                featureItem.className = 'feature-item';
                featureItem.innerHTML = `
                    <span class="feature-name">${feature}</span>
                    <span class="feature-score">${(importance * 100).toFixed(1)}%</span>
                `;
                featureList.appendChild(featureItem);
            });
        }
        
        // Store results for adding to canvas
        this.lastModelResults = results;
        
        // Show results section
        document.getElementById('modelResults').classList.remove('hidden');
    }

    addModelResultsToCanvas() {
        if (!this.lastModelResults) return;
        
        // Create a text summary chart
        const chartId = 'model-results-' + Date.now();
        const position = {
            x: 200 + Math.random() * 200,
            y: 200 + Math.random() * 200,
            width: 400,
            height: 300
        };
        
        const chartObject = document.createElement('div');
        chartObject.className = `chart-object ${this.handDrawnMode ? 'hand-drawn' : ''}`;
        chartObject.id = chartId;
        chartObject.style.left = `${position.x}px`;
        chartObject.style.top = `${position.y}px`;
        chartObject.style.width = `${position.width}px`;
        chartObject.style.height = `${position.height}px`;

        const topFeatures = Object.entries(this.lastModelResults.feature_importance || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, score]) => `${name}: ${(score * 100).toFixed(1)}%`)
            .join(', ');

        chartObject.innerHTML = `
            <div class="chart-header">
                <h4 class="chart-title">Model Performance</h4>
                <div class="chart-actions">
                    <button class="btn-icon" onclick="app.removeChart('${chartId}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="chart-body">
                <div style="padding: 20px;">
                    <div class="metrics-grid">
                        <div class="metric">
                            <span class="metric-label">Accuracy</span>
                            <span class="metric-value">${(this.lastModelResults.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">F1 Score</span>
                            <span class="metric-value">${(this.lastModelResults.f1_score * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                    <div style="margin-top: 16px;">
                        <h5>Top Features:</h5>
                        <p style="font-size: 12px; color: var(--color-text-secondary);">${topFeatures}</p>
                    </div>
                </div>
            </div>
            <div class="resize-handle"></div>
        `;

        document.getElementById('canvasContent').appendChild(chartObject);
        this.makeChartDraggable(chartObject);
        this.charts.set(chartId, { element: chartObject, type: 'summary', title: 'Model Performance', chart: null });
        
        // Close modal
        this.closeModelBuilder();
    }

    exportCanvas() {
        // Simple implementation - could be enhanced to export as image
        const canvasContent = document.getElementById('canvasContent');
        const charts = Array.from(canvasContent.querySelectorAll('.chart-object'));
        
        let exportData = {
            charts: charts.map(chart => ({
                id: chart.id,
                title: chart.querySelector('.chart-title').textContent,
                position: {
                    x: parseInt(chart.style.left),
                    y: parseInt(chart.style.top),
                    width: parseInt(chart.style.width),
                    height: parseInt(chart.style.height)
                }
            })),
            zoom: this.canvasZoom,
            offset: this.canvasOffset
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'canvas-export.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    showErrorMessage(message) {
        // Simple error display - could be enhanced with a proper notification system
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        messageDiv.innerHTML = `
            <div class="ai-avatar">⚠️</div>
            <div class="message-content">
                <p style="color: var(--color-error);">${message}</p>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AskYourDataApp();
});
