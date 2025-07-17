import React, { useRef } from 'react';

const ChartCard = ({ id, title, base64, position, onRemove, onPositionChange, zoom, handDrawnMode }) => {
  const chartRef = useRef(null);
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    const chartElement = chartRef.current;
    if (!chartElement) return;

    chartElement.classList.add('dragging');

    const startX = position.x;
    const startY = position.y;
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;

    const handleMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - initialMouseX) / zoom;
      const dy = (moveEvent.clientY - initialMouseY) / zoom;
      chartElement.style.left = `${startX + dx}px`;
      chartElement.style.top = `${startY + dy}px`;
    };

    const handleMouseUp = (upEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      chartElement.classList.remove('dragging');
      
      const dx = (upEvent.clientX - initialMouseX) / zoom;
      const dy = (upEvent.clientY - initialMouseY) / zoom;
      onPositionChange(id, { x: startX + dx, y: startY + dy });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={chartRef}
      className={`chart-object ${handDrawnMode ? 'hand-drawn' : ''}`}
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${position.width}px`, height: `${position.height}px` }}
    >
      <div className="chart-header" onMouseDown={handleMouseDown}>
        <h4 className="chart-title">{title}</h4>
        <div className="chart-actions">
          <button className="btn-icon" onClick={onRemove}>
             <svg width="14" height="14" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div className="chart-body" style={{ padding: '8px' }}>
        <img 
          src={`data:image/png;base64,${base64}`} 
          alt={title} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          // Prevent image's default drag behavior
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
};

export default ChartCard;