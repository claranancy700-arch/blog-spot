import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import initStarfield from './starfield';

// initialize starfield after DOM loads (canvas exists)
initStarfield();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);