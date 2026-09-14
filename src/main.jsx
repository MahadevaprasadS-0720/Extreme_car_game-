import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global error suppression for browser extensions & disk quota LevelDB errors
window.addEventListener('unhandledrejection', (e) => {
  const msg = (e && e.reason && (e.reason.message || e.reason.stack || String(e.reason))) || '';
  if (msg.includes('FILE_ERROR_NO_SPACE') || msg.includes('message channel closed') || msg.includes('asynchronous response')) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
