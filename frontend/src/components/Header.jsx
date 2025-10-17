import React from 'react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onToggleHistory, isHistoryOpen }) => {
  const { currentUser, signInWithGoogle, logout } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-white/5 backdrop-blur-md text-white p-3 md:p-4 flex justify-between items-center border-b-2 border-blue-800/50">
      <div className="flex items-center">
        <button 
          onClick={onToggleHistory}
          className="md:hidden p-1 md:p-2 mr-1 md:mr-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
          aria-label="Toggle chat history"
        >
          {isHistoryOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <h1 className="text-lg md:text-2xl font-bold">CodeCraft AI</h1>
      </div>
      <nav>
        {currentUser ? (
          <div className="flex items-center space-x-2 md:space-x-4">
            <span className="text-xs md:text-sm">Welcome, {currentUser.displayName || currentUser.email}!</span>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="border-2 border-blue-700 hover:bg-blue-500/20 text-white font-bold py-1 px-2 md:py-2 md:px-4 rounded-md transition duration-300 text-xs md:text-base"
          >
            Sign In with Google
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;