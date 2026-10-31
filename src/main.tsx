import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { routeur } from '@/app/App'
import { SessionProvider } from '@/store/SessionProvider'
import { ToastProvider } from '@/store/ToastProvider'

import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/ui/Tableau.css'
import '@/styles/ui.css'
import '@/styles/pages.css'

const racine = document.getElementById('root')
if (!racine) throw new Error('Élément #root introuvable.')

createRoot(racine).render(
  <StrictMode>
    <ToastProvider>
      <SessionProvider>
        <RouterProvider router={routeur} />
      </SessionProvider>
    </ToastProvider>
  </StrictMode>,
)
