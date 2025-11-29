import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"

import { Provider } from "react-redux"
import { store } from "./store"

import { CalendarApp } from "./CalendarApp"
import './styles/styles.css'

// Register Service Worker
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  // </React.StrictMode>,
  <Provider store={store}>
    <BrowserRouter>
      <CalendarApp />
    </BrowserRouter>
  </Provider>
)
