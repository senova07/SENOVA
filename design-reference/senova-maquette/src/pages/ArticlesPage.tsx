import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretDownIcon, CaretLeftIcon, CaretRightIcon, FileArrowUpIcon, ListPlusIcon, MagnifyingGlassIcon, PlusIcon, UploadSimpleIcon } from '@phosphor-icons/react'
import { Dropdown } from '../components/bulk/Dropdown'
import { ARTICLE_TYPES, type Article, type ArticleType } from '../data/articles'
import { normalize } from '../lib/format'
import { PageHeader } from '../components/layout/PageHeader'
import { SearchBar } from '../components/articles/SearchBar'
import { FilterTabs, type TabOption } from '../components/articles/FilterTabs'
import { EMPTY_FILTERS, countFilters, type AdvancedFilters } from '../components/articles/FiltersPopover'
import { ArticleTable, type SortKey, type SortState } from '../components/articles/ArticleTable'
import type { RowAction } from '../components/articles/RowMenu'
import '../components/articles/articles.css'

type TabFilter = 'all' | 'favoris' | ArticleType

interface Props {
  articles: Article[]
  highlightId: string | null
  onCreate: (prefill?: Partial<Article>) => void
  onEdit: (a: Article) => void
  onRowAction: (a: Article, action: RowAction) => void
  onBulk: (mode: 'table' | 'file') => void
}

const PAGE_SIZES = [10, 25, 50]

