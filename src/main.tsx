import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// PWA service worker is automatically registered by Vite PWA plugin

// Ensure light theme by removing any dark classes and setting light background
document.documentElement.classList.remove('dark');
document.body.classList.remove('dark');
document.documentElement.style.backgroundColor = '#ffffff';
document.body.style.backgroundColor = '#f9fafb';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
