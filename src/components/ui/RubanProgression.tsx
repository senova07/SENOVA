import { Icone } from '@/components/ui/Icone'
import { ETAPES_PARCOURS, type EtapeRuban } from '@/components/ui/etapesParcours'

interface RubanProgressionProps {
  etapes?: readonly EtapeRuban[]
  /** Identifiant de l'étape courante ; les précédentes sont terminées. */
  courante: string
  libelle?: string
}

/** Ruban FLOW : pastilles reliées par des flèches. L'état est aussi dit en texte. */
export function RubanProgression({
  etapes = ETAPES_PARCOURS,
  courante,
  libelle = 'Progression',
}: RubanProgressionProps) {
  const indexCourant = etapes.findIndex((etape) => etape.id === courante)
  return (
    <ol className="ruban" aria-label={libelle}>
      {etapes.map((etape, index) => {
        const etat = index < indexCourant ? 'faite' : index === indexCourant ? 'courante' : 'avenir'
        return (
          <li
            key={etape.id}
            className={`ruban__etape ruban__etape--${etat}`}
            aria-current={etat === 'courante' ? 'step' : undefined}
          >
            <span className="ruban__pastille">
              <Icone nom={etape.icone} taille={20} />
            </span>
            <span className="ruban__libelle">
              {etape.libelle}
              {etat === 'faite' ? <span className="sr-only"> (terminée)</span> : null}
              {etat === 'courante' ? <span className="sr-only"> (étape en cours)</span> : null}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
