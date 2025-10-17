import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeDisplay from './CodeDisplay';

const ChatMessage = ({ message }) => {
  const isUser = message.sender === 'user';
  const isGenerating = message.isGenerating; // Get isGenerating from message object

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-3xl p-3 md:p-4 rounded-lg shadow-lg backdrop-blur-md ${ 
          isUser 
            ? 'bg-blue-500/10 border-2 border-blue-700/50' 
            : 'bg-white/5 border border-white/10'
        }`}
      >  
        <p className="font-semibold mb-1 md:mb-2 flex items-center text-sm md:text-base">
          {isUser ? 'You' : 'CodeCraft AI'}
          {!isUser && isGenerating && (
            <span className="flex items-center ml-2 text-xs md:text-sm">
              Thinking
              <div className="dot-pulse"></div>
            </span>
          )}
        </p>
        {isUser ? (
          <p className="text-sm md:text-base">{message.text}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="markdown-h1 text-lg md:text-xl" {...props} />,
              h2: ({node, ...props}) => <h2 className="markdown-h2 text-base md:text-lg" {...props} />,
              h3: ({node, ...props}) => <h3 className="markdown-h3 text-sm md:text-base" {...props} />,
              p: ({node, ...props}) => <p className="text-sm md:text-base" {...props} />,
              li: ({node, ...props}) => <li className="text-sm md:text-base" {...props} />,
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <CodeDisplay code={String(children).replace(/\n$/, '')} />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.text || message.explanation}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;