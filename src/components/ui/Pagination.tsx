import { Icone } from '@/components/ui/Icone'

/** Pages à afficher : toutes jusqu'à 7, sinon début, voisines et fin séparées par « … ». */
function numerosPages(courante: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const garder = new Set([1, total, courante - 1, courante, courante + 1])
  const pages: (number | '…')[] = []
  for (let n = 1; n <= total; n++) {
    if (garder.has(n)) pages.push(n)
    else if (pages.at(-1) !== '…') pages.push('…')
  }
  return pages
}

/** Styles `.pagination*` dans articles.css. */
export function Pagination({
  page,
  pages,
  onChoisir,
}: {
  page: number
  pages: number
  onChoisir(numero: number): void
}) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__btn"
        aria-label="Page précédente"
        disabled={page === 1}
        onClick={() => onChoisir(page - 1)}
      >
        <Icone nom="precedent" taille={14} />
      </button>
      {numerosPages(page, pages).map((n, i) =>
        n === '…' ? (
          <span key={`e${i}`} className="pagination__ellipse">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            className="pagination__btn"
            aria-current={n === page ? 'page' : undefined}
            onClick={() => onChoisir(n)}
          >
            {n}
          </button>
        ),
      )}
      <button
        type="button"
        className="pagination__btn"
        aria-label="Page suivante"
        disabled={page === pages}
        onClick={() => onChoisir(page + 1)}
      >
        <Icone nom="suivant" taille={14} />
      </button>
    </nav>
  )
}
