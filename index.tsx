import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { AuthProvider } from './src/contexts/AuthContext';
import './index.css';
import { BrowserRouter } from "react-router-dom";
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
