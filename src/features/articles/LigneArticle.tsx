import { Badge } from '@/ui/Badge'
import { Icone } from '@/ui/Icone'
import { formaterEuro, formaterTaux } from '@/lib/format'
import { LIBELLES_TYPE_ARTICLE, type Article } from '@shared/articles'
import { MenuLigneArticle, type ActionLigne } from './MenuLigneArticle'

interface Props {
  article: Article
  categorie?: string
  peutGerer: boolean
  versLeHaut: boolean
  onOuvrir(): void
  onAction(action: ActionLigne): void
}

export function LigneArticle({ article: a, categorie, peutGerer, versLeHaut, onOuvrir, onAction }: Props) {
  const sous = a.description || categorie
  return (
    <tr className="a-row" data-archive={!a.actif || undefined}>
      <td className="col-fav">
        <button
          type="button"
          className="fav-star"
          aria-pressed={a.favori}
          aria-label={`Favori : ${a.nom}`}
          title={a.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          disabled={!peutGerer}
          onClick={() => onAction('favori')}
        >
          <Icone nom="etoile" taille={17} poids={a.favori ? 'fill' : 'regular'} />
        </button>
      </td>
      <td className="col-name">
        <button type="button" className="a-row__name" disabled={!peutGerer} onClick={onOuvrir}>
          {a.nom}
        </button>
        {!a.actif ? <Badge>Archivé</Badge> : null}
        {sous ? <div className="a-row__sub">{sous}</div> : null}
      </td>
      <td className="col-type">
        <span className="type-ind" data-type={a.type}>
          <span className="type-ind__dot" aria-hidden="true" />
          {LIBELLES_TYPE_ARTICLE[a.type]}
        </span>
      </td>
      <td className="col-ref">{a.reference ?? '—'}</td>
      <td className="col-unit">{a.unite}</td>
      <td className="col-price num">{formaterEuro(a.prixUnitaireHt)}</td>
      <td className="col-vat num">{formaterTaux(a.tauxTva)}</td>
      <td className="col-actions">
        {peutGerer ? <MenuLigneArticle article={a} versLeHaut={versLeHaut} onAction={onAction} /> : null}
      </td>
    </tr>
  )
}
