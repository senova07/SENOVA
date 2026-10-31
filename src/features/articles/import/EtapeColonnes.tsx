import { useMemo, useState } from 'react'
import { Bouton } from '@/ui/Bouton'
import { CaseACocher } from '@/ui/CaseACocher'
import { Icone } from '@/ui/Icone'
import type { Matrice } from './csv'
import {
  COLONNES, LIBELLE_CHAMP, construireLignes, correspondanceAuto, libelleTva, ressembleEntetes,
  type Cible, type Defauts, type LigneImport,
} from './modele'

interface Props {
  source: { nom: string; matrice: Matrice }
  defauts: Defauts
  onChanger(): void
  onAjouter(lignes: LigneImport[], nom: string): void
}

/** Étape 2 : association des colonnes (synonymes d'en-têtes proposés) et aperçu avant ajout au tableau. */
export function EtapeColonnes({ source, defauts, onChanger, onAjouter }: Props) {
  const { matrice } = source
  const [avecEntete, setAvecEntete] = useState(() => ressembleEntetes(matrice[0] ?? []))
  const [cibles, setCibles] = useState<Cible[]>(() => correspondanceAuto(matrice, avecEntete))
  const donnees = useMemo(() => (avecEntete ? matrice.slice(1) : matrice), [avecEntete, matrice])
  const construites = useMemo(() => construireLignes(donnees, cibles, defauts), [donnees, cibles, defauts])
  const doublons = cibles.filter((c, i) => c !== 'ignorer' && cibles.indexOf(c) !== i)
  const nomAssocie = cibles.includes('nom')

  return (
    <section className="import" aria-label="Associer les colonnes">
      <div className="import__barre">
        <span className="import__source">{source.nom} · {donnees.length} ligne{donnees.length > 1 ? 's' : ''}</span>
        <CaseACocher
          libelle="La première ligne contient les en-têtes"
          checked={avecEntete}
          onChange={(e) => {
            setAvecEntete(e.target.checked)
            setCibles(correspondanceAuto(matrice, e.target.checked))
          }}
        />
        <Bouton variante="fantome" taille="sm" icone="fermer" onClick={onChanger}>Changer de source</Bouton>
      </div>

      <div className="import__colonnes">
        <div className="association">
          <div className="association__tete"><span>Colonne du fichier</span><span aria-hidden="true" /><span>Champ SENOVA</span></div>
          {cibles.map((cible, j) => {
            const entete = (avecEntete && matrice[0]?.[j]) || `Colonne ${j + 1}`
            const exemple = donnees.find((l) => l[j]?.trim())?.[j] ?? ''
            const double = cible !== 'ignorer' && doublons.includes(cible)
            return (
              <div key={j} className="association__ligne" data-ignore={cible === 'ignorer' || undefined}>
                <span className="association__source"><strong>{entete}</strong><small title={exemple}>{exemple || '—'}</small></span>
                <Icone nom="fleche" taille={14} />
                <select
                  className="select"
                  aria-label={`Champ SENOVA pour la colonne ${entete}`}
                  aria-invalid={double || undefined}
                  value={cible}
                  onChange={(e) => setCibles((c) => c.map((v, k) => (k === j ? (e.target.value as Cible) : v)))}
                >
                  <option value="ignorer">Ne pas importer</option>
                  {COLONNES.map((c) => <option key={c.cle} value={c.cle}>{c.libelle}</option>)}
                </select>
              </div>
            )
          })}
        </div>

        <div className="apercu">
          <p className="apercu__titre">Aperçu <small>{construites.length > 5 ? `5 premières lignes sur ${construites.length}` : `${construites.length} ligne${construites.length > 1 ? 's' : ''}`}</small></p>
          <div className="apercu__defilement">
            <table className="apercu__table">
              <thead><tr>{(['nom', 'reference', 'prix', 'tva'] as const).map((k) => <th key={k} scope="col">{LIBELLE_CHAMP[k]}</th>)}</tr></thead>
              <tbody>
                {construites.slice(0, 5).map((l) => (
                  <tr key={l.id}>
                    <td>{l.nom || <em>vide</em>}</td>
                    <td>{l.reference || '—'}</td>
                    <td className="num">{l.prix || '—'}</td>
                    <td>{l.tva ? libelleTva(l.tva) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="import__pied">
        <p className="import__aide">
          {!nomAssocie
            ? "Associez une colonne au champ « Nom de l'article »."
            : doublons.length
              ? 'Un même champ est associé à plusieurs colonnes : seule la dernière sera prise en compte.'
              : "Les lignes seront ajoutées au tableau, où vous pourrez les corriger avant l'enregistrement."}
        </p>
        <Bouton variante="primaire" disabled={!nomAssocie || !construites.length} onClick={() => onAjouter(construites, source.nom)}>
          Ajouter {construites.length} ligne{construites.length > 1 ? 's' : ''} au tableau
        </Bouton>
      </div>
    </section>
  )
}
