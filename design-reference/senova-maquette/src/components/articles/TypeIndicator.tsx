import { typeLabel, type ArticleType } from '../../data/articles'

/** Point de couleur + libellé. Le texte porte l'information, la couleur n'est qu'un repère. */
export function TypeIndicator({ type }: { type: ArticleType }) {
  return (
    <span className="type-ind" data-type={type}>
      <span className="type-ind__dot" aria-hidden />
      {typeLabel(type)}
    </span>
  )
}
