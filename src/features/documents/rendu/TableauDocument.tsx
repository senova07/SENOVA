import { Fragment } from 'react'
import { formaterTaux } from '../../../lib/format'
import { formaterMontantDocument, formaterQuantite } from './affichage'
import type { ChartePage, LigneDocument, LignePrestation, LigneSection, LigneTexte, TypeDocument } from './types'

interface Props {
  lignes: LigneDocument[]
  type: TypeDocument
  charte: ChartePage
}

interface Colonne { cle: string; libelle: string; numerique?: boolean }
interface Groupe { titre: LigneSection | null; lignes: (LignePrestation | LigneTexte)[] }

function colonnes({ styleTableau, options }: ChartePage): Colonne[] {
  return [
    ...(styleTableau === 'numeros' ? [{ cle: 'n', libelle: 'N°' }] : []),
    ...(options.afficherReferences ? [{ cle: 'ref', libelle: 'Réf.' }] : []),
    { cle: 'desc', libelle: 'Désignation' },
    { cle: 'qte', libelle: 'Qté', numerique: true },
    ...(options.afficherUnites ? [{ cle: 'unite', libelle: 'Unité' }] : []),
    { cle: 'prix', libelle: 'Prix u. HT', numerique: true },
    ...(styleTableau !== 'sans-tva' ? [{ cle: 'tva', libelle: 'TVA', numerique: true }] : []),
    { cle: 'total', libelle: 'Total HT', numerique: true },
  ]
}

/** Une section et ses lignes, ou un groupe unique sans titre. */
function grouper(lignes: LigneDocument[], regrouper: boolean): Groupe[] {
  const groupes: Groupe[] = []
  for (const l of lignes) {
    if (l.type === 'section') {
      if (regrouper) groupes.push({ titre: l, lignes: [] })
      continue
    }
    let courant = groupes[groupes.length - 1]
    if (!courant) {
      courant = { titre: null, lignes: [] }
      groupes.push(courant)
    }
    courant.lignes.push(l)
  }
  return groupes
}

/** Tableau des prestations : un seul composant pour l'aperçu A4 et les miniatures de la galerie. */
export function TableauDocument({ lignes, type, charte }: Props) {
  const cols = colonnes(charte)
  const { styleTableau: style, options } = charte
  const groupes = grouper(lignes, options.regrouperSections)
  const montant = (n: number) => formaterMontantDocument(type, n)

  // Numéro et alternance de fond calculés avant le rendu, pas pendant.
  const rang = new Map<string, number>()
  groupes.forEach((g) => g.lignes.forEach((l) => l.type === 'prestation' && rang.set(l.id, rang.size)))

  const ligne = (l: Groupe['lignes'][number]) => {
    if (l.type === 'texte') return <tr key={l.id} className="doc-ligne--texte"><td colSpan={cols.length}>{l.texte}</td></tr>
    const i = rang.get(l.id) ?? 0
    return (
      <tr key={l.id} className="doc-ligne" data-alterne={i % 2 === 1 || undefined}>
        {style === 'numeros' && <td className="doc-c-n">{String(i + 1).padStart(2, '0')}</td>}
        {options.afficherReferences && <td className="doc-c-ref">{l.reference || '—'}</td>}
        <td className="doc-c-desc">
          {l.designation || <em className="doc-discret">Sans description</em>}
          {l.remisePct > 0 && <span className="doc-remise">Remise {formaterQuantite(l.remisePct)} %</span>}
        </td>
        <td className="doc-c-num">{formaterQuantite(l.quantite)}</td>
        {options.afficherUnites && <td className="doc-c-unite">{l.unite}</td>}
        <td className="doc-c-num">{montant(l.prixUnitaireHt)}</td>
        {style !== 'sans-tva' && <td className="doc-c-num">{formaterTaux(l.tauxTva)}</td>}
        <td className="doc-c-num doc-c-total">{montant(l.totalHt)}</td>
      </tr>
    )
  }
  const titre = (g: Groupe) => g.titre && (
    <tr className="doc-ligne--section">
      <td colSpan={cols.length - 1}>{g.titre.titre || 'Section'}</td>
      <td className="doc-c-num">{montant(g.titre.totalHt)}</td>
    </tr>
  )
  const colgroup = <colgroup>{cols.map((c) => <col key={c.cle} className={`doc-col--${c.cle}`} />)}</colgroup>
  const entete = (
    <thead>
      <tr>{cols.map((c) => <th key={c.cle} className={c.numerique ? 'doc-c-num' : undefined} data-col={c.cle}>{c.libelle}</th>)}</tr>
    </thead>
  )

  if (!groupes.length) {
    return (
      <div className={`doc-tableau doc-tableau--${style}`}>
        <table className="doc-table">{colgroup}{entete}<tbody><tr><td colSpan={cols.length} className="doc-vide">Aucune ligne.</td></tr></tbody></table>
      </div>
    )
  }

  // « Sections en cartes » : un en-tête commun puis une carte par section.
  if (style === 'cartes') {
    return (
      <div className={`doc-tableau doc-tableau--${style}`}>
        <table className="doc-table doc-table--entete">{colgroup}{entete}</table>
        {groupes.map((g, i) => (
          <div key={g.titre?.id ?? `g${i}`} className="doc-carte">
            <table className="doc-table">{colgroup}<tbody>{titre(g)}{g.lignes.map(ligne)}</tbody></table>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`doc-tableau doc-tableau--${style}`}>
      <table className="doc-table">
        {colgroup}
        {entete}
        {groupes.map((g, i) => <Fragment key={g.titre?.id ?? `g${i}`}><tbody>{titre(g)}{g.lignes.map(ligne)}</tbody></Fragment>)}
      </table>
    </div>
  )
}
