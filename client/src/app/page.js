"use client";

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Header from '@/components/Layout/Header';
import LeftSidebar from '@/components/Layout/LeftSidebar';
import RightSidebar from '@/components/Layout/RightSidebar';
import Canvas from '@/components/Canvas/Canvas';
import WelcomeMessage from '@/components/UI/WelcomeMessage';
import LoadingOverlay from '@/components/UI/LoadingOverlay';
import { useWebSocket } from '@/hooks/useWebSocket';
import { dataset } from '@/lib/mockData'; // Import dummy data

// Define the static questions here
const TOP_QUESTIONS = [
  "What factors most influenced survival rates?",
  "How did passenger class affect survival?",
  "What was the age distribution of survivors?",
  "Did fare price correlate with survival?",
  "How did family size impact survival chances?"
];

export default function HomePage() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [datasetSummary, setDatasetSummary] = useState(null);
  const [rawDataset, setRawDataset] = useState(null);
  
  const [charts, setCharts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  // State for canvas interactions
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [handDrawnMode, setHandDrawnMode] = useState(false);

  // Connect to backend WebSocket
  const agentUrl = process.env.NEXT_PUBLIC_AGENT_WS_URL;
  const { messages: wsMessages, sendMessage, isConnected } = useWebSocket(agentUrl);

  // Effect to handle incoming messages from the backend
  useEffect(() => {
    if (wsMessages.length === 0) return;
    const latestMessage = wsMessages[wsMessages.length - 1];
    
    if (latestMessage.status === 'error') {
      console.error("Backend Error:", latestMessage.message);
      addChatMessage('ai', `An error occurred: ${latestMessage.message}`);
      setIsLoading(false);
      return;
    }

    if (latestMessage.summary) {
      setDatasetSummary(latestMessage.summary);
    }
    if (latestMessage.charts) {
      const newCharts = latestMessage.charts.map((chart, index) => ({
        id: `chart-${Date.now()}-${index}`,
        title: chart.chart_name,
        type: 'image',
        base64: chart.image_base64,
        position: { x: 100 + (index % 3) * 450, y: 100 + Math.floor(index / 3) * 350, width: 400, height: 300 }
      }));
      setCharts(newCharts);
      setIsDataLoaded(true);
      setIsLoading(false);
    }
    // UPDATED: Handle chat responses from the backend
    if (latestMessage.chat_response) {
       addChatMessage('ai', latestMessage.chat_response);
    }
  }, [wsMessages]);

  const addChatMessage = (sender, text) => {
    setChatMessages(prev => [...prev, { sender, text }]);
  };

  // UPDATED: This function now sends the chat message to the backend agent
  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    addChatMessage('user', text);
    // Send the query and the current dataset to the backend
    sendMessage('natural_language_query', { query: text, data: rawDataset });
  };
  
  // NEW: Function to load dummy data directly
  const handleLoadDummyData = () => {
    setIsLoading(true);
    setCharts([]);
    setChatMessages([]);

    setTimeout(() => {
      setDatasetSummary(dataset.summary);
      setCharts(dataset.charts);
      setRawDataset(dataset.raw); // Store raw dummy data for chat queries
      setIsDataLoaded(true);
      setIsLoading(false);
      addChatMessage('ai', 'Dummy Titanic dataset loaded successfully! You can now ask me questions about it.');
    }, 1500);
  };

  // --- Functions for real data loading ---
  const processData = (text, fileName) => {
    let data;
    if (fileName.endsWith('.csv')) {
      data = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
    } else if (fileName.endsWith('.json')) {
      data = JSON.parse(text);
    } else {
      alert('Unsupported file type. Please use .csv or .json');
      setIsLoading(false);
      return;
    }
    setRawDataset(data);
    setChatMessages([]);
    sendMessage('get_initial_visualizations', { data });
    sendMessage('get_dataset_summary', { data });
    addChatMessage('ai', `Analyzing ${fileName}...`);
  };
  
  const handleFileLoad = (file) => {
    setIsLoading(true);
    setCharts([]);
    const reader = new FileReader();
    reader.onload = (e) => processData(e.target.result, file.name);
    reader.readAsText(file);
  };
  
  const handleLoadFromUrl = async (url) => {
    if (!url) return;
    setIsLoading(true);
    setCharts([]);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const fileName = new URL(url).pathname.split('/').pop();
      processData(text, fileName);
    } catch (error) {
      console.error("Failed to fetch from URL:", error);
      alert(`Failed to load data from URL. Please check the URL and CORS policy.\nError: ${error.message}`);
      setIsLoading(false);
    }
  };
  
  // --- Canvas interaction handlers ---
  const handleZoom = (direction) => {
    const zoomFactor = 1.2;
    if (direction === 'in') setZoom(prev => Math.min(prev * zoomFactor, 3));
    else if (direction === 'out') setZoom(prev => Math.max(prev / zoomFactor, 0.2));
  };
  const handleResetView = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };
  const toggleHandDrawn = () => setHandDrawnMode(prev => !prev);
  const handleUpdateChartPosition = (id, newPosition) => {
    setCharts(prevCharts =>
      prevCharts.map(chart => chart.id === id ? { ...chart, position: { ...chart.position, x: newPosition.x, y: newPosition.y } } : chart)
    );
  };
  const removeChart = (id) => setCharts(prev => prev.filter(chart => chart.id !== id));

  return (
    <>
      <Header isConnected={isConnected} zoomLevel={zoom} onZoomIn={() => handleZoom('in')} onZoomOut={() => handleZoom('out')} onResetView={handleResetView} handDrawnMode={handDrawnMode} onToggleHandDrawn={toggleHandDrawn} />
      <main className="main-content">
        <LeftSidebar 
          isDataLoaded={isDataLoaded} 
          onFileLoad={handleFileLoad}
          onLoadFromUrl={handleLoadFromUrl}
          onLoadDummyData={handleLoadDummyData} // Pass new handler
          datasetSummary={datasetSummary}
        />
        <div className="canvas-container">
          {isDataLoaded ? (
            <Canvas charts={charts} removeChart={removeChart} updateChartPosition={handleUpdateChartPosition} zoom={zoom} offset={offset} setOffset={setOffset} handDrawnMode={handDrawnMode} />
          ) : (
            <div className="canvas-wrapper">
              <div className="canvas-grid"></div>
              <WelcomeMessage 
                onFileLoad={handleFileLoad} 
                onLoadFromUrl={handleLoadFromUrl} 
                onLoadDummyData={handleLoadDummyData} // Pass new handler
              />
            </div>
          )}
        </div>
        <RightSidebar
          isDataLoaded={isDataLoaded}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          topQuestions={TOP_QUESTIONS}
        />
      </main>
      {isLoading && <LoadingOverlay />}
    </>
  );
}