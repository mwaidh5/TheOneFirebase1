
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';

// In the native app, lock the document and scroll inside #root (see index.html CSS)
// so iOS rubber-band overscroll can't shift the fixed bottom tab bar.
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native-app');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
