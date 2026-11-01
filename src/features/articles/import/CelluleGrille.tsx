import { LIBELLES_TYPE_ARTICLE, TAUX_TVA, TYPES_ARTICLE, UNITES_PAR_DEFAUT, type CategorieArticle } from '@shared/articles'
import { Icone } from '@/ui/Icone'
import { formaterMontant, libelleTva, lireMontant, type ColonneDef, type LigneImport } from './modele'

interface Props {
  ligne: LigneImport
  colonne: ColonneDef
  /** Index de ligne (0) et de colonne navigable, pour `data-cell`. */
  rang: number
  colNav: number
  indexColonne: number
  erreur?: string
  categories: readonly CategorieArticle[]
  onChange(id: string, cle: ColonneDef['cle'], valeur: string | boolean): void
}

/** Une cellule de la grille : champ étiqueté, erreur annoncée par aria-describedby. */
export function CelluleGrille({ ligne, colonne, rang, colNav, indexColonne, erreur, categories, onChange }: Props) {
  const { cle } = colonne
  const idErreur = `err-${ligne.id}-${cle}`
  const commun = {
    'data-cell': colNav >= 0 ? `${rang}:${colNav}` : undefined,
    'aria-label': `${colonne.libelle}, ligne ${rang + 1}`,
    'aria-invalid': erreur ? (true as const) : undefined,
    'aria-describedby': erreur ? idErreur : undefined,
    className: `grille__champ${colonne.genre === 'nombre' ? ' grille__champ--nombre' : ''}${cle === 'nom' ? ' grille__champ--nom' : ''}`,
  }
  const valeur = String(ligne[cle as Exclude<typeof cle, 'favori'>] ?? '')

  let champ
  if (colonne.genre === 'etoile') {
    champ = (
      <button
        type="button"
        data-cell={commun['data-cell']}
        className="grille__etoile"
        aria-pressed={ligne.favori}
        aria-label={`Favori, ligne ${rang + 1}`}
        onClick={() => onChange(ligne.id, cle, !ligne.favori)}
      >
        <Icone nom="etoile" taille={17} poids={ligne.favori ? 'fill' : 'regular'} />
      </button>
    )
  } else if (cle === 'type') {
    champ = (
      <select {...commun} value={ligne.type} onChange={(e) => onChange(ligne.id, cle, e.target.value)}>
        {ligne.type === '' ? <option value="">Choisir…</option> : null}
        {TYPES_ARTICLE.map((t) => <option key={t} value={t}>{LIBELLES_TYPE_ARTICLE[t]}</option>)}
      </select>
    )
  } else if (cle === 'tva') {
    const connu = (TAUX_TVA as readonly number[]).includes(Number(ligne.tva))
    champ = (
      <select {...commun} value={ligne.tva} onChange={(e) => onChange(ligne.id, cle, e.target.value)}>
        {connu ? null : <option value={ligne.tva}>{ligne.tva || 'Choisir…'}</option>}
        {TAUX_TVA.map((t) => <option key={t} value={String(t)}>{libelleTva(String(t))}</option>)}
      </select>
    )
  } else if (cle === 'categorie') {
    const connu = !ligne.categorie || categories.some((c) => c.nom === ligne.categorie)
    champ = (
      <select {...commun} value={ligne.categorie} onChange={(e) => onChange(ligne.id, cle, e.target.value)}>
        <option value="">Aucune</option>
        {connu ? null : <option value={ligne.categorie}>{ligne.categorie}</option>}
        {categories.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
      </select>
    )
  } else {
    champ = (
      <input
        {...commun}
        value={valeur}
        inputMode={colonne.genre === 'nombre' ? 'decimal' : undefined}
        list={cle === 'unite' ? 'grille-unites' : undefined}
        placeholder={colonne.genre === 'nombre' ? '0,00' : undefined}
        onChange={(e) => onChange(ligne.id, cle, e.target.value)}
        onBlur={
          colonne.genre === 'nombre'
            ? (e) => {
                const n = lireMontant(e.target.value)
                if (n !== null && e.target.value.trim() !== formaterMontant(n)) onChange(ligne.id, cle, formaterMontant(n))
              }
            : undefined
        }
      />
    )
  }

  return (
    <td role="gridcell" aria-colindex={indexColonne} data-erreur={erreur ? '' : undefined} className={colonne.genre === 'etoile' ? 'grille__cellule--etoile' : undefined}>
      {champ}
      {erreur ? <span id={idErreur} className="grille__erreur">{erreur}</span> : null}
      {cle === 'unite' && rang === 0 ? (
        <datalist id="grille-unites">{UNITES_PAR_DEFAUT.map((u) => <option key={u} value={u} />)}</datalist>
      ) : null}
    </td>
  )
}
