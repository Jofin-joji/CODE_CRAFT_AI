import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLogs, deleteLog } from '../services/api';

const ChatHistory = ({ onSelectLog, onNewChat, needsRefresh, onRefreshComplete, logout }) => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    if (currentUser) {
      try {
        setLoading(true);
        const response = await getLogs(currentUser.uid);
        if (response.logs) {
          const sortedLogs = response.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setLogs(sortedLogs);
        } else {
          setError(response.message || 'Failed to fetch logs');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setLogs([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentUser]);

  useEffect(() => {
    if (needsRefresh) {
      fetchLogs().then(() => onRefreshComplete());
    }
  }, [needsRefresh, onRefreshComplete]);

  const handleDelete = async (chatId) => {
    if (!currentUser) return;

    setLogs(logs.filter(log => log.chat_id !== chatId));

    try {
      await deleteLog(currentUser.uid, chatId);
    } catch (err) {
      setError(err.message);
      fetchLogs();
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-400">Loading history...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-400">Error: {error}</div>;
  }

  return (
    <aside className="w-64 p-4 border-r-2 border-blue-800/50 bg-black/50 backdrop-blur-md h-full flex flex-col">
      <h2 className="text-xl font-bold text-white mb-4">Chat History</h2>
      <button 
        onClick={onNewChat}
        className="w-full mb-4 p-3 rounded-md border-2 border-blue-700 hover:bg-blue-500/20 text-white font-semibold transition duration-200"
      >
        + New Chat
      </button>
      {logs.length === 0 ? (
        <p className="text-gray-400">No past conversations.</p>
      ) : (
        <ul className="flex-grow overflow-y-auto">
          {logs.map((log) => (
            <li key={log.chat_id} className="mb-2 group">
              <div className="flex items-center justify-between rounded-md border-2 border-transparent hover:border-blue-800 bg-white/5 hover:bg-white/10 transition duration-200">
                <button
                  onClick={() => onSelectLog(log)}
                  className="flex-grow text-left p-3 text-white min-w-0"
                >
                  <p className="text-sm font-semibold truncate">{log.prompt}</p>
                  <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                </button>
                <button 
                  onClick={() => handleDelete(log.chat_id)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="Delete chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {currentUser && (
        <button
          onClick={logout}
          className="w-full mt-auto p-3 rounded-md border-2 border-red-600/80 hover:bg-red-500/20 text-white font-semibold transition duration-200"
        >
          Sign Out
        </button>
      )}
    </aside>
  );
};

export default ChatHistory;