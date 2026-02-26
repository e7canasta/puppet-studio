import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import './styles.css'
import './core/app-commanding/commandDefinitions' // Initialize command registry

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
