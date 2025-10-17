import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

// Manually load the Python language grammar
import 'prismjs/components/prism-python';

const CodeDisplay = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlight = (code) => {
    if (Prism.languages.python) {
      return Prism.highlight(code, Prism.languages.python, 'python');
    } else {
      return code; // Fallback if grammar not loaded
    }
  };

  return (
    <div className="relative my-4 text-sm bg-[#1e2127] rounded-lg border-2 border-blue-800/50 overflow-hidden overflow-x-auto code-editor-container">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 z-10 text-xs font-bold py-1 px-3 rounded-md transition duration-300 border border-blue-700 hover:bg-blue-500/20"
      >
        {copied ? 'Copied! ✅' : 'Copy'}
      </button>
      <Editor
        value={code}
        onValueChange={() => {}} // Read-only
        highlight={highlight}
        padding={24}
        textareaClassName="!outline-none !bg-transparent"
        style={{
          fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
          fontSize: 14,
        }}
      />
    </div>
  );
};

export default CodeDisplay;