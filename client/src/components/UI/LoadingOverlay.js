import React from 'react';

const LoadingOverlay = ({ progress }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h3>Loading Titanic Dataset</h3>
        <p>Analyzing data structure and generating initial visualizations...</p>
        <div className="loading-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;