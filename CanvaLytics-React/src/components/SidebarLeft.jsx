import React, { useState } from 'react';

const SidebarLeft = ({ isDataLoaded, onLoadData, dataset }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={`sidebar sidebar--left ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <h3>Dataset Overview</h3>
                <button className="btn-icon sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
            </div>
            <div className="sidebar-content">
                {!isDataLoaded ? (
                    <div className="data-status">
                        <div className="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
                            <p>No dataset loaded</p>
                            <button className="btn btn--primary btn--sm" onClick={onLoadData}>Load Titanic Dataset</button>
                        </div>
                    </div>
                ) : (
                    <div className="dataset-info">
                        <div className="info-card">
                            <h4>Titanic Survival Dataset</h4>
                            <div className="stats-grid">
                                <div className="stat"><span className="stat-label">Total Rows</span><span className="stat-value">891</span></div>
                                <div className="stat"><span className="stat-label">Columns</span><span className="stat-value">12</span></div>
                                <div className="stat"><span className="stat-label">Missing Values</span><span className="stat-value">866</span></div>
                            </div>
                            <div className="last-loaded"><small className="text-secondary">Loaded: <span>{new Date().toLocaleTimeString()}</span></small></div>
                        </div>
                        <div className="columns-summary">
                            <h5>Column Summary</h5>
                            <div className="columns-list">
                                {Object.entries(dataset.columns).map(([name, info]) => (
                                    <div key={name} className="column-item">
                                        <span className="column-name">{name}</span>
                                        <span className="column-type">{info.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default SidebarLeft;