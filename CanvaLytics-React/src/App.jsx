import React, { useState } from 'react';
import Header from './components/Header';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Canvas from './components/Canvas';
import LoadingOverlay from './components/LoadingOverlay';
import ModelBuilderModal from './components/ModelBuilderModal';
import WelcomeMessage from './components/WelcomeMessage';
import { titanicDataset } from './data/titanic';

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [charts, setCharts] = useState([]);
    const [chatMessages, setChatMessages] = useState([
        { sender: 'ai', text: "Hello! I'm your AI assistant. Load a dataset and I'll help you explore it." }
    ]);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);

    const initialCharts = [
        { id: 'survival-overview', title: 'Survival Rate Overview', type: 'doughnut', position: { x: 100, y: 100, width: 350, height: 300 } },
        { id: 'survival-by-class', title: 'Survival by Passenger Class', type: 'bar', position: { x: 500, y: 100, width: 400, height: 300 } },
        { id: 'age-distribution', title: 'Age Distribution', type: 'bar', position: { x: 100, y: 450, width: 400, height: 300 } },
        { id: 'survival-by-gender', title: 'Survival by Gender', type: 'bar', position: { x: 550, y: 450, width: 350, height: 300 } },
    ];
    
    const handleLoadData = async () => {
        setIsLoading(true);
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 3500));
        setIsLoading(false);
        setIsDataLoaded(true);
        setCharts(initialCharts);
        addChatMessage('ai', "Great! I've loaded the Titanic dataset and created some initial visualizations. What would you like to explore?");
    };
    
    const addChatMessage = (sender, text) => {
        setChatMessages(prev => [...prev, { sender, text }]);
    };

    const addModelResultsToCanvas = () => {
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
                    dataset={titanicDataset}
                />
                <Canvas charts={charts} setCharts={setCharts}>
                    {!isDataLoaded && <WelcomeMessage onLoadData={handleLoadData} />}
                </Canvas>
                <SidebarRight
                    isDataLoaded={isDataLoaded}
                    messages={chatMessages}
                    addMessage={addChatMessage}
                    dataset={titanicDataset}
                    onOpenModelBuilder={() => setIsModelModalOpen(true)}
                />
            </main>
            {isLoading && <LoadingOverlay />}
            {isModelModalOpen && (
                <ModelBuilderModal
                    onClose={() => setIsModelModalOpen(false)}
                    onAddToCanvas={addModelResultsToCanvas}
                    dataset={titanicDataset}
                />
            )}
        </>
    );
}

export default App;