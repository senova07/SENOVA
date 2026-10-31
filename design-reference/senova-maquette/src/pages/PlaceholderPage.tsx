import type { ReactNode } from 'react'
import { HammerIcon } from '@phosphor-icons/react'
import { PageHeader } from '../components/layout/PageHeader'

/** Écran temporaire pour les sections qui seront déclinées après Articles. */
export function PlaceholderPage({ title, onBack, actions }: { title: string; onBack: () => void; actions?: ReactNode }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="placeholder">
        <HammerIcon size={24} weight="duotone" aria-hidden />
        <h2>Écran en préparation</h2>
        <p>Cette maquette couvre la navigation et le catalogue d’articles. {title} reprendra les mêmes composants à l’étape suivante.</p>
        <div className="placeholder__actions">
          {actions}
          <button type="button" className="btn btn--secondary btn--sm" onClick={onBack}>Revenir aux articles</button>
        </div>
      </div>
    </>
  )
}
