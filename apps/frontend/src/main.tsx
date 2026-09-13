import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource-variable/archivo';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './index.css';
import { bootstrapAppearance } from '@/contexts/AppearanceContext';

bootstrapAppearance();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
