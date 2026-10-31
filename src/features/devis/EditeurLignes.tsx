import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Bouton } from '@/ui/Bouton'
import { Icone } from '@/ui/Icone'
import { formaterEuro, formaterTaux } from '@/lib/format'
import { TAUX_TVA, TAUX_TVA_DEFAUT, UNITES_PAR_DEFAUT, type Article } from '@shared/articles'
import { ChampNombre } from './ChampNombre'
import { RechercheLigne } from './RechercheLigne'
import { nouvelId, sousTotalSection, totalLigneHt, type LigneDevis } from './donnees'

interface EditeurLignesProps {
  lignes: LigneDevis[]
  onChange(maj: (lignes: LigneDevis[]) => LigneDevis[]): void
  afficherRemise: boolean
}

const DELAI_ANNULER_MS = 8000

const ligneVide = (extra: Partial<LigneDevis> = {}): LigneDevis => ({
  id: nouvelId(),
  genre: 'article',
  designation: '',
  quantite: 1,
  unite: 'u',
  prixUnitaireHt: 0,
  tauxTva: TAUX_TVA_DEFAUT,
  remisePourcent: 0,
  ...extra,
})

const insererApres = (liste: LigneDevis[], rang: number, ligne: LigneDevis) => [
  ...liste.slice(0, rang + 1),
  ligne,
  ...liste.slice(rang + 1),
]

interface Cible {
  id: string
  cellule: 'designation' | 'prix'
}

