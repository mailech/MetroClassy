import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="padding:20px;color:red;font-size:24px;">ERROR: Root element not found!</div>';
} else {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
