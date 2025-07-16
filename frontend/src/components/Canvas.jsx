import React, { useState, useRef } from 'react';
import ChartObject from './ChartObject';

const Canvas = ({ children, charts, setCharts }) => {
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);

    const handleMouseDown = (e) => {
        if (e.target !== canvasRef.current && e.target.className !== 'canvas-content') return;
        setIsPanning(true);
        setStartPoint({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        e.target.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (!isPanning) return;
        setPan({ x: e.clientX - startPoint.x, y: e.clientY - startPoint.y });
    };

    const handleMouseUp = (e) => {
        setIsPanning(false);
        if (e.target.style) e.target.style.cursor = 'grab';
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(0.2, zoom + delta), 3);
        setZoom(newZoom);
    };

    return (
        <div 
            className="canvas-container" 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Stop panning if mouse leaves canvas
            onWheel={handleWheel}
        >
            <div className="canvas-wrapper" ref={canvasRef} style={{ cursor: 'grab' }}>
                <div className="canvas-grid"></div>
                <div
                    className="canvas-content"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                >
                    {children}
                    {charts.map((chart) => (
                        <ChartObject
                            key={chart.id}
                            id={chart.id}
                            title={chart.title}
                            type={chart.type}
                            initialPosition={chart.position}
                            onRemove={(id) => setCharts(charts.filter(c => c.id !== id))}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Canvas;