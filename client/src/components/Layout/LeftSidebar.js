import React, { useRef, useState } from 'react';

const LeftSidebar = ({ isDataLoaded, onFileLoad, onLoadFromUrl, datasetSummary }) => {
  const fileInputRef = useRef(null);
  const [customUrl, setCustomUrl] = useState('');
  
  // Use the raw GitHub content URL for the Titanic dataset
  const titanicUrl = 'https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileLoad(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <aside className="sidebar sidebar--left" id="leftSidebar">
      <div className="sidebar-header">
        <h3>Dataset Overview</h3>
      </div>
      <div className="sidebar-content">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".csv,.json"
        />
        {!isDataLoaded ? (
          <div className="data-status">
            <div className="empty-state">
              <button className="btn btn--primary btn--sm" style={{width: '100%'}} onClick={handleUploadClick}>
                Upload File
              </button>
              <button className="btn btn--secondary btn--sm" style={{width: '100%', marginTop: '8px'}} onClick={() => onLoadFromUrl(titanicUrl)}>
                Load Sample Titanic Dataset
              </button>
              <div className="url-loader">
                <label className="form-label" style={{marginBottom: 0}}>Or load from URL</label>
                <div className="url-input-group">
                   <input
                      type="text"
                      className="form-control"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://.../data.csv"
                    />
                    <button className="btn btn--secondary" onClick={() => onLoadFromUrl(customUrl)}>Load</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          datasetSummary && (
            <div className="dataset-info">
              {/* This part remains unchanged */}
            </div>
          )
        )}
      </div>
    </aside>
  );
};

export default LeftSidebar;