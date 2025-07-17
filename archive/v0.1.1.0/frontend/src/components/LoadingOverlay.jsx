import React, { useState, useEffect } from 'react';

const LoadingOverlay = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const steps = [20, 45, 70, 90, 100];
        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                setProgress(steps[currentStep]);
                currentStep++;
            } else {
                clearInterval(interval);
            }
        }, 600);
        return () => clearInterval(interval);
    }, []);

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