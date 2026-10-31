import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './EntetePage.css'

export interface MiettePage {
  libelle: string
  /** Absent pour la page courante. */
  vers?: string
}

interface EntetePageProps {
  titre: string
  /** Texte discret à la suite du titre, dans le <h1> (ex. un numéro de document). */
  complement?: string
  sousTitre?: string
  /** Nombre affiché à côté du titre. */
  compteur?: number
  filAriane?: readonly MiettePage[]
  actions?: ReactNode
}

/** En-tête de page : fil d'Ariane optionnel, titre, description et actions. */
export function EntetePage({ titre, complement, sousTitre, compteur, filAriane, actions }: EntetePageProps) {
  return (
    <header className="entete-page">
      <div className="entete-page__texte">
        {filAriane?.length ? (
          <nav className="entete-page__ariane" aria-label="Fil d’Ariane">
            <ol>
              {filAriane.map((m) => (
                <li key={m.libelle}>{m.vers ? <Link to={m.vers}>{m.libelle}</Link> : <span aria-current="page">{m.libelle}</span>}</li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h1 className="entete-page__titre">
          {titre}
          {complement ? <span className="entete-page__complement num">{complement}</span> : null}
          {compteur != null ? <span className="entete-page__compteur num">{compteur}</span> : null}
        </h1>
        {sousTitre ? <p className="entete-page__sous">{sousTitre}</p> : null}
      </div>
      {actions ? <div className="entete-page__actions">{actions}</div> : null}
    </header>
  )
}
