import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"

import { Provider } from "react-redux"
import { store } from "./store"

import { CalendarApp } from "./CalendarApp"
import './styles/styles.css'

// Handle online/offline sync
if ('serviceWorker' in navigator) {
  // When back online, tell SW to replay queued requests
  window.addEventListener('online', () => {
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({ type: 'REPLAY_QUEUE' });
    });
  });

  // Listen for sync complete message from SW
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_COMPLETE') {
      console.log('Sync complete, refreshing data...');
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  // </React.StrictMode>,
  <Provider store={store}>
    <BrowserRouter>
      <CalendarApp />
    </BrowserRouter>
  </Provider>
)
