import type { ReactNode } from 'react'

interface EntetePageProps {
  titre: string
  sousTitre?: string
  actions?: ReactNode
}

export function EntetePage({ titre, sousTitre, actions }: EntetePageProps) {
  return (
    <header className="entete-page">
      <div>
        <h1 className="entete-page__titre">{titre}</h1>
        {sousTitre ? <p className="entete-page__sous">{sousTitre}</p> : null}
      </div>
      {actions ? <div className="entete-page__actions">{actions}</div> : null}
    </header>
  )
}
