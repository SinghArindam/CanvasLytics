import React, { useState, useEffect, useRef } from 'react';

const SidebarRight = ({ isDataLoaded, messages, addMessage, dataset, onOpenModelBuilder }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const chatMessagesEndRef = useRef(null);

    const scrollToBottom = () => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        addMessage('user', inputValue);
        // Simulate AI Response
        setTimeout(() => simulateAIResponse(inputValue), 1000);
        setInputValue('');
    };
    
    const simulateAIResponse = (userMessage) => {
        const responses = {
            'factors': 'Based on the analysis, the most influential factors for survival were gender, passenger class, and age.',
            'class': 'Passenger class had a significant impact. 1st Class passengers had a much higher survival rate (63%) compared to 3rd Class (24%).',
            'age': 'Children (0-10 years) had a higher survival rate. The elderly had a lower survival rate.',
            'default': "That's an interesting question. Let me analyze that. I can generate a visualization to explore this further if you'd like."
        };
        const lowerMessage = userMessage.toLowerCase();
        let response = responses.default;
        if (lowerMessage.includes('factor')) response = responses.factors;
        if (lowerMessage.includes('class')) response = responses.class;
        if (lowerMessage.includes('age')) response = responses.age;
        addMessage('ai', response);
    };

    const handleSuggestionClick = (question) => {
        addMessage('user', question);
        setTimeout(() => simulateAIResponse(question), 1000);
    };
    
    return (
        <aside className={`sidebar sidebar--right ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <h3>AI Assistant</h3>
                <button className="btn-icon sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
            <div className="sidebar-content">
                <div className="chat-container">
                    <div className="suggestions-section">
                        <h5>Top 5 Questions to Ask</h5>
                        <div className="suggestions-list">
                            {dataset.top_questions.map((q, i) => (
                                <div key={i} className="suggestion-item" onClick={() => handleSuggestionClick(q)}>{q}</div>
                            ))}
                        </div>
                    </div>
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.sender === 'ai' ? 'welcome-chat-message' : ''}`}>
                                <div className={msg.sender === 'ai' ? 'ai-avatar' : 'user-avatar'}>{msg.sender === 'ai' ? '🤖' : '👤'}</div>
                                <div className="message-content"><p>{msg.text}</p></div>
                            </div>
                        ))}
                        <div ref={chatMessagesEndRef} />
                    </div>
                    <div className="chat-input-container">
                        <div className="chat-input-wrapper">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Ask a question..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={!isDataLoaded}
                            />
                            <button className="btn-icon send-btn" onClick={handleSendMessage} disabled={!isDataLoaded}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22,2 15,22 11,13 2,9 22,2"></polygon></svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="tools-section">
                    <h5>Quick Actions</h5>
                    <div className="tool-buttons">
                        <button className="btn btn--outline btn--sm tool-btn" onClick={onOpenModelBuilder} disabled={!isDataLoaded}>
                           <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle></svg> Build ML Model
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default SidebarRight;