import React, { useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const ChartCard = ({ id, title, type, position, onRemove, onPositionChange, zoom, handDrawnMode }) => {
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

  const chartData = getChartData(id);
  const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom' }, title: { display: false } } };

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
      <div className="chart-body">
        {type === 'doughnut' && <Doughnut data={chartData} options={options} />}
        {type === 'bar' && <Bar data={chartData} options={options} />}
      </div>
    </div>
  );
};

// This function simulates the specific chart data from your app.js
function getChartData(id) {
    switch (id) {
        case 'survival-overview': return { labels: ['Survived', 'Did not survive'], datasets: [{ data: [342, 549], backgroundColor: ['#1FB8CD', '#FFC185'] }] };
        case 'survival-by-class': return { labels: ['1st', '2nd', '3rd'], datasets: [{ label: 'Survived', data: [136, 87, 119], backgroundColor: '#1FB8CD' }, { label: 'Did not survive', data: [80, 97, 372], backgroundColor: '#FFC185' }]};
        case 'age-distribution': return { labels: ['0-10', '11-20', '21-30', '31-40', '41-50'], datasets: [{ label: 'Count', data: [62, 102, 220, 167, 89], backgroundColor: '#B4413C' }]};
        case 'survival-by-gender': return { labels: ['Male', 'Female'], datasets: [{ label: 'Survived', data: [109, 233], backgroundColor: '#1FB8CD' }, { label: 'Did not survive', data: [468, 81], backgroundColor: '#FFC185' }]};
        default: return { labels: [], datasets: [] };
    }
}

export default ChartCard;