import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@/styles/index.css'
import { applyViewportHeight } from '@/utils/viewportHeight'
import { initGlobalErrorHandlers } from '@/utils/errorReporting'

applyViewportHeight()
initGlobalErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
