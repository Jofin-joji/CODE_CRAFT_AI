import React, { useState } from 'react';

const ChatInput = ({ onSendMessage, onToggleLearningMode, learningMode }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 md:p-4 bg-white/5 backdrop-blur-md border-t-2 border-blue-800/50 flex flex-wrap items-center justify-between gap-3 md:gap-4">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask CodeCraft AI to generate code..."
        className="flex-grow p-2 md:p-3 rounded-md bg-black/20 text-white border-2 border-blue-800/60 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm md:text-base min-w-0"
      />
      <div className="flex items-center justify-end gap-3 md:gap-4 w-full md:w-auto">
        <div className="flex items-center space-x-1 md:space-x-2">
          <label htmlFor="learning-mode-toggle" className="text-white text-xs md:text-sm font-medium">Learning Mode</label>
          <input
            type="checkbox"
            id="learning-mode-toggle"
            checked={learningMode}
            onChange={onToggleLearningMode}
            className="toggle toggle-primary" // This class might need adjustment depending on the project's CSS setup
          />
        </div>
        <button
          type="submit"
          className="font-bold py-2 px-4 md:py-3 md:px-6 rounded-md transition duration-300 border-2 border-blue-700 hover:bg-blue-500/20 text-sm md:text-base"
        >
          Generate
        </button>
      </div>
    </form>
  );
};

export default ChatInput;