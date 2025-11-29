import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"

import { Provider } from "react-redux"
import { store } from "./store"

import { CalendarApp } from "./CalendarApp"
import './styles/styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  // </React.StrictMode>,
  <Provider store={store}>
    <BrowserRouter>
      <CalendarApp />
    </BrowserRouter>
  </Provider>
)
