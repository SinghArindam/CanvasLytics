import React, { useState } from 'react';

const Header = ({ onLoadData }) => {
    const [zoomLevel, setZoomLevel] = useState(100);

    const handleExport = () => {
        alert("Export functionality would be implemented here.");
    };
    
    return (
        <header className="header">
            <div className="header-left">
                <div className="logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                    </svg>
                    <span className="logo-text">CanvaLytics</span>
                </div>
            </div>
            <div className="header-center">
                 {/* Canvas controls are handled within the Canvas component now */}
            </div>
            <div className="header-right">
                <button className="btn btn--outline" onClick={onLoadData}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
                    Load Titanic Data
                </button>
                <button className="btn btn--secondary" onClick={handleExport}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export
                </button>
                <div className="user-menu">
                    <button className="btn-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;