export function EditeurLignes({ lignes, onChange, afficherRemise }: EditeurLignesProps) {
  const [cible, setCible] = useState<Cible | null>(null)
  const [descriptionsOuvertes, setDescriptionsOuvertes] = useState<ReadonlySet<string>>(new Set())
  const [supprimee, setSupprimee] = useState<{ ligne: LigneDevis; rang: number } | null>(null)
  const minuteur = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(minuteur.current), [])

  const modifier = (id: string, patch: Partial<LigneDevis>) =>
    onChange((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const ajouter = (ligne: LigneDevis, cellule: Cible['cellule'] | null) => {
    onChange((l) => [...l, ligne])
    setCible(cellule ? { id: ligne.id, cellule } : null)
  }

  const ajouterApres = (rang: number) => {
    const ligne = ligneVide()
    onChange((l) => insererApres(l, rang, ligne))
    setCible({ id: ligne.id, cellule: 'designation' })
  }

  const ajouterArticle = (a: Article) =>
    ajouter(
      ligneVide({
        designation: a.nom,
        description: a.description || undefined,
        reference: a.reference ?? undefined,
        unite: a.unite,
        prixUnitaireHt: a.prixUnitaireHt,
        tauxTva: a.tauxTva,
      }),
      null,
    )

  const ajouterLibre = (designation: string) =>
    ajouter(ligneVide({ designation }), designation ? 'prix' : 'designation')

  const ajouterBloc = (genre: 'section' | 'texte') =>
    ajouter(ligneVide({ genre, quantite: 0, unite: '', tauxTva: 0 }), 'designation')

  const deplacer = (rang: number, delta: number) => {
    const vers = rang + delta
    if (vers < 0 || vers >= lignes.length) return
    const id = lignes[rang]!.id
    onChange((l) => {
      const copie = [...l]
      const [x] = copie.splice(rang, 1)
      copie.splice(vers, 0, x!)
      return copie
    })
    // Le nœud bouge dans le DOM : on redonne le focus au même bouton (ou à son vis-à-vis au bord).
    const sens = delta < 0 ? 'monter' : 'descendre'
    const autre = delta < 0 ? 'descendre' : 'monter'
    const bord = vers === 0 || vers === lignes.length - 1
    requestAnimationFrame(() =>
      document.getElementById(`lignes-${id}-${bord ? autre : sens}`)?.focus(),
    )
  }

  const dupliquer = (rang: number) => {
    const copie = { ...lignes[rang]!, id: nouvelId() }
    onChange((l) => insererApres(l, rang, copie))
  }

  const supprimer = (rang: number) => {
    const ligne = lignes[rang]!
    onChange((l) => l.filter((x) => x.id !== ligne.id))
    setSupprimee({ ligne, rang })
    window.clearTimeout(minuteur.current)
    minuteur.current = window.setTimeout(() => setSupprimee(null), DELAI_ANNULER_MS)
  }

  const annuler = () => {
    if (!supprimee) return
    const { ligne, rang } = supprimee
    onChange((l) => {
      const copie = [...l]
      copie.splice(Math.min(rang, copie.length), 0, ligne)
      return copie
    })
    setSupprimee(null)
  }

  const basculerDescription = (id: string) =>
    setDescriptionsOuvertes((s) => {
      const suite = new Set(s)
      if (!suite.delete(id)) suite.add(id)
      return suite
    })

  // Entrée : cellule suivante de la ligne ; en fin de ligne, nouvelle ligne dessous.
  const surEntree = (ev: KeyboardEvent<HTMLTableRowElement>, rang: number) => {
    const el = ev.target as HTMLElement
    if (ev.key !== 'Enter' || !el.hasAttribute('data-cellule')) return
    ev.preventDefault()
    const cellules = [...ev.currentTarget.querySelectorAll<HTMLElement>('[data-cellule]')]
    const suivante = cellules[cellules.indexOf(el) + 1]
    if (suivante) suivante.focus()
    else ajouterApres(rang)
  }

  const nbColonnes = afficherRemise ? 9 : 8

  return (
    <div className="lignes">
      <div className="lignes-ajout">
        <RechercheLigne onArticle={ajouterArticle} onLibre={ajouterLibre} />
        <Bouton icone="section" onClick={() => ajouterBloc('section')}>
          Section
        </Bouton>
        <Bouton icone="texte" onClick={() => ajouterBloc('texte')}>
          Texte
        </Bouton>
      </div>

      <div role="status" className="lignes-annuler-zone">
        {supprimee ? (
          <p className="lignes-annuler">
            Ligne supprimée.
            <button type="button" className="lignes-annuler__action" onClick={annuler}>
              Annuler
            </button>
          </p>
        ) : null}
      </div>

      {lignes.length === 0 ? (
        <p className="lignes-vide">
          Aucune ligne pour l’instant. Cherchez un article ci-dessus ou saisissez une ligne libre.
        </p>
      ) : (
        <div className="lignes-defil">
          <datalist id="lignes-unites">
            {UNITES_PAR_DEFAUT.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <table className="lignes-table">
            <caption className="sr-only">Lignes du devis</caption>
            <thead>
              <tr>
                <th className="lignes-col-ordre">
                  <span className="sr-only">Ordre</span>
                </th>
                <th className="lignes-col-designation">Désignation</th>
                <th className="lignes-col-qte">Qté</th>
                <th className="lignes-col-unite">Unité</th>
                <th className="lignes-col-prix">PU HT</th>
                <th className="lignes-col-tva">TVA</th>
                {afficherRemise ? <th className="lignes-col-remise">Remise %</th> : null}
                <th className="lignes-col-total">Total HT</th>
                <th className="lignes-col-actions">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, rang) => {
                const nom = `ligne ${rang + 1}`
                const focaliser = (cellule: Cible['cellule']) =>
                  cible?.id === l.id && cible.cellule === cellule
                const actions = (
                  <>
                    <td className="lignes-cellule-ordre">
                      <button
                        type="button"
                        id={`lignes-${l.id}-monter`}
                        className="lignes-ordre"
                        aria-label={`Monter la ${nom}`}
                        disabled={rang === 0}
                        onClick={() => deplacer(rang, -1)}
                      >
                        <Icone nom="haut" taille={14} />
                      </button>
                      <button
                        type="button"
                        id={`lignes-${l.id}-descendre`}
                        className="lignes-ordre"
                        aria-label={`Descendre la ${nom}`}
                        disabled={rang === lignes.length - 1}
                        onClick={() => deplacer(rang, 1)}
                      >
                        <Icone nom="bas" taille={14} />
                      </button>
                    </td>
                  </>
                )
                const boutons = (
                  <td className="lignes-cellule-actions">
                    <button
                      type="button"
                      className="lignes-icone"
                      aria-label={`Dupliquer la ${nom}`}
                      onClick={() => dupliquer(rang)}
                    >
                      <Icone nom="copier" taille={16} />
                    </button>
                    <button
                      type="button"
                      className="lignes-icone"
                      aria-label={`Supprimer la ${nom}`}
                      onClick={() => supprimer(rang)}
                    >
                      <Icone nom="poubelle" taille={16} />
                    </button>
                  </td>
                )

                if (l.genre !== 'article') {
                  const estSection = l.genre === 'section'
                  return (
                    <tr
                      key={l.id}
                      className={`lignes-ligne lignes-ligne--${l.genre}`}
                      onKeyDown={(ev) => surEntree(ev, rang)}
                    >
                      {actions}
                      <td colSpan={nbColonnes - 3}>
                        <textarea
                          rows={1}
                          data-cellule
                          className="lignes-saisie lignes-texte"
                          aria-label={`${estSection ? 'Titre de section' : 'Texte'}, ${nom}`}
                          placeholder={estSection ? 'Titre de la section' : 'Texte libre'}
                          value={l.designation}
                          autoFocus={focaliser('designation')}
                          onChange={(ev) => modifier(l.id, { designation: ev.target.value })}
                        />
                      </td>
                      <td className="lignes-total">
                        {estSection ? (
                          <span title="Sous-total de la section">
                            {formaterEuro(sousTotalSection(lignes, rang))}
                          </span>
                        ) : null}
                      </td>
                      {boutons}
                    </tr>
                  )
                }

                const descriptionOuverte = descriptionsOuvertes.has(l.id) || !!l.description
                return (
                  <tr key={l.id} className="lignes-ligne" onKeyDown={(ev) => surEntree(ev, rang)}>
                    {actions}
                    <td>
                      <textarea
                        rows={1}
                        data-cellule
                        className="lignes-saisie lignes-texte"
                        aria-label={`Désignation, ${nom}`}
                        placeholder="Désignation"
                        value={l.designation}
                        autoFocus={focaliser('designation')}
                        onChange={(ev) => modifier(l.id, { designation: ev.target.value })}
                      />
                      {descriptionOuverte ? (
                        <textarea
                          className="lignes-saisie lignes-description"
                          aria-label={`Description, ${nom}`}
                          placeholder="Description (visible sur le devis)"
                          rows={2}
                          value={l.description ?? ''}
                          onChange={(ev) => modifier(l.id, { description: ev.target.value })}
                        />
                      ) : (
                        <button
                          type="button"
                          className="lignes-lien"
                          aria-label={`Ajouter une description, ${nom}`}
                          onClick={() => basculerDescription(l.id)}
                        >
                          Description
                        </button>
                      )}
                    </td>
                    <td>
                      <ChampNombre
                        data-cellule
                        className="lignes-saisie"
                        aria-label={`Quantité, ${nom}`}
                        valeur={l.quantite}
                        decimales={[0, 3]}
                        min={0}
                        onValeur={(quantite) => modifier(l.id, { quantite })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        data-cellule
                        list="lignes-unites"
                        className="lignes-saisie"
                        aria-label={`Unité, ${nom}`}
                        value={l.unite}
                        onChange={(ev) => modifier(l.id, { unite: ev.target.value })}
                      />
                    </td>
                    <td>
                      <ChampNombre
                        data-cellule
                        className="lignes-saisie"
                        aria-label={`Prix unitaire HT, ${nom}`}
                        valeur={l.prixUnitaireHt}
                        decimales={[2, 4]}
                        autoFocus={focaliser('prix')}
                        onValeur={(prixUnitaireHt) => modifier(l.id, { prixUnitaireHt })}
                      />
                    </td>
                    <td>
                      <select
                        data-cellule
                        className="lignes-saisie"
                        aria-label={`TVA, ${nom}`}
                        value={l.tauxTva}
                        onChange={(ev) => modifier(l.id, { tauxTva: Number(ev.target.value) })}
                      >
                        {[...new Set([...TAUX_TVA, l.tauxTva])].map((t) => (
                          <option key={t} value={t}>
                            {formaterTaux(t)}
                          </option>
                        ))}
                      </select>
                    </td>
                    {afficherRemise ? (
                      <td>
                        <ChampNombre
                          data-cellule
                          className="lignes-saisie"
                          aria-label={`Remise en pourcentage, ${nom}`}
                          valeur={l.remisePourcent}
                          min={0}
                          max={100}
                          onValeur={(remisePourcent) => modifier(l.id, { remisePourcent })}
                        />
                      </td>
                    ) : null}
                    <td className="lignes-total">{formaterEuro(totalLigneHt(l))}</td>
                    {boutons}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
