import React, { useRef } from 'react';

const WelcomeMessage = ({ onFileLoad, onLoadFromUrl }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileLoad(file);
  };
  
  const handleUploadClick = () => fileInputRef.current.click();
  
  const titanicUrl = 'https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv';

  return (
    <div className="welcome-message" id="welcomeMessage">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".csv,.json" />
      <div className="welcome-content">
        <h2>Welcome to Ask-Your-Data</h2>
        <p>Load a dataset to start exploring and analyzing your data with AI-powered insights.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn--primary" onClick={() => onLoadFromUrl(titanicUrl)}>Load Sample Dataset</button>
            <button className="btn btn--secondary" onClick={handleUploadClick}>Upload From Computer</button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;