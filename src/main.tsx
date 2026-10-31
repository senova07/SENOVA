import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from '@/app/App'
import { SessionProvider } from '@/store/SessionProvider'
import { ToastProvider } from '@/store/ToastProvider'

import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/ui.css'
import '@/styles/pages.css'

const racine = document.getElementById('root')
if (!racine) throw new Error('Élément #root introuvable.')

createRoot(racine).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
