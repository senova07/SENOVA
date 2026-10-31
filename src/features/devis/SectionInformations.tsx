import { useId } from 'react'
import { Icone } from '@/ui/Icone'
import { ChampSelect, ChampTexte } from '@/ui/Formulaire'
import { Champs } from './Champs'
import { dateFinValidite, dateFr } from './calculs'
import { DUREES_VALIDITE } from './constantes'
import type { Devis } from './types'

interface Props {
  devis: Devis
  lectureSeule: boolean
  onModifier(patch: Partial<Devis>): void
}

export function SectionInformations({ devis, lectureSeule, onModifier }: Props) {
  const idNumero = useId()
  const durees: number[] = [...DUREES_VALIDITE]
  if (!durees.includes(devis.validiteJours)) durees.push(devis.validiteJours)
  durees.sort((a, b) => a - b)

  return (
    <Champs desactive={lectureSeule}>
      <ChampTexte
        libelle="Objet du devis"
        placeholder="Ex. : Rénovation salle de bain"
        value={devis.objet}
        onChange={(ev) => onModifier({ objet: ev.target.value })}
      />
      <div className="devis-trio">
        <div className="field">
          <label className="field__label" htmlFor={idNumero}>Numéro</label>
          <div className="devis-verrou-champ">
            <input id={idNumero} className="input devis-verrou" value={devis.numero} readOnly aria-describedby={`${idNumero}-aide`} />
            <Icone nom="cadenas" taille={14} />
          </div>
          <p className="field__hint" id={`${idNumero}-aide`}>Attribué automatiquement</p>
        </div>
        <ChampTexte
          libelle="Date"
          type="date"
          value={devis.dateCreation}
          onChange={(ev) => ev.target.value && onModifier({ dateCreation: ev.target.value })}
        />
        <ChampSelect
          libelle="Validité"
          aide={`Expire le ${dateFr(dateFinValidite(devis))}`}
          value={devis.validiteJours}
          onChange={(ev) => onModifier({ validiteJours: Number(ev.target.value) })}
        >
          {durees.map((j) => (
            <option key={j} value={j}>
              {j} jours
            </option>
          ))}
        </ChampSelect>
      </div>
    </Champs>
  )
}
