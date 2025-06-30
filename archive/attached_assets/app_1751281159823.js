// Ask-Your-Data Application JavaScript
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
        
        // Titanic dataset simulation
        this.dataset = {
            total_rows: 891,
            columns: {
                "PassengerId": {"type": "int", "missing": 0, "unique": 891},
                "Survived": {"type": "int", "missing": 0, "values": [0, 1]},
                "Pclass": {"type": "int", "missing": 0, "values": [1, 2, 3]},
                "Name": {"type": "string", "missing": 0, "unique": 891},
                "Sex": {"type": "string", "missing": 0, "values": ["male", "female"]},
                "Age": {"type": "float", "missing": 177, "range": [0.42, 80]},
                "SibSp": {"type": "int", "missing": 0, "range": [0, 8]},
                "Parch": {"type": "int", "missing": 0, "range": [0, 6]},
                "Ticket": {"type": "string", "missing": 0, "unique": 681},
                "Fare": {"type": "float", "missing": 0, "range": [0, 512.33]},
                "Cabin": {"type": "string", "missing": 687, "unique": 147},
                "Embarked": {"type": "string", "missing": 2, "values": ["C", "Q", "S"]}
            },
            survival_stats: {
                overall_survival_rate: 0.384,
                male_survival_rate: 0.189,
                female_survival_rate: 0.742,
                class_1_survival_rate: 0.630,
                class_2_survival_rate: 0.473,
                class_3_survival_rate: 0.242
            },
            insights: [
                "Women had a 74% survival rate vs 19% for men",
                "First-class passengers were 3x more likely to survive",
                "Children under 10 had higher survival rates",
                "Port of embarkation showed survival differences",
                "Higher fare passengers had better survival odds"
            ],
            top_questions: [
                "What factors most influenced survival rates?",
                "How did passenger class affect survival?",
                "What was the age distribution of survivors?",
                "Did fare price correlate with survival?",
                "How did family size impact survival chances?"
            ],
            model_results: {
                accuracy: 0.823,
                precision: 0.791,
                recall: 0.768,
                f1_score: 0.779,
                feature_importance: {
                    "Sex": 0.287,
                    "Fare": 0.268,
                    "Age": 0.178,
                    "Pclass": 0.156,
                    "SibSp": 0.061,
                    "Parch": 0.050
                }
            }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.populateInitialUI();
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
            if (e.key === 'Enter') this.sendChatMessage();
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
            if (e.target === canvasWrapper || e.target === canvasContent) {
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
        // Will be used for chart drag and drop functionality
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chart-object')) {
                this.selectChart(e.target.closest('.chart-object'));
            } else {
                this.deselectChart();
            }
        });
    }

    populateInitialUI() {
        // Populate suggestions
        this.populateSuggestions();
    }

    async loadData() {
        this.showLoadingOverlay();
        
        // Simulate loading progress
        await this.simulateProgress();
        
        this.isDataLoaded = true;
        this.hideLoadingOverlay();
        this.updateUIAfterDataLoad();
        this.generateInitialCharts();
        this.enableChatAndTools();
    }

    showLoadingOverlay() {
        document.getElementById('loadingOverlay').classList.remove('hidden');
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
        
        // Update loaded time
        document.getElementById('loadedTime').textContent = new Date().toLocaleTimeString();
        
        // Populate columns list
        this.populateColumnsList();
    }

    populateColumnsList() {
        const columnsList = document.getElementById('columnsList');
        columnsList.innerHTML = '';
        
        Object.entries(this.dataset.columns).forEach(([columnName, info]) => {
            const columnItem = document.createElement('div');
            columnItem.className = 'column-item';
            columnItem.innerHTML = `
                <span class="column-name">${columnName}</span>
                <span class="column-type">${info.type}</span>
            `;
            columnsList.appendChild(columnItem);
        });
    }

    populateSuggestions() {
        const suggestionsList = document.getElementById('suggestionsList');
        
        this.dataset.top_questions.forEach(question => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = question;
            suggestionItem.addEventListener('click', () => {
                document.getElementById('chatInput').value = question;
                this.sendChatMessage();
            });
            suggestionsList.appendChild(suggestionItem);
        });
    }

    generateInitialCharts() {
        // Generate survival overview donut chart
        this.createChart('survival-overview', 'Survival Rate Overview', 'doughnut', {
            x: 100,
            y: 100,
            width: 350,
            height: 300
        });

        // Generate survival by class bar chart
        this.createChart('survival-by-class', 'Survival by Passenger Class', 'bar', {
            x: 500,
            y: 100,
            width: 400,
            height: 300
        });

        // Generate age distribution histogram
        this.createChart('age-distribution', 'Age Distribution', 'bar', {
            x: 100,
            y: 450,
            width: 400,
            height: 300
        });

        // Generate survival by gender
        this.createChart('survival-by-gender', 'Survival by Gender', 'bar', {
            x: 550,
            y: 450,
            width: 350,
            height: 300
        });
    }

    createChart(id, title, type, position) {
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
        
        // Generate chart data and render
        setTimeout(() => {
            this.renderChart(id, type, title);
        }, 100);

        this.charts.set(id, { element: chartObject, type, title, chart: null });
    }

    renderChart(id, type, title) {
        const canvas = document.getElementById(`${id}-canvas`);
        const ctx = canvas.getContext('2d');

        let data, config;

        switch (id) {
            case 'survival-overview':
                data = {
                    labels: ['Survived', 'Did not survive'],
                    datasets: [{
                        data: [342, 549],
                        backgroundColor: ['#1FB8CD', '#FFC185'],
                        borderWidth: 0
                    }]
                };
                break;
            
            case 'survival-by-class':
                data = {
                    labels: ['1st Class', '2nd Class', '3rd Class'],
                    datasets: [{
                        label: 'Survived',
                        data: [136, 87, 119],
                        backgroundColor: '#1FB8CD'
                    }, {
                        label: 'Did not survive',
                        data: [80, 97, 372],
                        backgroundColor: '#FFC185'
                    }]
                };
                break;
            
            case 'age-distribution':
                data = {
                    labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+'],
                    datasets: [{
                        label: 'Count',
                        data: [62, 102, 220, 167, 89, 42, 33],
                        backgroundColor: '#B4413C'
                    }]
                };
                break;
            
            case 'survival-by-gender':
                data = {
                    labels: ['Male', 'Female'],
                    datasets: [{
                        label: 'Survived',
                        data: [109, 233],
                        backgroundColor: '#1FB8CD'
                    }, {
                        label: 'Did not survive',
                        data: [468, 81],
                        backgroundColor: '#FFC185'
                    }]
                };
                break;
        }

        config = {
            type: type,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: type !== 'doughnut' ? {
                    y: {
                        beginAtZero: true
                    }
                } : {}
            }
        };

        const chart = new Chart(ctx, config);
        const chartData = this.charts.get(id);
        if (chartData) {
            chartData.chart = chart;
        }
    }

    makeChartDraggable(chartElement) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        const header = chartElement.querySelector('.chart-header');
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = chartElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            chartElement.style.zIndex = '1000';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;
            
            chartElement.style.left = `${Math.max(0, x)}px`;
            chartElement.style.top = `${Math.max(0, y)}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                chartElement.style.zIndex = 'auto';
            }
        });
    }

    removeChart(id) {
        const chartData = this.charts.get(id);
        if (chartData) {
            if (chartData.chart) {
                chartData.chart.destroy();
            }
            chartData.element.remove();
            this.charts.delete(id);
        }
    }

    selectChart(chartElement) {
        this.deselectChart();
        this.selectedChart = chartElement;
        chartElement.classList.add('selected');
    }

    deselectChart() {
        if (this.selectedChart) {
            this.selectedChart.classList.remove('selected');
            this.selectedChart = null;
        }
    }

    zoomCanvas(factor) {
        this.canvasZoom *= factor;
        this.canvasZoom = Math.max(0.1, Math.min(3, this.canvasZoom));
        this.updateCanvasTransform();
        this.updateZoomDisplay();
    }

    updateCanvasTransform() {
        const canvasContent = document.getElementById('canvasContent');
        canvasContent.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px) scale(${this.canvasZoom})`;
    }

    updateZoomDisplay() {
        document.querySelector('.zoom-level').textContent = `${Math.round(this.canvasZoom * 100)}%`;
    }

    toggleHandDrawn() {
        this.handDrawnMode = !this.handDrawnMode;
        const toggle = document.getElementById('handDrawnToggle');
        toggle.classList.toggle('active', this.handDrawnMode);
        
        // Apply hand-drawn style to existing charts
        this.charts.forEach((chartData) => {
            chartData.element.classList.toggle('hand-drawn', this.handDrawnMode);
        });
    }

    toggleSidebar(sidebarId) {
        const sidebar = document.getElementById(sidebarId);
        sidebar.classList.toggle('collapsed');
    }

    enableChatAndTools() {
        document.getElementById('chatInput').disabled = false;
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('modelBuilderBtn').disabled = false;
        document.getElementById('insightsBtn').disabled = false;
        
        // Add welcome message to chat
        this.addChatMessage('ai', 'Great! I\'ve loaded the Titanic dataset and created some initial visualizations. What would you like to explore?');
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;

        this.addChatMessage('user', message);
        input.value = '';

        // Simulate AI response
        setTimeout(() => {
            this.simulateAIResponse(message);
        }, 1000);
    }

    addChatMessage(sender, text) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message fade-in';
        
        const avatar = sender === 'ai' ? '🤖' : '👤';
        const avatarClass = sender === 'ai' ? 'ai-avatar' : 'user-avatar';
        
        messageDiv.innerHTML = `
            <div class="${avatarClass}">${avatar}</div>
            <div class="message-content">
                <p>${text}</p>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    simulateAIResponse(userMessage) {
        const responses = {
            'factors': 'Based on the analysis, the most influential factors for survival were:\n1. Gender (74% female survival vs 19% male)\n2. Passenger class (1st class had 63% survival)\n3. Age (children had higher survival rates)\n4. Fare price (higher fare = better survival odds)',
            'class': 'Passenger class had a significant impact on survival rates:\n• 1st Class: 63% survival rate\n• 2nd Class: 47% survival rate\n• 3rd Class: 24% survival rate\n\nThis suggests socioeconomic status influenced access to lifeboats.',
            'age': 'Age distribution shows interesting patterns:\n• Children (0-10): Higher survival rates due to "women and children first"\n• Young adults (20-40): Largest group but varied survival\n• Elderly (60+): Lower survival rates, possibly due to mobility',
            'fare': 'Fare price strongly correlated with survival:\n• Higher fare passengers (1st class) had better cabin locations\n• Premium passengers had priority lifeboat access\n• Average fare of survivors was significantly higher',
            'family': 'Family size had mixed effects:\n• Small families (1-3 people) had better survival rates\n• Large families often stayed together, affecting survival\n• Solo travelers had varied outcomes based on other factors'
        };

        let response = 'I can help you explore that aspect of the data. ';
        
        // Simple keyword matching for demo
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.includes('factor') || lowerMessage.includes('influence')) {
            response += responses.factors;
        } else if (lowerMessage.includes('class')) {
            response += responses.class;
        } else if (lowerMessage.includes('age')) {
            response += responses.age;
        } else if (lowerMessage.includes('fare') || lowerMessage.includes('price')) {
            response += responses.fare;
        } else if (lowerMessage.includes('family')) {
            response += responses.family;
        } else {
            response += 'Let me analyze that for you. Based on the Titanic dataset, I can see several interesting patterns. Would you like me to create a specific visualization to explore this further?';
        }

        this.addChatMessage('ai', response);
    }

    generateInsights() {
        this.addChatMessage('ai', 'Here are some key insights from the Titanic dataset:\n\n' + 
            this.dataset.insights.map(insight => `• ${insight}`).join('\n'));
    }

    openModelBuilder() {
        document.getElementById('modelModal').classList.remove('hidden');
        this.populateFeatureCheckboxes();
    }

    closeModelBuilder() {
        document.getElementById('modelModal').classList.add('hidden');
    }

    populateFeatureCheckboxes() {
        const container = document.getElementById('featureCheckboxes');
        container.innerHTML = '';
        
        const features = ['Pclass', 'Sex', 'Age', 'SibSp', 'Parch', 'Fare', 'Embarked'];
        
        features.forEach(feature => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'feature-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `feature-${feature}`;
            checkbox.value = feature;
            checkbox.checked = ['Pclass', 'Sex', 'Age', 'Fare'].includes(feature);
            
            const label = document.createElement('label');
            label.htmlFor = `feature-${feature}`;
            label.textContent = feature;
            
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            container.appendChild(checkboxDiv);
        });
    }

    async trainModel() {
        const trainBtn = document.getElementById('trainModelBtn');
        trainBtn.disabled = true;
        trainBtn.textContent = 'Training...';
        
        // Simulate training delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show results
        this.displayModelResults();
        
        trainBtn.disabled = false;
        trainBtn.textContent = 'Train Model';
    }

    displayModelResults() {
        const results = this.dataset.model_results;
        
        document.getElementById('accuracyValue').textContent = `${(results.accuracy * 100).toFixed(1)}%`;
        document.getElementById('precisionValue').textContent = `${(results.precision * 100).toFixed(1)}%`;
        document.getElementById('recallValue').textContent = `${(results.recall * 100).toFixed(1)}%`;
        document.getElementById('f1Value').textContent = `${(results.f1_score * 100).toFixed(1)}%`;
        
        document.getElementById('modelResults').classList.remove('hidden');
        
        // Create feature importance chart
        this.createFeatureImportanceChart();
    }

    createFeatureImportanceChart() {
        const canvas = document.getElementById('featureImportanceChart');
        const ctx = canvas.getContext('2d');
        
        const importance = this.dataset.model_results.feature_importance;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(importance),
                datasets: [{
                    label: 'Importance',
                    data: Object.values(importance),
                    backgroundColor: '#1FB8CD'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 0.3
                    }
                }
            }
        });
    }

    addModelResultsToCanvas() {
        this.createChart('model-results', 'ML Model Feature Importance', 'bar', {
            x: 200,
            y: 800,
            width: 450,
            height: 300
        });
        
        this.closeModelBuilder();
        this.addChatMessage('ai', 'I\'ve added your ML model results to the canvas! The Random Forest model achieved 82.3% accuracy with gender and fare being the most important features.');
    }

    exportCanvas() {
        // Simulate export functionality
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--color-success);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = 'Canvas exported successfully!';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateCanvasTransform() {
        const canvasContent = document.getElementById('canvasContent');
        canvasContent.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px) scale(${this.canvasZoom})`;
    }
}

// Initialize the application
const app = new AskYourDataApp();

// Global functions for inline event handlers
window.app = app;