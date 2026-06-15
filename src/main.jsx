import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// 1. Importamos el provider que ya tenés creado
import { ThemeProvider } from './components/theme-provider' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. Envolvemos toda la aplicación */}
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
  <App />
</ThemeProvider>
  </StrictMode>,
)