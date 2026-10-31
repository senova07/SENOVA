import { Compteurs, type Compteur } from '@/ui/Compteurs'
import type { Tri } from './ListeDevis'
import { OPTIONS_TRI } from './useVueListeDevis'

interface Props {
  compteurs: readonly Compteur[]
  periode: string
  onPeriode(valeur: string): void
  tri: Tri
  onTri(tri: Tri): void
}

/** Ligne des compteurs à gauche, période et tri à droite. */
export function BarreOutilsDevis({ compteurs, periode, onPeriode, tri, onTri }: Props) {
  const valeurTri = OPTIONS_TRI.find((o) => o.cle === tri.cle && o.sens === tri.sens)?.valeur ?? ''
  return (
    <Compteurs
      compteurs={compteurs}
      actions={
        <div className="liste-devis__selects">
          <select className="select" aria-label="Période" value={periode} onChange={(e) => onPeriode(e.target.value)}>
            <option value="tout">Toute la période</option>
            <option value="mois">Ce mois</option>
            <option value="trimestre">3 derniers mois</option>
          </select>
          <select
            className="select"
            aria-label="Trier par"
            value={valeurTri}
            onChange={(e) => {
              const o = OPTIONS_TRI.find((x) => x.valeur === e.target.value)
              if (o) onTri({ cle: o.cle, sens: o.sens })
            }}
          >
            {valeurTri ? null : <option value="">Tri personnalisé</option>}
            {OPTIONS_TRI.map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.libelle}
              </option>
            ))}
          </select>
        </div>
      }
    />
  )
}
