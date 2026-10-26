import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

// Configure global Axios defaults for Render / production
const apiBase = import.meta.env.VITE_API_URL || '';
if (apiBase) {
  axios.defaults.baseURL = apiBase;
}
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

