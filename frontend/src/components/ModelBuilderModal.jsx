import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ModelBuilderModal = ({ onClose, onAddToCanvas, dataset }) => {
    const [isTraining, setIsTraining] = useState(false);
    const [results, setResults] = useState(null);

    const handleTrainModel = async () => {
        setIsTraining(true);
        await new Promise(res => setTimeout(res, 2000)); // Simulate training
        setResults(dataset.model_results);
        setIsTraining(false);
    };

    const features = ['Pclass', 'Sex', 'Age', 'SibSp', 'Parch', 'Fare', 'Embarked'];
    const defaultFeatures = ['Pclass', 'Sex', 'Age', 'Fare'];

    const chartData = {
        labels: results ? Object.keys(results.feature_importance) : [],
        datasets: [{
            label: 'Importance',
            data: results ? Object.values(results.feature_importance) : [],
            backgroundColor: '#1FB8CD'
        }]
    };
    
    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3>Machine Learning Model Builder</h3>
                    <button className="btn-icon modal-close" onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div className="modal-content">
                    {!results ? (
                        <div className="model-config">
                            <div className="form-group"><label className="form-label">Target Variable</label><select className="form-control"><option>Survived</option></select></div>
                            <div className="form-group">
                                <label className="form-label">Features</label>
                                <div className="feature-checkboxes">
                                    {features.map(f => (
                                        <div key={f} className="feature-checkbox">
                                            <input type="checkbox" id={`feat-${f}`} defaultChecked={defaultFeatures.includes(f)} /><label htmlFor={`feat-${f}`}>{f}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button className="btn btn--primary" onClick={handleTrainModel} disabled={isTraining}>
                                {isTraining ? 'Training...' : 'Train Model'}
                            </button>
                        </div>
                    ) : (
                        <div className="model-results fade-in">
                            <h4>Model Performance</h4>
                            <div className="metrics-grid">
                                <div className="metric"><span className="metric-label">Accuracy</span><span className="metric-value">{(results.accuracy * 100).toFixed(1)}%</span></div>
                                <div className="metric"><span className="metric-label">Precision</span><span className="metric-value">{(results.precision * 100).toFixed(1)}%</span></div>
                                <div className="metric"><span className="metric-label">Recall</span><span className="metric-value">{(results.recall * 100).toFixed(1)}%</span></div>
                                <div className="metric"><span className="metric-label">F1 Score</span><span className="metric-value">{(results.f1_score * 100).toFixed(1)}%</span></div>
                            </div>
                            <div className="feature-importance">
                                <h5>Feature Importance</h5>
                                <div style={{height: '200px'}}>
                                    <Bar options={chartOptions} data={chartData} />
                                </div>
                            </div>
                            <button className="btn btn--secondary mt-8" onClick={onAddToCanvas}>Add Results to Canvas</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelBuilderModal;