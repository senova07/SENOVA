import { ClockIcon, MedalIcon, ShieldCheckIcon } from '@phosphor-icons/react'
import type { MentionsLegales } from './types'

/** Zone de réassurance du modèle « Artisan ». */
export function Reassurance({ mentions }: { mentions: MentionsLegales }) {
  return (
    <div className="doc-assure">
      <div className="doc-assure__titre">Pourquoi nous choisir ?</div>
      <div className="doc-assure__item"><MedalIcon size={20} aria-hidden /><span><strong>Qualité</strong>Matériaux et finitions soignés</span></div>
      <div className="doc-assure__item"><ClockIcon size={20} aria-hidden /><span><strong>Respect des délais</strong>Planning tenu et suivi</span></div>
      <div className="doc-assure__item">
        <ShieldCheckIcon size={20} aria-hidden />
        <span><strong>Garantie décennale</strong>{mentions.assureur ? `Assurée par ${mentions.assureur}` : 'Travaux assurés'}</span>
      </div>
    </div>
  )
}
