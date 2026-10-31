import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { NavigationMobile } from '@/components/layout/NavigationMobile'
import { Sidebar } from '@/components/layout/Sidebar'
import { useSession } from '@/store/sessionContext'

const CLE_REPLIE = 'senova.sidebar.repliee'

function lireRepliee(): boolean {
  try {
    return localStorage.getItem(CLE_REPLIE) === '1'
  } catch {
    return false
  }
}

export function AppLayout() {
  const { session } = useSession()
  // Préférence d'affichage propre à ce navigateur.
  const [repliee, setRepliee] = useState(lireRepliee)
  const basculer = useCallback(
    () =>
      setRepliee((r) => {
        try {
          localStorage.setItem(CLE_REPLIE, r ? '0' : '1')
        } catch {
          // stockage indisponible : le choix vaut pour la session seulement
        }
        return !r
      }),
    [],
  )

  // Raccourci clavier Ctrl+B (⌘+B sur Mac) pour replier / déplier le menu.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.repeat || e.defaultPrevented || (e.target as HTMLElement | null)?.isContentEditable)
        return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        basculer()
      }
    }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  }, [basculer])

  return (
    <div className={`app ${repliee ? 'app--replie' : ''}`}>
      <svg className="sr-only" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="icone-vif" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3ee6d6" />
            <stop offset="0.55" stopColor="#1fb2e6" />
            <stop offset="1" stopColor="#1a6efd" />
          </linearGradient>
        </defs>
      </svg>
      <Sidebar repliee={repliee} onBasculer={basculer} />
      <div className="app__principal">
        <Header />
        <main className="contenu">
          {/* Changer d'organisation remonte la page : plus de données de l'ancienne organisation. */}
          <Outlet key={session?.organisation.id} />
        </main>
      </div>
      <NavigationMobile />
    </div>
  )
}
