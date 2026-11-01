import { Logo } from './Logo'
import type { ChartePage, EmetteurDocument } from './types'

interface Props {
  emetteur: EmetteurDocument
  charte: ChartePage
}

export function Contact({ emetteur, charte }: Props) {
  if (!charte.afficherContact) return null
  const { adresse } = emetteur
  return (
    <div className="doc-societe__contact">
      {adresse.rue}, {adresse.codePostal} {adresse.ville}<br />{emetteur.telephone} · {emetteur.email}
    </div>
  )
}

/** Logo, nom, activité et (option) coordonnées de l'émetteur. */
export function Emetteur({ emetteur, charte }: Props) {
  return (
    <div className="doc-societe">
      <Logo charte={charte} emetteur={emetteur} />
      <div>
        <div className="doc-societe__nom">{emetteur.nom}</div>
        <div className="doc-societe__activite">{emetteur.activite}</div>
        <Contact emetteur={emetteur} charte={charte} />
      </div>
    </div>
  )
}
