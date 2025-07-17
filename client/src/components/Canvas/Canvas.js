import React, { useRef } from 'react';
import ChartCard from './ChartCard';

const Canvas = ({ charts, removeChart, updateChartPosition, zoom, offset, setOffset, handDrawnMode }) => {
  const isPanning = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('canvas-wrapper') || e.target.classList.contains('canvas-content') || e.target.classList.contains('canvas-grid')) {
      isPanning.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMousePosition.current.x;
    const dy = e.clientY - lastMousePosition.current.y;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = (e) => {
    isPanning.current = false;
    e.currentTarget.style.cursor = 'grab';
  };

  return (
    <div
      className="canvas-wrapper"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="canvas-grid"></div>
      <div
        className="canvas-content"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      >
        {charts.map(chart => (
          <ChartCard
            key={chart.id}
            id={chart.id}
            title={chart.title}
            type={chart.type}
            position={chart.position}
            onRemove={() => removeChart(chart.id)}
            onPositionChange={updateChartPosition}
            zoom={zoom}
            handDrawnMode={handDrawnMode}
          />
        ))}
      </div>
    </div>
  );
};

export default Canvas;