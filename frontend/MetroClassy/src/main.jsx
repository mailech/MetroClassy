import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

import ErrorBoundary from './components/ErrorBoundary.jsx';

// NOTE: Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = "903060516856-jij1t6qdt64q7rs2hiuv7valpci1v7ar.apps.googleusercontent.com";

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
