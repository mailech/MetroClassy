import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

import ErrorBoundary from './components/ErrorBoundary.jsx';

// Use Env Var for Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "903060516856-jij1t6qdt64q7rs2hiuv7valpci1v7ar.apps.googleusercontent.com";

// AUTOMATIC VERSION RECOVERY
// If a user clicks a link to a lazy-loaded chunk that was just deleted by a new deployment, auto-reload to get new index.
const handleGlobalError = (eventOrMessage) => {
  const message = eventOrMessage.message || eventOrMessage.reason?.message || String(eventOrMessage);
  const isChunkError = /Loading chunk [\d]+ failed/.test(message) || /Failed to fetch dynamically imported module/.test(message);
  if (isChunkError) {
    window.location.reload();
  }
};

window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleGlobalError);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
