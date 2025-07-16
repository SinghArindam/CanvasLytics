import React from 'react';

const WelcomeMessage = ({ onLoadData }) => {
    return (
        <div className="welcome-message">
            <div className="welcome-content">
                <h2>Welcome to CanvaLytics</h2>
                <p>Load the Titanic dataset to start exploring and analyzing your data with AI-powered insights.</p>
                <button className="btn btn--primary" onClick={onLoadData}>Load Titanic Dataset</button>
            </div>
        </div>
    );
};

export default WelcomeMessage;