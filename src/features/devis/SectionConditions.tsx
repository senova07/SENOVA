import { ChampSelect, ChampZone } from '@/ui/Formulaire'
import { Icone } from '@/ui/Icone'
import { formaterEuro } from '@/lib/format'
import { Champs } from './Champs'
import { ChampNombre } from './ChampNombre'
import { SaisieRemise } from './SaisieRemise'
import { bornerPourcent } from './calculs'
import { ACOMPTES_USUELS, CONDITIONS_PAIEMENT, MOYENS_PAIEMENT } from './constantes'
import type { Devis, Totaux } from './types'

interface Props {
  devis: Devis
  totaux: Totaux
  lectureSeule: boolean
  onModifier(patch: Partial<Devis>): void
}

export function SectionConditions({ devis, totaux, lectureSeule, onModifier }: Props) {
  const conditions: string[] = [...CONDITIONS_PAIEMENT]
  if (devis.conditions && !conditions.includes(devis.conditions)) conditions.unshift(devis.conditions)
  const basculerMoyen = (m: string) =>
    onModifier({
      moyensPaiement: devis.moyensPaiement.includes(m)
        ? devis.moyensPaiement.filter((x) => x !== m)
        : MOYENS_PAIEMENT.filter((x) => x === m || devis.moyensPaiement.includes(x)),
    })

  return (
    <Champs desactive={lectureSeule}>
      <div className="field">
        <span className="field__label">Remise globale</span>
        <SaisieRemise
          remise={devis.remise}
          totalHtBrut={totaux.totalHtBrut}
          remiseMontant={totaux.remiseMontant}
          onChange={(remise) => onModifier({ remise })}
        />
        {totaux.remiseMontant > 0 ? (
          <span className="field__hint">Soit {formaterEuro(totaux.remiseMontant)} HT déduits</span>
        ) : null}
      </div>

      <div className="field" role="group" aria-labelledby="devis-acompte">
        <span className="field__label" id="devis-acompte">Acompte demandé</span>
        <div className="devis-acompte">
          {ACOMPTES_USUELS.map((p) => (
            <button
              key={p}
              type="button"
              className="devis-puce"
              aria-pressed={devis.acomptePourcent === p}
              onClick={() => onModifier({ acomptePourcent: p })}
            >
              {p === 0 ? 'Aucun' : `${p} %`}
            </button>
          ))}
          <label className="devis-acompte__autre">
            <ChampNombre
              className="input"
              aria-label="Autre pourcentage d’acompte"
              valeur={devis.acomptePourcent}
              min={0}
              max={100}
              onValeur={(v) => onModifier({ acomptePourcent: bornerPourcent(v) })}
            />
            <span>%</span>
          </label>
        </div>
        {devis.acomptePourcent > 0 ? (
          <span className="field__hint">Soit {formaterEuro(totaux.acompte)} TTC à verser à la commande</span>
        ) : null}
      </div>

      <ChampSelect
        libelle="Conditions de paiement"
        value={devis.conditions}
        onChange={(ev) => onModifier({ conditions: ev.target.value })}
      >
        {conditions.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </ChampSelect>

      <div className="field" role="group" aria-labelledby="devis-moyens">
        <span className="field__label" id="devis-moyens">Moyens de paiement acceptés</span>
        <div className="devis-puces">
          {MOYENS_PAIEMENT.map((m) => {
            const actif = devis.moyensPaiement.includes(m)
            return (
              <button key={m} type="button" className="devis-puce" aria-pressed={actif} onClick={() => basculerMoyen(m)}>
                {actif ? <Icone nom="valider" taille={13} poids="bold" /> : null}
                {m}
              </button>
            )
          })}
        </div>
      </div>

      <ChampZone
        libelle="Note pour le client"
        aide="Facultatif. Imprimée sur le devis."
        rows={3}
        placeholder="Ex. : Les travaux peuvent débuter sous 15 jours après acceptation."
        value={devis.notes}
        onChange={(ev) => onModifier({ notes: ev.target.value })}
      />
    </Champs>
  )
}
