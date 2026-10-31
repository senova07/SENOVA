import { Fragment } from 'react'
import { lineTotal, sectionTotal, type QuoteLine } from '../../data/quote'
import { formatPrice } from '../../lib/format'
import type { DocOptions, TableStyleId } from './theme'

const money = (n: number, negative = false) => formatPrice(negative ? -n : n)
export const vatLabel = (v: number) => `${String(v).replace('.', ',')} %`
const qtyLabel = (q: number) => String(q).replace('.', ',')

interface Props {
  style: TableStyleId
  /** Toutes les lignes (pour calculer les sous-totaux de section) */
  lines: QuoteLine[]
  options: Pick<DocOptions, 'showRefs' | 'showUnits' | 'groupSections'>
  negative?: boolean
  emptyLabel?: string
}

interface Col { key: string; label: string; width?: string; num?: boolean }

/**
 * Tableau des prestations. Le même composant sert à l'aperçu A4 et aux miniatures de la galerie,
 * pour que la miniature montre exactement ce que le client recevra.
 */
export function DocTable({ style, lines, options, negative = false, emptyLabel = 'Ajoutez des lignes pour composer le devis.' }: Props) {
  const numbered = style === 'numeros'
  const withVat = style !== 'sans-tva'
  const cols: Col[] = [
    ...(numbered ? [{ key: 'n', label: 'N°', width: '6%' }] : []),
    ...(options.showRefs ? [{ key: 'ref', label: 'Réf.', width: '10%' }] : []),
    { key: 'desc', label: 'Désignation' },
    { key: 'qty', label: 'Qté', width: '7%', num: true },
    ...(options.showUnits ? [{ key: 'unit', label: 'Unité', width: '10%' }] : []),
    { key: 'price', label: 'Prix u. HT', width: '13%', num: true },
    ...(withVat ? [{ key: 'vat', label: 'TVA', width: '8%', num: true }] : []),
    { key: 'total', label: 'Total HT', width: '14%', num: true },
  ]
  const span = cols.length

  // Découpage en groupes : une section et ses lignes (ou un groupe unique sans titre)
  const visible = options.groupSections ? lines : lines.filter((l) => l.kind !== 'section')
  const groups: { head: QuoteLine | null; index: number; rows: QuoteLine[] }[] = []
  visible.forEach((l) => {
    if (l.kind === 'section') groups.push({ head: l, index: lines.indexOf(l), rows: [] })
    else {
      if (!groups.length) groups.push({ head: null, index: -1, rows: [] })
      groups[groups.length - 1].rows.push(l)
    }
  })

  let n = 0
  const itemRow = (l: QuoteLine, zebra: boolean) => {
    if (l.kind === 'text') return <tr key={l.id} className="doc-row--text"><td colSpan={span}>{l.label}</td></tr>
    n++
    return (
      <tr key={l.id} className="doc-row" data-zebra={zebra || undefined}>
        {numbered && <td className="doc-c-n">{String(n).padStart(2, '0')}</td>}
        {options.showRefs && <td className="doc-c-ref">{l.reference || '—'}</td>}
        <td className="doc-c-desc">
          {l.label || <em className="doc-muted">Sans description</em>}
          {l.discount > 0 && <span className="doc-discount">Remise {qtyLabel(l.discount)} %</span>}
        </td>
        <td className="doc-c-num">{qtyLabel(l.qty)}</td>
        {options.showUnits && <td className="doc-c-unit">{l.unit}</td>}
        <td className="doc-c-num">{money(l.price, negative)}</td>
        {withVat && <td className="doc-c-num">{vatLabel(l.vat)}</td>}
        <td className="doc-c-num doc-c-total">{money(lineTotal(l), negative)}</td>
      </tr>
    )
  }
  const sectionRow = (g: (typeof groups)[number]) => g.head && (
    <tr className="doc-row--section">
      <td colSpan={span - 1}>{g.head.label || 'Section'}</td>
      <td className="doc-c-num">{money(sectionTotal(lines, g.index), negative)}</td>
    </tr>
  )

  const colgroup = <colgroup>{cols.map((c) => <col key={c.key} style={c.width ? { width: c.width } : undefined} />)}</colgroup>
  const head = (
    <thead>
      <tr>{cols.map((c) => <th key={c.key} className={c.num ? 'doc-c-num' : c.key === 'total' ? 'doc-c-total' : undefined} data-col={c.key}>{c.label}</th>)}</tr>
    </thead>
  )

  if (!visible.length) {
    return (
      <div className={`doc-tablewrap doc-table--${style}`}>
        <table className="doc-table">{colgroup}{head}<tbody><tr><td colSpan={span} className="doc-empty">{emptyLabel}</td></tr></tbody></table>
      </div>
    )
  }

  // « Sections en cartes » : un en-tête commun puis une carte par section (mêmes largeurs de colonnes)
  if (style === 'cartes') {
    return (
      <div className={`doc-tablewrap doc-table--${style}`}>
        <table className="doc-table doc-table--head">{colgroup}{head}</table>
        {groups.map((g, gi) => (
          <div key={g.head?.id ?? `g${gi}`} className="doc-card">
            <table className="doc-table">{colgroup}<tbody>{sectionRow(g)}{g.rows.map((l) => itemRow(l, false))}</tbody></table>
          </div>
        ))}
      </div>
    )
  }

  let zebra = 0
  return (
    <div className={`doc-tablewrap doc-table--${style}`}>
      <table className="doc-table">
        {colgroup}
        {head}
        {groups.map((g, gi) => (
          <Fragment key={g.head?.id ?? `g${gi}`}>
            <tbody>
              {sectionRow(g)}
              {g.rows.map((l) => itemRow(l, l.kind === 'item' && zebra++ % 2 === 1))}
            </tbody>
          </Fragment>
        ))}
      </table>
    </div>
  )
}
