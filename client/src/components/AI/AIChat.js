import { useState, useRef, useEffect } from 'react';

const AIChat = ({ isDataLoaded, messages, onSendMessage, topQuestions }) => {
  const [input, setInput] = useState('');
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleSuggestionClick = (question) => {
    onSendMessage(question);
  };

  return (
    <div className="chat-container">
      <div className="suggestions-section">
        <h5>Top 5 Questions to Ask</h5>
        <div className="suggestions-list">
          {topQuestions.map((q, i) => (
            <div key={i} className="suggestion-item" onClick={() => handleSuggestionClick(q)}>
              {q}
            </div>
          ))}
        </div>
      </div>
      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message fade-in`}>
            <div className={msg.sender === 'ai' ? 'ai-avatar' : 'user-avatar'}>
              {msg.sender === 'ai' ? '🤖' : '👤'}
            </div>
            <div className="message-content"><p>{msg.text}</p></div>
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            disabled={!isDataLoaded}
          />
          <button className="btn-icon send-btn" onClick={handleSend} disabled={!isDataLoaded}>
            <svg width="16" height="16" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9 22,2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;