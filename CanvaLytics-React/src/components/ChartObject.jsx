import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const ChartObject = ({ id, title, type, initialPosition, onRemove }) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartOffset = useRef({ x: 0, y: 0 });
    const chartRef = useRef(null);

    const handleMouseDown = (e) => {
        // Only drag if the header is clicked
        if (e.target.closest('.chart-header')) {
            setIsDragging(true);
            const chartRect = chartRef.current.getBoundingClientRect();
            // We need to account for the canvas zoom/pan when calculating offset
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

    const getChartData = () => {
        switch (id) {
            case 'survival-overview':
                return { labels: ['Survived', 'Did not survive'], datasets: [{ data: [342, 549], backgroundColor: ['#1FB8CD', '#FFC185'], borderWidth: 0 }] };
            case 'survival-by-class':
                return { labels: ['1st Class', '2nd Class', '3rd Class'], datasets: [{ label: 'Survived', data: [136, 87, 119], backgroundColor: '#1FB8CD' }, { label: 'Did not survive', data: [80, 97, 372], backgroundColor: '#FFC185' }] };
            case 'age-distribution':
                 return { labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+'], datasets: [{ label: 'Count', data: [62, 102, 220, 167, 89, 42, 33], backgroundColor: '#B4413C' }] };
            case 'survival-by-gender':
                 return { labels: ['Male', 'Female'], datasets: [{ label: 'Survived', data: [109, 233], backgroundColor: '#1FB8CD' }, { label: 'Did not survive', data: [468, 81], backgroundColor: '#FFC185' }] };
            case 'model-results':
                 return { labels: ["Sex", "Fare", "Age", "Pclass", "SibSp", "Parch"], datasets: [{ label: 'Importance', data: [0.287, 0.268, 0.178, 0.156, 0.061, 0.050], backgroundColor: '#1FB8CD' }]};
            default: return {};
        }
    };

    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom' }}};

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
                {type === 'doughnut' && <Doughnut data={getChartData()} options={chartOptions} />}
                {type === 'bar' && <Bar data={getChartData()} options={chartOptions} />}
            </div>
            <div className="resize-handle"></div>
        </div>
    );
};

export default ChartObject;