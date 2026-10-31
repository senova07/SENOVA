import { Icone } from '@/components/ui/Icone'
import { useMenu } from '@/hooks/useMenu'
import { formaterEuro, formaterTaux } from '@/lib/format'
import { LIBELLES_TYPE_ARTICLE, margeArticle, type Article } from '@shared/articles'
import { COLONNES, ICONE_TYPE, type CleTri, type Colonne, type Tri } from './catalogue'

interface Actions {
  peutGerer: boolean
  onModifier(article: Article): void
  onDupliquer(article: Article): void
  onFavori(article: Article): void
  onSupprimer(article: Article): void
}

interface Props extends Actions {
  articles: Article[]
  categorieNom(id: string | null): string | undefined
  colonnes: ReadonlySet<Colonne>
  tri: Tri | null
  onTrier(cle: CleTri): void
  selection: ReadonlySet<string>
  onCocher(ids: string[], coche: boolean): void
}

function MenuLigne({
  article: a,
  peutGerer,
  onModifier,
  onDupliquer,
  onFavori,
  onSupprimer,
  versLeHaut,
}: Actions & { article: Article; versLeHaut: boolean }) {
  const { ouvert, ancre, basculer, fermer } = useMenu()
  const agir = (action: (a: Article) => void) => () => {
    fermer()
    action(a)
  }
  return (
    <div className="menu" ref={ancre}>
      <button
        type="button"
        className="ligne-actions"
        aria-label={`Actions : ${a.nom}`}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        disabled={!peutGerer}
        onClick={basculer}
      >
        <Icone nom="actions" taille={20} poids="bold" />
      </button>
      {ouvert ? (
        <div
          className={`menu__liste ${versLeHaut ? 'menu__liste--dessus' : ''}`}
          role="menu"
          aria-label={`Actions : ${a.nom}`}
        >
          <button type="button" role="menuitem" className="menu__item" onClick={agir(onModifier)}>
            <Icone nom="crayon" taille={18} />
            Modifier
          </button>
          <button type="button" role="menuitem" className="menu__item" onClick={agir(onDupliquer)}>
            <Icone nom="copier" taille={18} />
            Dupliquer
          </button>
          <button type="button" role="menuitem" className="menu__item" onClick={agir(onFavori)}>
            <Icone nom="etoile" taille={18} />
            {a.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu__item menu__item--danger"
            onClick={agir(onSupprimer)}
          >
            <Icone nom="poubelle" taille={18} />
            Supprimer
          </button>
        </div>
      ) : null}
    </div>
  )
}

function EnteteTri({
  cle,
  libelle,
  tri,
  onTrier,
  num,
}: {
  cle: CleTri
  libelle: string
  tri: Tri | null
  onTrier(c: CleTri): void
  num?: boolean
}) {
  const actif = tri?.cle === cle
  return (
    <th
      scope="col"
      className={num ? 'num' : undefined}
      aria-sort={actif ? (tri.sens === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button
        type="button"
        className={`tri ${actif ? 'tri--actif' : ''}`}
        onClick={() => onTrier(cle)}
      >
        {libelle}
        <Icone nom={actif ? (tri.sens === 'asc' ? 'haut' : 'bas') : 'trier'} taille={13} />
      </button>
    </th>
  )
}

/** Tableau du catalogue : sélection, tri par colonne, colonnes masquables, menu ⋮ par ligne. */
export function ListeArticles({
  articles,
  categorieNom,
  colonnes,
  tri,
  onTrier,
  selection,
  onCocher,
  ...actions
}: Props) {
  const voir = (c: Colonne) => colonnes.has(c)
  const ids = articles.map((a) => a.id)
  const toutes = ids.length > 0 && ids.every((id) => selection.has(id))
  const entete = (cle: Exclude<Colonne, 'marge'>, num?: boolean) =>
    voir(cle) ? (
      <EnteteTri
        cle={cle}
        libelle={COLONNES.find((c) => c.id === cle)!.libelle}
        tri={tri}
        onTrier={onTrier}
        num={num}
      />
    ) : null

  return (
    <div className="tableau-defile">
      <table className="tableau-articles">
        <thead>
          <tr>
            <th scope="col" className="c-case">
              <input
                type="checkbox"
                className="coche"
                aria-label="Tout sélectionner sur la page"
                checked={toutes}
                onChange={(e) => onCocher(ids, e.target.checked)}
              />
            </th>
            <EnteteTri cle="nom" libelle="Article" tri={tri} onTrier={onTrier} />
            {entete('type')}
            {entete('categorie')}
            {entete('prix', true)}
            {entete('tva')}
            {entete('unite')}
            {entete('statut')}
            {voir('marge') ? (
              <th scope="col" className="num">
                Marge
              </th>
            ) : null}
            <th scope="col" className="c-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a, rang) => {
            const marge = margeArticle(a)
            const coche = selection.has(a.id)
            return (
              <tr key={a.id} className={coche ? 'ligne--cochee' : undefined}>
                <td className="c-case">
                  <input
                    type="checkbox"
                    className="coche"
                    aria-label={`Sélectionner ${a.nom}`}
                    checked={coche}
                    onChange={(e) => onCocher([a.id], e.target.checked)}
                  />
                </td>
                <td className="c-article">
                  <span className="vignette" aria-hidden="true">
                    <Icone nom={ICONE_TYPE[a.type]} taille={22} />
                  </span>
                  <span className="c-article__texte">
                    <button
                      type="button"
                      className="article__nom"
                      disabled={!actions.peutGerer}
                      onClick={() => actions.onModifier(a)}
                    >
                      {a.nom}
                    </button>
                    {a.favori ? (
                      <Icone nom="etoile" taille={13} poids="fill" className="article__favori" />
                    ) : null}
                    <span className="article__ref">
                      {a.reference ? `Réf. ${a.reference}` : 'Sans référence'}
                    </span>
                  </span>
                </td>
                {voir('type') ? (
                  <td className="c-type">
                    <span className={`pastille-type pastille-type--${a.type}`} aria-hidden="true">
                      <Icone nom={ICONE_TYPE[a.type]} taille={18} poids="fill" />
                    </span>
                    {LIBELLES_TYPE_ARTICLE[a.type]}
                  </td>
                ) : null}
                {voir('categorie') ? <td>{categorieNom(a.categorieId) ?? '—'}</td> : null}
                {voir('prix') ? (
                  <td className="num c-prix">{formaterEuro(a.prixUnitaireHt)}</td>
                ) : null}
                {voir('tva') ? <td className="num">{formaterTaux(a.tauxTva)}</td> : null}
                {voir('unite') ? <td>{a.unite}</td> : null}
                {voir('statut') ? (
                  <td>
                    <span className={`statut ${a.actif ? 'statut--actif' : 'statut--inactif'}`}>
                      {a.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                ) : null}
                {voir('marge') ? (
                  <td className="num c-marge">
                    {marge ? `${formaterEuro(marge.montant)} · ${formaterTaux(marge.taux)}` : '—'}
                  </td>
                ) : null}
                <td className="c-actions">
                  <MenuLigne
                    article={a}
                    versLeHaut={articles.length > 3 && rang >= articles.length - 2}
                    {...actions}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
