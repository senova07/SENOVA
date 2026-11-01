import type { Article } from '../../data/articles'
import { formatLastUsed, formatPrice, formatVat, formatLongDate } from '../../lib/format'
import { FavoriteStar } from './FavoriteStar'
import { RowMenu, type RowAction } from './RowMenu'
import { TypeIndicator } from './TypeIndicator'

interface Props {
  article: Article
  highlighted?: boolean
  onOpen: () => void
  onAction: (action: RowAction) => void
}

export function ArticleRow({ article: a, highlighted, onOpen, onAction }: Props) {
  return (
    <tr className="a-row" data-highlight={highlighted || undefined} onClick={onOpen}>
      <td className="col-fav">
        <FavoriteStar active={a.favorite} name={a.name} onToggle={() => onAction('favorite')} />
      </td>
      <td className="col-name">
        <button type="button" className="a-row__name" onClick={(e) => { e.stopPropagation(); onOpen() }}>
          {a.name}
        </button>
        {(a.description || a.category) && (
          <div className="a-row__sub">{a.description ?? a.category}</div>
        )}
      </td>
      <td className="col-type"><TypeIndicator type={a.type} /></td>
      <td className="col-ref"><span className="mono">{a.reference}</span></td>
      <td className="col-unit">{a.unit}</td>
      <td className="col-price num">{formatPrice(a.priceHT)}</td>
      <td className="col-vat num">{formatVat(a.vatRate)}</td>
      <td className="col-used">
        {a.lastUsedAt ? (
          <time dateTime={a.lastUsedAt} title={formatLongDate(a.lastUsedAt)}>{formatLastUsed(a.lastUsedAt)}</time>
        ) : (
          <span className="muted">Jamais</span>
        )}
      </td>
      <td className="col-actions">
        <RowMenu article={a} onAction={onAction} />
      </td>
    </tr>
  )
}
