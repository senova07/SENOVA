import { Outlet } from 'react-router-dom'
import { BarreHaut } from '@/features/shell/BarreHaut'
import { BarreLaterale } from '@/features/shell/BarreLaterale'
import type { Compteur } from '@/features/shell/ElementNavigation'
import { useEtatBarre } from '@/features/shell/useEtatBarre'
import { aujourdhuiIso, magasinDevis } from '@/features/devis'
import { useSession } from '@/store/sessionContext'
import { devisATraiter } from './compteurs'
import './AppLayout.css'

/** Mise en page de l'application connectée : barre latérale, barre du haut, page courante. */
export function AppLayout() {
  const { session } = useSession()
  const etat = useEtatBarre()
  // Seules données de compteur qui existent : les devis de démonstration.
  const nbDevis = devisATraiter(magasinDevis.useListe(), aujourdhuiIso())
  const compteurs: Record<string, Compteur> = nbDevis > 0 ? { '/devis': { valeur: nbDevis } } : {}

  return (
    <div className="app">
      <svg className="sr-only" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="icone-vif" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="vif-1" />
            <stop offset="0.55" className="vif-2" />
            <stop offset="1" className="vif-3" />
          </linearGradient>
        </defs>
      </svg>
      <BarreLaterale
        replie={etat.replie}
        mobile={etat.mobile}
        mobileOuvert={etat.mobileOuvert}
        onBasculer={etat.basculer}
        onFermerMobile={etat.fermerMobile}
        compteurs={compteurs}
      />
      <div className="app__principal">
        <BarreHaut mobileOuvert={etat.mobileOuvert} onOuvrirNavigation={etat.ouvrirMobile} />
        <main className="page">
          {/* Changer d'organisation remonte la page : plus de données de l'ancienne organisation. */}
          <Outlet key={session?.organisation.id} />
        </main>
      </div>
    </div>
  )
}
