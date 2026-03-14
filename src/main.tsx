import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './app/App'
import { useThemeStore } from './store'
import './styles/globals.css'
import './styles/components.css'

/* ── Apply saved theme before first paint ── */
const { themeId, colorMode } = useThemeStore.getState()
document.documentElement.setAttribute('data-theme', themeId)
document.documentElement.setAttribute('data-mode',  colorMode)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5,
      gcTime:               1000 * 60 * 10,
      retry:                false,
      refetchOnWindowFocus: false,
    },
  },
})

async function bootstrap() {
  /* ── Enable mock BEFORE React renders so api.ts sees window.__EAP_MOCK__ ── */
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { enableMocks } = await import('./services/mock')
    enableMocks()
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface-2)',
                color:      'var(--text)',
                border:     '1px solid var(--border-2)',
                fontFamily: 'var(--font-sans)',
                fontSize:   '13px',
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  )
}

bootstrap()
