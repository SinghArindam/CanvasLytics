import React from 'react';
import AIChat from '@/components/AI/AIChat';

const RightSidebar = ({ isDataLoaded, messages, onSendMessage, topQuestions }) => {
  return (
    <aside className="sidebar sidebar--right" id="rightSidebar">
      <div className="sidebar-header">
        <h3>AI Assistant</h3>
      </div>
      <div className="sidebar-content">
        <AIChat
          isDataLoaded={isDataLoaded}
          messages={messages}
          onSendMessage={onSendMessage}
          topQuestions={topQuestions}
        />
      </div>
    </aside>
  );
};

export default RightSidebar;