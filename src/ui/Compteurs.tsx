import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './Compteurs.css'

export interface Compteur {
  libelle: string
  valeur: ReactNode
  /** Ligne secondaire sous la valeur. */
  sous?: ReactNode
  /** `danger` : montant à surveiller, affiché en rouge. */
  ton?: 'danger'
  /** Rend tout le compteur cliquable. */
  lien?: string
}

interface CompteursProps {
  compteurs: readonly Compteur[]
  /** Nom accessible de la liste. */
  libelle?: string
  /** Emplacement à droite de la ligne (filtres, choix des colonnes…). */
  actions?: ReactNode
  className?: string
}

/** Ligne de compteurs en texte : grand nombre, libellé, séparés par des filets fins (pas de carte). */
export function Compteurs({ compteurs, libelle = 'Chiffres clés', actions, className }: CompteursProps) {
  return (
    <div className={['compteurs-barre', className ?? ''].filter(Boolean).join(' ')}>
      {compteurs.length > 0 ? (
        <ul className="compteurs" aria-label={libelle}>
          {compteurs.map((c) => {
            const contenu = (
              <>
                <span className="compteurs__ligne">
                  <span className="compteurs__valeur">{c.valeur}</span>{' '}
                  <span className="compteurs__libelle">{c.libelle}</span>
                </span>
                {c.sous ? <span className="compteurs__sous">{c.sous}</span> : null}
              </>
            )
            return (
              <li key={c.libelle} className={c.ton ? `compteurs__item compteurs__item--${c.ton}` : 'compteurs__item'}>
                {c.lien ? (
                  <Link to={c.lien} className="compteurs__corps compteurs__lien">
                    {contenu}
                  </Link>
                ) : (
                  <div className="compteurs__corps">{contenu}</div>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
      {actions ? <div className="compteurs-barre__actions">{actions}</div> : null}
    </div>
  )
}
