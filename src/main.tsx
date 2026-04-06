import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App.tsx';
import './styles.css';

// Dynamic basename based on environment
const basename = import.meta.env.PROD ? '/app-store' : '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TooltipProvider>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </TooltipProvider>
  </React.StrictMode>
);
