import { ControleSegmente } from '@/ui/ControleSegmente'
import { arrondir } from './calculs'
import { ChampNombre } from './ChampNombre'
import type { Remise } from './types'

interface SaisieRemiseProps {
  remise: Remise
  /** Total HT avant remise, pour convertir % et € sans changer le montant. */
  totalHtBrut: number
  /** Montant effectivement déduit (plafonné au total). */
  remiseMontant: number
  onChange(remise: Remise): void
}

/** Remise globale : en %, elle suit les lignes ; en €, le montant reste fixe quand les lignes changent. */
export function SaisieRemise({ remise, totalHtBrut, remiseMontant, onChange }: SaisieRemiseProps) {
  const basculer = (mode: Remise['mode']) => {
    if (mode === remise.mode) return
    onChange(
      mode === 'montant'
        ? { mode, valeur: remiseMontant }
        : { mode, valeur: totalHtBrut > 0 ? arrondir((remiseMontant / totalHtBrut) * 100) : 0 },
    )
  }

  return (
    <div className="devis-remise">
      <ControleSegmente
        libelle="Type de remise"
        valeur={remise.mode}
        onChoisir={basculer}
        options={[
          { id: 'pourcent', libelle: '%' },
          { id: 'montant', libelle: '€' },
        ]}
      />
      <ChampNombre
        className="input"
        aria-label={
          remise.mode === 'pourcent' ? 'Remise globale en pourcentage' : 'Remise globale en euros'
        }
        valeur={remise.valeur}
        min={0}
        max={remise.mode === 'pourcent' ? 100 : undefined}
        decimales={[0, 2]}
        onValeur={(valeur) => onChange({ ...remise, valeur })}
      />
    </div>
  )
}
