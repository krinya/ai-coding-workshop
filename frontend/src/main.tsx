import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Wall from './wall/Wall.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Two pages: the projector wall at /wall, the form everywhere else */}
    {window.location.pathname === '/wall' ? <Wall /> : <App />}
  </StrictMode>,
)
