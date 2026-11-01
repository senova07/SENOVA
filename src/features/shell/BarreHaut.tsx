import { BellIcon, ListIcon, MagnifyingGlassIcon, QuestionIcon } from '@phosphor-icons/react'
import { useToast } from '@/store/toastContext'
import { MenuCompte } from './MenuCompte'
import './barre-haut.css'

interface BarreHautProps {
  mobileOuvert: boolean
  onOuvrirNavigation(): void
}

/** Barre supérieure : recherche globale à gauche ; notifications, aide et compte à droite. */
export function BarreHaut({ mobileOuvert, onOuvrirNavigation }: BarreHautProps) {
  const { notifier } = useToast()
  const bientot = () => notifier('Bientôt disponible', { ton: 'info' })

  return (
    <header className="barre-haut">
      <button
        type="button"
        className="barre-haut__icone barre-haut__menu"
        onClick={onOuvrirNavigation}
        aria-label="Ouvrir la navigation"
        aria-expanded={mobileOuvert}
      >
        <ListIcon size={20} weight="bold" aria-hidden />
      </button>

      <button type="button" className="recherche-globale" onClick={bientot} aria-label="Rechercher un client, un devis, une facture, un article">
        <MagnifyingGlassIcon size={17} weight="bold" aria-hidden />
        <span className="recherche-globale__libelle">Rechercher un client, un devis, une facture…</span>
      </button>

      <div className="barre-haut__actions">
        <button type="button" className="barre-haut__icone" aria-label="Notifications" onClick={bientot}>
          <BellIcon size={21} weight="regular" aria-hidden />
        </button>
        <button type="button" className="barre-haut__icone" aria-label="Aide" onClick={bientot}>
          <QuestionIcon size={21} weight="regular" aria-hidden />
        </button>
        <MenuCompte variante="haut" />
      </div>
    </header>
  )
}
