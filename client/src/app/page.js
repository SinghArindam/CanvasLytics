"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Layout/Header';
import LeftSidebar from '@/components/Layout/LeftSidebar';
import RightSidebar from '@/components/Layout/RightSidebar';
import Canvas from '@/components/Canvas/Canvas';
import WelcomeMessage from '@/components/UI/WelcomeMessage';
import LoadingOverlay from '@/components/UI/LoadingOverlay';
import { dataset } from '@/lib/mockData';

export default function HomePage() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [charts, setCharts] = useState([]);
  const [messages, setMessages] = useState([]);
  
  // State for canvas interactions
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [handDrawnMode, setHandDrawnMode] = useState(false); // New state

  useEffect(() => {
    setMessages([{
      sender: 'ai',
      text: "Hello! I'm your AI assistant. Load a dataset and I'll help you explore it with natural language queries and automated insights."
    }]);
  }, []);

  const handleLoadData = async () => {
    setIsLoading(true);
    const steps = [20, 45, 70, 90, 100];
    for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setLoadingProgress(step);
    }

    setIsDataLoaded(true);
    setIsLoading(false);
    addMessage('ai', 'Great! I\'ve loaded the Titanic dataset and created some initial visualizations. What would you like to explore?');

    setCharts([
      { id: 'survival-overview', title: 'Survival Rate Overview', type: 'doughnut', position: { x: 100, y: 100, width: 350, height: 300 } },
      { id: 'survival-by-class', title: 'Survival by Passenger Class', type: 'bar', position: { x: 500, y: 100, width: 400, height: 300 } },
      { id: 'age-distribution', title: 'Age Distribution', type: 'bar', position: { x: 100, y: 450, width: 400, height: 300 } },
      { id: 'survival-by-gender', title: 'Survival by Gender', type: 'bar', position: { x: 550, y: 450, width: 350, height: 300 } }
    ]);
  };

  const handleZoom = (direction) => {
    const zoomFactor = 1.2;
    if (direction === 'in') {
      setZoom(prev => Math.min(prev * zoomFactor, 3));
    } else if (direction === 'out') {
      setZoom(prev => Math.max(prev / zoomFactor, 0.2));
    }
  };

  const handleResetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  
  // New handler for hand-drawn toggle
  const toggleHandDrawn = () => setHandDrawnMode(prev => !prev);
  
  const handleUpdateChartPosition = (id, newPosition) => {
    setCharts(prevCharts =>
      prevCharts.map(chart =>
        chart.id === id ? { ...chart, position: { ...chart.position, x: newPosition.x, y: newPosition.y } } : chart
      )
    );
  };

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  const handleSendMessage = (text) => {
    addMessage('user', text);
    setTimeout(() => {
        const lowerMessage = text.toLowerCase();
        let response = 'I can help you explore that aspect of the data. ';
        if (lowerMessage.includes('factor')) response += dataset.insights[0];
        else if (lowerMessage.includes('class')) response += dataset.insights[1];
        else if (lowerMessage.includes('age')) response += dataset.insights[2];
        else response += 'Let me analyze that for you. Would you like a new visualization?';
        addMessage('ai', response);
    }, 1000);
  };
  
  const removeChart = (id) => {
    setCharts(prev => prev.filter(chart => chart.id !== id));
  };

  return (
    <>
      <Header 
        onLoadData={handleLoadData}
        zoomLevel={zoom}
        onZoomIn={() => handleZoom('in')}
        onZoomOut={() => handleZoom('out')}
        onResetView={handleResetView}
        handDrawnMode={handDrawnMode}
        onToggleHandDrawn={toggleHandDrawn}
      />
      <main className="main-content">
        <LeftSidebar isDataLoaded={isDataLoaded} onLoadData={handleLoadData} dataset={dataset} />
        <div className="canvas-container">
          {isDataLoaded ? (
            <Canvas
              charts={charts}
              removeChart={removeChart}
              updateChartPosition={handleUpdateChartPosition}
              zoom={zoom}
              offset={offset}
              setOffset={setOffset}
              handDrawnMode={handDrawnMode}
            />
          ) : (
            <div className="canvas-wrapper">
              <div className="canvas-grid"></div>
              <WelcomeMessage onLoadData={handleLoadData} />
            </div>
          )}
        </div>
        <RightSidebar
          isDataLoaded={isDataLoaded}
          messages={messages}
          onSendMessage={handleSendMessage}
          topQuestions={dataset.top_questions}
        />
      </main>
      {isLoading && <LoadingOverlay progress={loadingProgress} />}
    </>
  );
}