import { useState, type DragEvent } from 'react'
import { Icone } from '@/ui/Icone'
import { UNITES_PAR_DEFAUT } from '@shared/articles'
import { formaterEuro } from '@/lib/format'
import { ChampNombre } from './ChampNombre'
import { TAUX_TVA_LIGNE } from './constantes'
import { bornerPourcent, totalLigneHt } from './calculs'
import type { LigneDevis } from './types'
import type { useGlisserLignes } from './useGlisserLignes'

interface Props {
  ligne: LigneDevis
  /** Position affichée (à partir de 1). */
  rang: number
  /** Sous-total HT, pour une section. */
  sousTotal: number
  glisser: ReturnType<typeof useGlisserLignes>
  onModifier(id: string, patch: Partial<LigneDevis>): void
  onSupprimer(id: string): void
}

const tauxLibelle = (t: number) => `${String(t).replace('.', ',')} %`

/** Une ligne du devis : prestation chiffrée, titre de section ou texte libre. */
export function LigneEditable({ ligne: l, rang, sousTotal, glisser, onModifier, onSupprimer }: Props) {
  const [remiseOuverte, setRemiseOuverte] = useState(false)
  const maj = (patch: Partial<LigneDevis>) => onModifier(l.id, patch)

  const poignee = (
    <button
      type="button"
      className="devis-poignee"
      draggable
      onDragStart={(ev) => glisser.debut(ev, l.id)}
      onKeyDown={(ev) => {
        if (!ev.altKey || (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown')) return
        ev.preventDefault()
        glisser.decaler(l.id, ev.key === 'ArrowUp' ? -1 : 1)
      }}
      aria-label={`Déplacer la ligne ${rang} (glisser, ou Alt + flèches)`}
      title="Glisser pour déplacer"
    >
      <Icone nom="glisser" taille={16} poids="bold" />
    </button>
  )
  const supprimer = (
    <button
      type="button"
      className="devis-supprimer"
      onClick={() => onSupprimer(l.id)}
      aria-label={`Supprimer la ligne ${rang}`}
      title="Supprimer"
    >
      <Icone nom="poubelle" taille={15} />
    </button>
  )
  const racine = {
    'data-ligne': l.id,
    'data-genre': l.genre,
    'data-glisse': glisser.glisse === l.id || undefined,
    'data-cible': glisser.cible?.id === l.id ? (glisser.cible.apres ? 'apres' : 'avant') : undefined,
    onDragOver: (ev: DragEvent<HTMLElement>) => glisser.survol(ev, l.id),
    onDrop: glisser.depot,
  }

  if (l.genre === 'section') {
    return (
      <li className="devis-ligne" {...racine}>
        {poignee}
        <input
          className="devis-ligne__titre"
          value={l.designation}
          placeholder="Nom de la section (ex. : Cuisine)"
          aria-label={`Nom de la section, ligne ${rang}`}
          onChange={(ev) => maj({ designation: ev.target.value })}
        />
        <span className="devis-ligne__sous-total num" title="Sous-total de la section">
          {formaterEuro(sousTotal)}
        </span>
        {supprimer}
      </li>
    )
  }
  if (l.genre === 'texte') {
    return (
      <li className="devis-ligne" {...racine}>
        {poignee}
        <Icone nom="texte" taille={15} className="devis-ligne__icone" />
        <input
          className="devis-ligne__designation devis-ligne__designation--texte"
          value={l.designation}
          placeholder="Texte libre affiché dans le devis"
          aria-label={`Texte libre, ligne ${rang}`}
          onChange={(ev) => maj({ designation: ev.target.value })}
        />
        {supprimer}
      </li>
    )
  }

  const unites = UNITES_PAR_DEFAUT.includes(l.unite) ? UNITES_PAR_DEFAUT : [l.unite, ...UNITES_PAR_DEFAUT]
  const taux = TAUX_TVA_LIGNE.includes(l.tauxTva) ? TAUX_TVA_LIGNE : [...TAUX_TVA_LIGNE, l.tauxTva]
  return (
    <li className="devis-ligne" {...racine}>
      {poignee}
      <div className="devis-ligne__corps">
        <div className="devis-ligne__haut">
          <input
            className="devis-ligne__designation"
            value={l.designation}
            placeholder="Description de la prestation"
            aria-label={`Désignation, ligne ${rang}`}
            onChange={(ev) => maj({ designation: ev.target.value })}
          />
          <span className="devis-ligne__total num" title="Total HT de la ligne">
            {formaterEuro(totalLigneHt(l))}
          </span>
        </div>
        <div className="devis-ligne__champs">
          <label className="devis-mini">
            <span>Qté</span>
            <ChampNombre
              aria-label={`Quantité, ligne ${rang}`}
              valeur={l.quantite}
              min={0}
              decimales={[0, 3]}
              onValeur={(quantite) => maj({ quantite })}
            />
          </label>
          <label className="devis-mini">
            <select
              aria-label={`Unité, ligne ${rang}`}
              value={l.unite}
              onChange={(ev) => maj({ unite: ev.target.value })}
            >
              {unites.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          <label className="devis-mini">
            <ChampNombre
              aria-label={`Prix unitaire HT, ligne ${rang}`}
              valeur={l.prixUnitaireHt}
              min={0}
              onValeur={(prixUnitaireHt) => maj({ prixUnitaireHt })}
            />
            <em>€ HT</em>
          </label>
          <label className="devis-mini">
            <span>TVA</span>
            <select
              aria-label={`TVA, ligne ${rang}`}
              value={l.tauxTva}
              onChange={(ev) => maj({ tauxTva: Number(ev.target.value) })}
            >
              {taux.map((t) => (
                <option key={t} value={t}>
                  {tauxLibelle(t)}
                </option>
              ))}
            </select>
          </label>
          {l.remisePourcent > 0 || remiseOuverte ? (
            <label className="devis-mini" data-actif={l.remisePourcent > 0 || undefined}>
              <span>Remise</span>
              <ChampNombre
                aria-label={`Remise, ligne ${rang}`}
                valeur={l.remisePourcent}
                min={0}
                max={100}
                onValeur={(v) => maj({ remisePourcent: bornerPourcent(v) })}
              />
              <em>%</em>
            </label>
          ) : (
            <button
              type="button"
              className="devis-mini-ajout"
              onClick={() => setRemiseOuverte(true)}
              aria-label={`Ajouter une remise, ligne ${rang}`}
              title="Ajouter une remise"
            >
              <Icone nom="pourcent" taille={13} poids="bold" />
            </button>
          )}
        </div>
      </div>
      {supprimer}
    </li>
  )
}
