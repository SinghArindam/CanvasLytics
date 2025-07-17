import React from 'react';

const LeftSidebar = ({ isDataLoaded, onLoadData, dataset }) => {
  return (
    <aside className="sidebar sidebar--left" id="leftSidebar">
      <div className="sidebar-header">
        <h3>Dataset Overview</h3>
      </div>
      <div className="sidebar-content">
        {!isDataLoaded ? (
          <div className="data-status">
            <div className="empty-state">
              <p>No dataset loaded</p>
              <button className="btn btn--primary btn--sm" onClick={onLoadData}>
                Load Titanic Dataset
              </button>
            </div>
          </div>
        ) : (
          <div className="dataset-info">
            <div className="info-card">
              <h4>Titanic Survival Dataset</h4>
              <div className="stats-grid">
                <div className="stat"><span className="stat-label">Total Rows</span><span className="stat-value">{dataset.total_rows}</span></div>
                <div className="stat"><span className="stat-label">Columns</span><span className="stat-value">{dataset.columns_count}</span></div>
                <div className="stat"><span className="stat-label">Missing Values</span><span className="stat-value">{dataset.missing_values}</span></div>
              </div>
            </div>
            <div className="columns-summary">
              <h5>Column Summary</h5>
              <div className="columns-list">
                {Object.entries(dataset.columns).map(([name, info]) => (
                  <div className="column-item" key={name}>
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

export default LeftSidebar;