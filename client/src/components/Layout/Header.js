import React from 'react';

const Header = ({ onLoadData, zoomLevel, onZoomIn, onZoomOut, onResetView, handDrawnMode, onToggleHandDrawn }) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
          <span className="logo-text">CanvasLytics</span>
        </div>
      </div>
      <div className="header-center">
        <div className="canvas-controls">
          <button className="btn-icon" title="Zoom Out" onClick={onZoomOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <span className="zoom-level" onClick={onResetView} title="Reset View" style={{cursor: 'pointer'}}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button className="btn-icon" title="Zoom In" onClick={onZoomIn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <div className="divider"></div>
          <button 
            className={`btn-icon hand-drawn-toggle ${handDrawnMode ? 'active' : ''}`} 
            title="Toggle Hand-drawn Style"
            onClick={onToggleHandDrawn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="header-right">
        <button className="btn btn--outline" onClick={onLoadData}>
          Load Titanic Data
        </button>
        <button className="btn btn--secondary">
          Export
        </button>
      </div>
    </header>
  );
};

export default Header;