import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Icone } from '@/ui/Icone'
import { CHEMINS_BARRE_MOBILE, NAV_TOUTES } from '@/components/layout/navigation'
import { useToast } from '@/store/toastContext'

const [aujourdhui, clients, prestations] = NAV_TOUTES.filter((e) =>
  CHEMINS_BARRE_MOBILE.includes(e.chemin),
)

/** Barre basse mobile : Aujourd'hui · Clients · + · Prestations · Plus. */
export function NavigationMobile() {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const { notifier } = useToast()

  const lien = (entree: typeof aujourdhui) =>
    entree ? (
      <NavLink to={entree.chemin} end={entree.chemin === '/'} className="nav-mobile__item">
        {({ isActive }) => (
          <>
            <Icone nom={entree.icone} taille={24} poids={isActive ? 'bold' : 'regular'} />
            {entree.libelle}
          </>
        )}
      </NavLink>
    ) : null

  return (
    <>
      {menuOuvert ? (
        <div className="plus-menu" id="menu-plus">
          {NAV_TOUTES.filter((e) => !CHEMINS_BARRE_MOBILE.includes(e.chemin)).map((e) => (
            <Link key={e.chemin} to={e.chemin} onClick={() => setMenuOuvert(false)}>
              <Icone nom={e.icone} taille={20} />
              {e.libelle}
            </Link>
          ))}
        </div>
      ) : null}
      <nav className="nav-mobile" aria-label="Navigation mobile">
        {lien(aujourdhui)}
        {lien(clients)}
        <button
          type="button"
          className="nav-mobile__item"
          aria-label="Nouveau"
          onClick={() => notifier('Bientôt disponible', { ton: 'info' })}
        >
          <span className="nav-mobile__plus">
            <Icone nom="plus" taille={26} />
          </span>
        </button>
        {lien(prestations)}
        <button
          type="button"
          className="nav-mobile__item"
          aria-expanded={menuOuvert}
          aria-controls="menu-plus"
          onClick={() => setMenuOuvert((v) => !v)}
        >
          <Icone nom="plus_menu" taille={24} />
          Plus
        </button>
      </nav>
    </>
  )
}
