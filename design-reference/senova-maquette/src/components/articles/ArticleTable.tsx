import { ArrowDownIcon, ArrowUpIcon, CaretUpDownIcon, StarIcon } from '@phosphor-icons/react'
import type { Article } from '../../data/articles'
import { formatLastUsed, formatPrice, formatVat } from '../../lib/format'
import { ArticleRow } from './ArticleRow'
import { FavoriteStar } from './FavoriteStar'
import { RowMenu, type RowAction } from './RowMenu'
import { TypeIndicator } from './TypeIndicator'

export type SortKey = 'name' | 'type' | 'reference' | 'priceHT' | 'vatRate' | 'lastUsedAt'
export interface SortState { key: SortKey; dir: 'asc' | 'desc' }

interface Props {
  articles: Article[]
  sort: SortState
  highlightId?: string | null
  onSort: (key: SortKey) => void
  onOpen: (a: Article) => void
  onAction: (a: Article, action: RowAction) => void
}

const COLUMNS: { key: SortKey | null; label: string; className: string; sr?: boolean }[] = [
  { key: null, label: 'Favori', className: 'col-fav', sr: true },
  { key: 'name', label: 'Article', className: 'col-name' },
  { key: 'type', label: 'Type', className: 'col-type' },
  { key: 'reference', label: 'Référence', className: 'col-ref' },
  { key: null, label: 'Unité', className: 'col-unit' },
  { key: 'priceHT', label: 'Prix HT', className: 'col-price' },
  { key: 'vatRate', label: 'TVA', className: 'col-vat' },
  { key: 'lastUsedAt', label: 'Dernière utilisation', className: 'col-used' },
  { key: null, label: 'Actions', className: 'col-actions', sr: true },
]

export function ArticleTable({ articles, sort, highlightId, onSort, onOpen, onAction }: Props) {
  return (
    <>
      {/* Desktop : tableau */}
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const sorted = c.key && sort.key === c.key
                return (
                  <th
                    key={c.label}
                    className={c.className}
                    scope="col"
                    aria-sort={sorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {c.key === null && c.className === 'col-fav' ? (
                      <><StarIcon size={17} weight="regular" className="th-star" aria-hidden /><span className="sr-only">{c.label}</span></>
                    ) : c.className === 'col-actions' ? (
                      c.label
                    ) : c.sr ? (
                      <span className="sr-only">{c.label}</span>
                    ) : c.key ? (
                      <button type="button" className="th-sort" data-sorted={sorted || undefined} onClick={() => onSort(c.key!)}>
                        {c.label}
                        {sorted
                          ? (sort.dir === 'asc'
                            ? <ArrowUpIcon size={11} weight="bold" aria-hidden />
                            : <ArrowDownIcon size={11} weight="bold" aria-hidden />)
                          : c.key === 'name' && <CaretUpDownIcon size={12} weight="bold" aria-hidden />}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <ArticleRow
                key={a.id}
                article={a}
                highlighted={a.id === highlightId}
                onOpen={() => onOpen(a)}
                onAction={(act) => onAction(a, act)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Petite largeur : liste compacte */}
      <ul className="a-list" aria-label="Articles">
        {articles.map((a) => (
          <li key={a.id} className="a-list__item" data-highlight={a.id === highlightId || undefined}>
            <FavoriteStar active={a.favorite} name={a.name} onToggle={() => onAction(a, 'favorite')} />
            <button type="button" className="a-list__main" onClick={() => onOpen(a)}>
              <span className="a-list__name">{a.name}</span>
              <span className="a-list__meta">
                <TypeIndicator type={a.type} />
                <span className="mono">{a.reference}</span>
                <span>{formatLastUsed(a.lastUsedAt)}</span>
              </span>
            </button>
            <span className="a-list__price">
              <span className="num">{formatPrice(a.priceHT)}</span>
              <span className="a-list__unit">/ {a.unit} · TVA {formatVat(a.vatRate)}</span>
            </span>
            <RowMenu article={a} onAction={(act) => onAction(a, act)} />
          </li>
        ))}
      </ul>
    </>
  )
}
