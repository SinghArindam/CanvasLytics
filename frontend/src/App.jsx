import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Canvas from './components/Canvas';
import LoadingOverlay from './components/LoadingOverlay';
import ModelBuilderModal from './components/ModelBuilderModal';
import WelcomeMessage from './components/WelcomeMessage';
import { titanicDataset as simulatedDataset } from './data/titanic';
import { API_BASE_URL } from './apiConfig'; // Import the API base URL

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [charts, setCharts] = useState([]);
    const [chatMessages, setChatMessages] = useState([
        { sender: 'ai', text: "Hello! I'm your AI assistant. Load a dataset and I'll help you explore it." }
    ]);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [dataset, setDataset] = useState(null); // State to hold loaded data

    const handleLoadData = async () => {
        setIsLoading(true);
        try {
            // Call the backend API to load the CSV
            const response = await fetch(`${API_BASE_URL}/load_csv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Empty body as the default titanic URL is used
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setDataset(data); // Store the loaded dataset metadata
            
            // Now, fetch each default chart's image from the backend
            const chartEndpoints = [
                { id: 'survival-overview', title: 'Survival Rate Overview', ep: `chart/survival_overview/${data.dataset_id}`, pos: { x: 100, y: 100, width: 350, height: 300 } },
                { id: 'survival-by-class', title: 'Survival by Passenger Class', ep: `chart/survival_by_class/${data.dataset_id}`, pos: { x: 500, y: 100, width: 400, height: 300 } },
                { id: 'age-distribution', title: 'Age Distribution', ep: `chart/age_hist/${data.dataset_id}`, pos: { x: 100, y: 450, width: 400, height: 300 } },
                { id: 'survival-by-gender', title: 'Survival by Gender', ep: `chart/survival_by_gender/${data.dataset_id}`, pos: { x: 550, y: 450, width: 350, height: 300 } },
            ];

            const chartPromises = chartEndpoints.map(async chartInfo => {
                const chartRes = await fetch(`${API_BASE_URL}/${chartInfo.ep}`);
                const chartData = await chartRes.json();
                return { ...chartInfo, png: chartData.png }; // Add the base64 png to the chart info
            });

            const loadedCharts = await Promise.all(chartPromises);

            setCharts(loadedCharts);
            setIsDataLoaded(true);
            addChatMessage('ai', "Great! I've loaded the Titanic dataset and created some initial visualizations. What would you like to explore?");

        } catch (error) {
            console.error("Failed to load data or charts:", error);
            addChatMessage('ai', `Sorry, I couldn't load the data. Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const addChatMessage = (sender, text) => {
        setChatMessages(prev => [...prev, { sender, text }]);
    };

    const addModelResultsToCanvas = () => {
        // This function can be updated later to fetch real model results
        const modelChart = {
            id: 'model-results',
            title: 'ML Model Feature Importance',
            type: 'bar',
            position: { x: 200, y: 800, width: 450, height: 300 }
        };
        setCharts(prev => [...prev, modelChart]);
        addChatMessage('ai', "I've added your ML model results to the canvas! The Random Forest model achieved 82.3% accuracy.");
        setIsModelModalOpen(false);
    };

    return (
        <>
            <Header onLoadData={handleLoadData} />
            <main className="main-content">
                <SidebarLeft
                    isDataLoaded={isDataLoaded}
                    onLoadData={handleLoadData}
                    dataset={dataset || simulatedDataset} // Fallback to simulated for initial UI
                />
                <Canvas charts={charts} setCharts={setCharts}>
                    {!isDataLoaded && <WelcomeMessage onLoadData={handleLoadData} />}
                </Canvas>
                <SidebarRight
                    isDataLoaded={isDataLoaded}
                    messages={chatMessages}
                    addMessage={addChatMessage}
                    dataset={dataset || simulatedDataset}
                    onOpenModelBuilder={() => setIsModelModalOpen(true)}
                />
            </main>
            {isLoading && <LoadingOverlay />}
            {isModelModalOpen && (
                <ModelBuilderModal
                    onClose={() => setIsModelModalOpen(false)}
                    onAddToCanvas={addModelResultsToCanvas}
                    dataset={dataset || simulatedDataset}
                />
            )}
        </>
    );
}

export default App;