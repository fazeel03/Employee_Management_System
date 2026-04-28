import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import "./index.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '10px',
            padding: '16px 24px',
          },
          success: {
            duration: 4000,
            style: {
              background: '#10B981',
              color: '#fff',
              fontWeight: '600',
              borderRadius: '10px',
              padding: '16px 24px',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
              color: '#fff',
              fontWeight: '600',
              borderRadius: '10px',
              padding: '16px 24px',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
        }}
      />
    </AuthProvider>
  </StrictMode>,
)
