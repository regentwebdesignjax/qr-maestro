import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Suppress non-critical BuilderBridge warnings
const originalWarn = console.warn
console.warn = function(...args) {
  if (args[0]?.includes?.('[BuilderBridge]') || args[0]?.includes?.('No parent window found')) {
    return
  }
  originalWarn.apply(console, args)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