const isThisMonth = (iso: string | null) => {
  if (!iso) return false
  const d = new Date(iso), now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export function ArticlesPage({ articles, highlightId, onCreate, onEdit, onRowAction, onBulk }: Props) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<TabFilter>('all')
  const [advanced, setAdvanced] = useState<AdvancedFilters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortState>({ key: 'lastUsedAt', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const searchRef = useRef<HTMLInputElement>(null)

  // Raccourcis : « / » focalise la recherche, « N » crée un article
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable], [role="dialog"]') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); onCreate() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCreate])

  useEffect(() => { setPage(1) }, [query, tab, advanced, pageSize])

  // Filtres hors onglet, pour les compteurs des onglets
  const baseFiltered = useMemo(() => {
    const q = normalize(query.trim())
    return articles.filter((a) => {
      if (advanced.vatRates.length && !advanced.vatRates.includes(a.vatRate)) return false
      if (advanced.categories.length && !advanced.categories.includes(a.category ?? '')) return false
      if (advanced.neverUsed && a.lastUsedAt) return false
      if (!q) return true
      return [a.name, a.reference, a.category, a.description].some((f) => f && normalize(f).includes(q))
    })
  }, [articles, query, advanced])

  const filtered = useMemo(() => {
    const list = tab === 'all' ? baseFiltered
      : tab === 'favoris' ? baseFiltered.filter((a) => a.favorite)
      : baseFiltered.filter((a) => a.type === tab)
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'fr', { sensitivity: 'base' }) * dir
    })
  }, [baseFiltered, tab, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize)

  const tabs: TabOption<TabFilter>[] = [
    { id: 'all', label: 'Tous' },
    { id: 'favoris', label: 'Favoris' },
    ...ARTICLE_TYPES.filter((t) => t.id !== 'autre').map((t) => ({
      id: t.id as TabFilter,
      label: t.plural,
    })),
  ]

  const stats = {
    total: articles.length,
    favorites: articles.filter((a) => a.favorite).length,
    usedThisMonth: articles.filter((a) => isThisMonth(a.lastUsedAt)).length,
  }

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'reference' || key === 'type' ? 'asc' : 'desc' }))

  const hasConstraints = query || countFilters(advanced) > 0 || tab !== 'all'
  const resetAll = () => { setQuery(''); setAdvanced(EMPTY_FILTERS); setTab('all') }
  const from = filtered.length ? (current - 1) * pageSize + 1 : 0
  const to = Math.min(current * pageSize, filtered.length)

  return (
    <>
      <PageHeader
        title="Articles"
        description="Gérez les produits et services utilisés dans vos devis et factures."
        actions={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => onBulk('file')}>
              <UploadSimpleIcon size={17} weight="bold" aria-hidden />
              Importer
            </button>
            <div className="split-new">
              <button type="button" className="btn btn--primary split-new__main" onClick={() => onCreate()}>
                <PlusIcon size={17} weight="bold" aria-hidden />
                Nouvel article
              </button>
              <Dropdown className="btn btn--primary split-new__caret" align="right" width={250} ariaLabel="Autres façons d’ajouter des articles" label={<CaretDownIcon size={14} weight="bold" aria-hidden />}>
                {(close) => (
                  <>
                    <button type="button" className="menu__item" onClick={() => { close(); onCreate() }}>
                      <PlusIcon size={16} aria-hidden /> Ajouter un article <span className="kbd">N</span>
                    </button>
                    <button type="button" className="menu__item" onClick={() => { close(); onBulk('table') }}>
                      <ListPlusIcon size={16} aria-hidden /> Ajouter plusieurs articles
                    </button>
                    <button type="button" className="menu__item" onClick={() => { close(); onBulk('file') }}>
                      <FileArrowUpIcon size={16} aria-hidden /> Importer un fichier
                    </button>
                  </>
                )}
              </Dropdown>
            </div>
          </>
        }
      />

      <SearchBar ref={searchRef} value={query} onChange={setQuery} placeholder="Rechercher un article…" />

      <FilterTabs label="Filtrer les articles" options={tabs} value={tab} onChange={setTab} />

      <div className="toolbar">
        <dl className="stats">
          <div className="stats__item"><dt className="sr-only">Articles</dt><dd><strong className="num">{stats.total}</strong> articles</dd></div>
          <div className="stats__item"><dt className="sr-only">Favoris</dt><dd><strong className="num">{stats.favorites}</strong> favoris</dd></div>
          <div className="stats__item"><dt className="sr-only">Utilisés ce mois-ci</dt><dd><strong className="num">{stats.usedThisMonth}</strong> utilisés ce mois-ci</dd></div>
        </dl>
      </div>

      {visible.length > 0 ? (
        <>
          <ArticleTable
            articles={visible}
            sort={sort}
            highlightId={highlightId}
            onSort={onSort}
            onOpen={onEdit}
            onAction={onRowAction}
          />
          <div className="a-foot">
            <span className="num" aria-live="polite">{from} à {to} sur {filtered.length} article{filtered.length > 1 ? 's' : ''}</span>
            <nav className="pager" aria-label="Pagination">
              <button type="button" className="pager__btn" onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Page précédente">
                <CaretLeftIcon size={14} weight="bold" aria-hidden />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className="pager__btn num" aria-current={n === current ? 'page' : undefined} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button type="button" className="pager__btn" onClick={() => setPage(current + 1)} disabled={current === pageCount} aria-label="Page suivante">
                <CaretRightIcon size={14} weight="bold" aria-hidden />
              </button>
            </nav>
            <label className="sr-only" htmlFor="page-size">Articles par page</label>
            <select id="page-size" className="select page-size" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} par page</option>)}
            </select>
          </div>
        </>
      ) : (
        <div className="empty">
          <MagnifyingGlassIcon size={22} weight="duotone" aria-hidden />
          <p className="empty__title">{query ? `Aucun article ne correspond à « ${query} »` : 'Aucun article avec ces filtres'}</p>
          <p className="empty__text">Vérifiez l’orthographe ou la référence, ou retirez un filtre. Vous pouvez aussi créer l’article directement.</p>
          <div className="empty__actions">
            {query && (
              <button type="button" className="btn btn--primary btn--sm" onClick={() => onCreate({ name: query.charAt(0).toUpperCase() + query.slice(1) })}>
                <PlusIcon size={14} weight="bold" aria-hidden /> Créer « {query} »
              </button>
            )}
            {hasConstraints && <button type="button" className="btn btn--secondary btn--sm" onClick={resetAll}>Effacer la recherche et les filtres</button>}
          </div>
        </div>
      )}
    </>
  )
}
