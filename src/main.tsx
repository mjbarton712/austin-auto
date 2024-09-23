import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from './components/dashboard';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen w-full flex flex-col">
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </div>
  </React.StrictMode>
);
