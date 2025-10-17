import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import ChatHistory from './components/ChatHistory';
import { generateCode, saveLog, updateLogTitle } from './services/api';
import { v4 as uuidv4 } from 'uuid';

function AppContent() {
  const { currentUser, loading, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [learningMode, setLearningMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // State for the active chat
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatTitle, setActiveChatTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [chatHistoryNeedsRefresh, setChatHistoryNeedsRefresh] = useState(false);


  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  useEffect(() => {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (prompt) => {
    if (!currentUser) {
      alert('Please sign in to use CodeCraft AI.');
      return;
    }

    const isNewChat = !activeChatId;
    const newChatId = isNewChat ? uuidv4() : activeChatId;

    const userMessage = {
      id: uuidv4(),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    if (isNewChat) {
      setActiveChatId(newChatId);
      setActiveChatTitle(prompt);
    }
    setIsGenerating(true);

    const conversationHistoryForGemini = messages.map(msg => ({
      sender: msg.sender,
      text: msg.text,
    }));

    try {
      const aiMessageId = uuidv4();
      let fullAiResponse = '';

      const initialAiMessage = {
        id: aiMessageId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toISOString(),
        isGenerating: true, // Add this property
      };
      setMessages((prevMessages) => [...prevMessages, initialAiMessage]);

      const stream = generateCode(
        prompt,
        learningMode,
        currentUser.uid,
        conversationHistoryForGemini
      );

      for await (const chunk of stream) {
        fullAiResponse += chunk;
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === aiMessageId ? { ...msg, text: fullAiResponse } : msg
          )
        );
      }

      // After streaming is complete, set isGenerating to false
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === aiMessageId ? { ...msg, isGenerating: false } : msg
        )
      );

      if (isNewChat) {
        const chatLog = {
          user_id: currentUser.uid,
          chat_id: newChatId,
          timestamp: userMessage.timestamp,
          prompt: prompt, // The title
          explanation: fullAiResponse,
          learning_mode: learningMode,
        };
        await saveLog(chatLog);
        setChatHistoryNeedsRefresh(true); // Trigger refresh
      }

    } catch (error) {
      console.error('Error generating code:', error);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === aiMessageId ? { ...msg, isGenerating: false } : msg
        )
      );
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: uuidv4(),
          sender: 'ai',
          text: `Error: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      // setIsGenerating(false); // This is no longer needed here as we manage it per message
    }
  };

  const handleSelectLog = (log) => {
    const userMessage = {
      id: uuidv4(),
      sender: 'user',
      text: log.prompt,
      timestamp: log.timestamp,
    };
    const aiMessage = {
      id: uuidv4(),
      sender: 'ai',
      text: log.explanation, // In new logs, explanation has the full markdown
      timestamp: new Date().toISOString(),
    };
    setMessages([userMessage, aiMessage]);
    setActiveChatId(log.chat_id);
    setActiveChatTitle(log.prompt);
    setLearningMode(log.learning_mode);
    setIsHistoryOpen(false); // Close history on log selection
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
    setActiveChatTitle('');
    setIsHistoryOpen(false); // Close history on new chat
  };

  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    if (!activeChatId || !currentUser) return;

    try {
      await updateLogTitle(currentUser.uid, activeChatId, activeChatTitle);
      setChatHistoryNeedsRefresh(true); // Trigger refresh
    } catch (error) {
      console.error("Failed to update title:", error);
      // Optionally, revert title change on error
    }
  };

  const handleToggleLearningMode = () => {
    setLearningMode((prevMode) => !prevMode);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading authentication...</div>;
  }

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden">
      <Header onToggleHistory={toggleHistory} isHistoryOpen={isHistoryOpen} />
      <div className="flex flex-1 overflow-hidden">
        {/* Chat History Sidebar (responsive) */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/50 backdrop-blur-md transform ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out md:flex flex-col`}>
          {currentUser && (
            <ChatHistory 
              onSelectLog={handleSelectLog} 
              onNewChat={handleNewChat} 
              needsRefresh={chatHistoryNeedsRefresh}
              onRefreshComplete={() => setChatHistoryNeedsRefresh(false)}
              logout={logout}
            />
          )} 
        </div>

        {/* Overlay for when history is open on mobile */}
        {isHistoryOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleHistory}
          ></div>
        )}

        <main className="flex-1 flex flex-col relative z-0 overflow-hidden">
          {messages.length > 0 && (
            <div className="p-3 border-b-2 border-blue-800/50 bg-white/5 backdrop-blur-md shadow-md">
              <div className="flex items-center gap-x-3">
                {isEditingTitle ? (
                  <>
                    <input
                      type="text"
                      value={activeChatTitle}
                      onChange={(e) => setActiveChatTitle(e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                      className="w-full bg-gray-700/50 rounded-md p-2 text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button 
                      onClick={handleTitleSave}
                      className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition duration-200"
                      title="Save title"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <h2 
                      className="text-base md:text-lg font-bold text-white truncate"
                      title={activeChatTitle}
                    >
                      {activeChatTitle || 'New Chat'}
                    </h2>
                    <button 
                      onClick={() => setIsEditingTitle(true)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition duration-200"
                      title="Edit title"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          <div id="chat-window" className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm md:text-base">
                {currentUser ? "Start by asking CodeCraft AI a question!" : "Please sign in to start chatting."}
              </div>
            ) : (
              <div>
                {messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} />
                ))}
              </div>
            )}
          </div>
          <ChatInput
            onSendMessage={handleSendMessage}
            onToggleLearningMode={handleToggleLearningMode}
            learningMode={learningMode}
          />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;