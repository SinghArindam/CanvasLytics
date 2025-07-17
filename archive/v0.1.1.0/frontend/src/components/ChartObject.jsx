import React, { useState, useEffect, useRef } from 'react';

const ChartObject = ({ id, title, png, initialPosition, onRemove }) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartOffset = useRef({ x: 0, y: 0 });
    const chartRef = useRef(null);

    const handleMouseDown = (e) => {
        if (e.target.closest('.chart-header')) {
            setIsDragging(true);
            const chartRect = chartRef.current.getBoundingClientRect();
            const canvasTransform = chartRef.current.parentElement.style.transform;
            const scaleMatch = canvasTransform.match(/scale\(([^)]+)\)/);
            const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
            
            dragStartOffset.current = {
                x: e.clientX - chartRect.left,
                y: e.clientY - chartRect.top,
            };
            e.stopPropagation();
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const canvasTransform = chartRef.current.parentElement.style.transform;
            const scaleMatch = canvasTransform.match(/scale\(([^)]+)\)/);
            const translateMatch = canvasTransform.match(/translate\(([^p]+)px, ([^p]+)px\)/);
            
            const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
            const pan = translateMatch ? {x: parseFloat(translateMatch[1]), y: parseFloat(translateMatch[2])} : {x: 0, y: 0};

            const newX = (e.clientX - pan.x - dragStartOffset.current.x) / scale;
            const newY = (e.clientY - pan.y - dragStartOffset.current.y) / scale;

            setPosition(p => ({ ...p, x: newX, y: newY }));
        };

        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            ref={chartRef}
            className="chart-object"
            style={{ top: `${position.y}px`, left: `${position.x}px`, width: `${position.width}px`, height: `${position.height}px`, zIndex: isDragging ? 1000 : 1 }}
            onMouseDown={handleMouseDown}
        >
            <div className="chart-header" style={{cursor: 'move'}}>
                <h4 className="chart-title">{title}</h4>
                <div className="chart-actions">
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
            <div className="chart-body">
                {/* Render the image from the backend */}
                <img src={`data:image/png;base64,${png}`} alt={title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="resize-handle"></div>
        </div>
    );
};

export default ChartObject;