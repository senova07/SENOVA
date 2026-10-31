import type { CSSProperties } from 'react'
import { Icone } from '@/ui/Icone'
import type { IdSection } from './sections'
import type { Progression } from './progression'

interface Props {
  progression: Progression
  onAller(section: IdSection): void
}

/** « Vos documents sont prêts à X % » : chaque élément manquant saute à la section à compléter. */
export function CarteProgression({ progression: { pourcentage, elements }, onAller }: Props) {
  return (
    <section className="progression" aria-label="Progression">
      <div className="progression__tete">
        <strong>Vos documents sont prêts à {pourcentage} %</strong>
        <span className="progression__barre" role="progressbar" aria-label="Progression de l’apparence" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pourcentage}>
          <span style={{ '--pct': `${pourcentage}%` } as CSSProperties} />
        </span>
      </div>
      <ul className="progression__liste">
        {elements.map((e) => (
          <li key={e.id} data-ok={e.ok || undefined}>
            <Icone nom={e.ok ? 'accepte' : 'attention'} taille={16} poids="fill" />
            {e.ok ? e.libelle : <button type="button" onClick={() => onAller(e.section)}>{e.libelle} à compléter</button>}
          </li>
        ))}
      </ul>
    </section>
  )
}
