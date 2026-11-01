import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from './components/sidebar/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { Toast, type ToastData } from './components/layout/Toast'
import { ArticleDrawer, type ArticleInput } from './components/articles/ArticleDrawer'
import type { RowAction } from './components/articles/RowMenu'
import { ArticlesPage } from './pages/ArticlesPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { BulkAddPage, type BulkMode } from './pages/BulkAddPage'
import { QuotePage } from './pages/QuotePage'
import { AppearancePage } from './pages/AppearancePage'
import { DEFAULT_THEME, type DocTheme } from './components/docs/theme'
import { FilePlusIcon, PaintBrushIcon } from '@phosphor-icons/react'
import { INITIAL_ARTICLES, type Article } from './data/articles'
import { NAV_PARENT, PAGE_LABELS, type PageId } from './data/navigation'
import './components/layout/layout.css'

type DrawerState = { mode: 'create' | 'edit'; article?: Partial<Article>; key: number; autoFocus?: boolean } | null

const readHash = (): PageId => {
  const h = window.location.hash.slice(1) as PageId
  return h in PAGE_LABELS ? h : 'articles'
}

const useMedia = (q: string) => {
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}

export default function App() {
  const [page, setPage] = useState<PageId>(readHash)
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES)
  // Comme sur la maquette, la page s'ouvre avec le panneau « Nouvel article » affiché
  const [drawer, setDrawer] = useState<DrawerState>(() => (readHash() === 'articles' ? { mode: 'create', key: 0, autoFocus: false } : null))
  const [toast, setToast] = useState<ToastData | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [bulkMode, setBulkMode] = useState<BulkMode>('table')
  // Charte graphique des documents, partagée par le devis et l'écran Apparence
  const [docTheme, setDocTheme] = useState<DocTheme>(DEFAULT_THEME)
  const [appearanceFrom, setAppearanceFrom] = useState<PageId>('documents')

  const isMobile = useMedia('(max-width: 760px)')
  const isNarrow = useMedia('(max-width: 1100px)')
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null)
  const collapsed = isMobile ? false : userCollapsed ?? isNarrow

  useEffect(() => {
    const on = () => setPage(readHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const navigate = (p: PageId) => {
    setPage(p)
    setMobileNav(false)
    try { history.replaceState(null, '', `#${p}`) } catch { /* cadre restreint */ }
  }

  const notify = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    setToast({ id: Date.now(), message, actionLabel, onAction })
  }, [])
  const dismissToast = useCallback(() => setToast(null), [])

  const flash = (id: string) => {
    setHighlightId(id)
    window.setTimeout(() => setHighlightId((h) => (h === id ? null : h)), 1900)
  }

  const openCreate = useCallback((prefill?: Partial<Article>) => {
    setMobileNav(false)
    setDrawer({ mode: 'create', article: prefill, key: Date.now() })
  }, [])
  const openEdit = (a: Article) => setDrawer({ mode: 'edit', article: a, key: Date.now() })

  const save = (data: ArticleInput) => {
    if (drawer?.mode === 'edit' && drawer.article?.id) {
      const id = drawer.article.id
      setArticles((list) => list.map((a) => (a.id === id ? { ...a, ...data } : a)))
      flash(id)
      notify(`« ${data.name} » mis à jour`)
    } else {
      const id = `new-${Date.now()}`
      setArticles((list) => [{ ...data, id, lastUsedAt: null }, ...list])
      flash(id)
      notify(`Article « ${data.name} » ajouté au catalogue`)
    }
  }

  const onRowAction = (a: Article, action: RowAction) => {
    switch (action) {
      case 'edit':
        openEdit(a)
        break
      case 'favorite':
        setArticles((list) => list.map((x) => (x.id === a.id ? { ...x, favorite: !x.favorite } : x)))
        notify(a.favorite ? `« ${a.name} » retiré des favoris` : `« ${a.name} » ajouté aux favoris`)
        break
      case 'duplicate': {
        const id = `dup-${Date.now()}`
        const copy: Article = { ...a, id, name: `${a.name} (copie)`, reference: `${a.reference}-B`, favorite: false, lastUsedAt: null }
        setArticles((list) => {
          const i = list.findIndex((x) => x.id === a.id)
          return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)]
        })
        flash(id)
        notify(`« ${a.name} » dupliqué`, 'Modifier', () => openEdit(copy))
        break
      }
      case 'archive': {
        let index = -1
        setArticles((list) => {
          index = list.findIndex((x) => x.id === a.id)
          return list.filter((x) => x.id !== a.id)
        })
        notify(`« ${a.name} » archivé`, 'Annuler', () => {
          setArticles((list) => {
            const next = [...list]
            next.splice(Math.max(0, index), 0, a)
            return next
          })
          flash(a.id)
        })
        break
      }
    }
  }

  return (
    <div className="app">
      <Sidebar
        activePage={NAV_PARENT[page] ?? page}
        collapsed={collapsed}
        mobileOpen={mobileNav}
        onNavigate={navigate}
        onToggleCollapsed={() => setUserCollapsed(!collapsed)}
        onCloseMobile={() => setMobileNav(false)}
        onNewArticle={() => { navigate('articles'); openCreate() }}
        onNewQuote={() => navigate('devis-nouveau')}
      />
      <div className="main">
        <Topbar onOpenMobileNav={() => setMobileNav(true)} />
        <div className="workspace">
        <main className="main__scroll">
          <div className={page === 'articles-import' ? 'page page--bulk' : page === 'devis-nouveau' || page === 'documents-apparence' ? 'page page--studio' : 'page'}>
            {page === 'articles' ? (
              <ArticlesPage
                articles={articles}
                highlightId={highlightId}
                onCreate={openCreate}
                onEdit={openEdit}
                onRowAction={onRowAction}
                onBulk={(mode) => { setDrawer(null); setBulkMode(mode); navigate('articles-import') }}
              />
            ) : page === 'articles-import' ? (
              <BulkAddPage
                catalogue={articles}
                initialMode={bulkMode}
                notify={notify}
                onBack={() => navigate('articles')}
                onImport={(created, done) => {
                  setArticles((list) => [...created, ...list])
                  if (done) {
                    navigate('articles')
                    if (created[0]) flash(created[0].id)
                    notify(`${created.length} article${created.length > 1 ? 's' : ''} ajouté${created.length > 1 ? 's' : ''} au catalogue`)
                  }
                }}
              />
            ) : page === 'devis-nouveau' ? (
              <QuotePage
                theme={docTheme}
                catalogue={articles}
                notify={notify}
                onBack={() => navigate('devis')}
                onOpenAppearance={() => { setAppearanceFrom('devis-nouveau'); navigate('documents-apparence') }}
              />
            ) : page === 'documents-apparence' ? (
              <AppearancePage
                theme={docTheme}
                notify={notify}
                backLabel={appearanceFrom === 'devis-nouveau' ? 'Retour au devis' : 'Retour aux documents'}
                onBack={() => navigate(appearanceFrom)}
                onApply={(t) => setDocTheme(t)}
              />
            ) : (
              <PlaceholderPage
                title={PAGE_LABELS[page]}
                onBack={() => navigate('articles')}
                actions={page === 'devis' ? (
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => navigate('devis-nouveau')}>
                    <FilePlusIcon size={15} aria-hidden /> Nouveau devis
                  </button>
                ) : page === 'documents' ? (
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => { setAppearanceFrom('documents'); navigate('documents-apparence') }}>
                    <PaintBrushIcon size={15} aria-hidden /> Apparence des documents
                  </button>
                ) : undefined}
              />
            )}
          </div>
        </main>
        {drawer && page === 'articles' && (
          <ArticleDrawer
            key={drawer.key}
            mode={drawer.mode}
            initial={drawer.article}
            existing={articles}
            autoFocus={drawer.autoFocus ?? true}
            onClose={() => setDrawer(null)}
            onSave={save}
          />
        )}
        </div>
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  )
}
