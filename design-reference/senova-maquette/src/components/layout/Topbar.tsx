import { BellIcon, CaretDownIcon, ListIcon, MagnifyingGlassIcon, QuestionIcon } from '@phosphor-icons/react'
import './layout.css'

interface Props {
  onOpenMobileNav: () => void
}

/** Barre supérieure : recherche globale à gauche, notifications, aide et compte à droite. */
export function Topbar({ onOpenMobileNav }: Props) {
  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar__menu" onClick={onOpenMobileNav} aria-label="Ouvrir la navigation">
        <ListIcon size={20} weight="bold" aria-hidden />
      </button>

      <button type="button" className="global-search">
        <MagnifyingGlassIcon size={17} weight="bold" aria-hidden />
        <span className="global-search__label">Rechercher un client, un devis, une facture…</span>
        <span className="global-search__keys" aria-hidden><span className="kbd">⌘</span><span className="kbd">K</span></span>
      </button>

      <div className="topbar__actions">
        <button type="button" className="icon-btn topbar__bell" aria-label="Notifications, 3 non lues">
          <BellIcon size={21} weight="duotone" aria-hidden />
          <span className="topbar__dot" aria-hidden />
        </button>
        <button type="button" className="icon-btn" aria-label="Aide">
          <QuestionIcon size={21} weight="duotone" aria-hidden />
        </button>
        <button type="button" className="account" aria-label="Compte de Lucas Martin">
          <span className="account__avatar">LM</span>
          <CaretDownIcon size={13} weight="bold" aria-hidden />
        </button>
      </div>
    </header>
  )
}
