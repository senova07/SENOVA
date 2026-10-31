import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftIcon, ArrowRightIcon, ArrowsInIcon, ArrowsOutIcon, CaretDownIcon, CaretRightIcon, ColumnsIcon, CopySimpleIcon,
  FileTextIcon, FloppyDiskIcon, MicrosoftExcelLogoIcon, PaintBucketIcon, PencilSimpleLineIcon, PlusIcon, SlidersHorizontalIcon,
  TrashIcon, WarningCircleIcon, CheckCircleIcon, KeyboardIcon,
} from '@phosphor-icons/react'
import { ARTICLE_TYPES, type Article, type ArticleType } from '../data/articles'
import { BulkGrid, type RowCommand, type SortState } from '../components/bulk/BulkGrid'
import { Dropdown } from '../components/bulk/Dropdown'
import { ImportFlow } from '../components/bulk/ImportFlow'
import {
  BULK_CATEGORIES, BULK_UNITS, BULK_VATS, COLUMNS, INITIAL_DEFAULTS, emptyRow, formatAmount, isEmptyRow, newId, parseAmount,
  toArticles, validateRows, vatLabel, type BulkRow, type Defaults, type FieldKey,
} from '../components/bulk/model'
import '../components/bulk/bulk.css'

export type BulkMode = 'file' | 'table' | 'paste'

interface Props {
  catalogue: Article[]
  initialMode?: BulkMode
  onBack: () => void
  onImport: (articles: Article[], done: boolean) => void
  notify: (message: string, actionLabel?: string, onAction?: () => void) => void
}

const DRAFT_KEY = 'senova.bulk-draft.v1'

const seed = (d: Defaults): BulkRow[] => {
  const r = (name: string, type: ArticleType, reference: string, category: string, unit: string, price: string, vat: string, purchase: string, favorite = false): BulkRow =>
    ({ id: newId(), name, type, reference, category, unit, price, vat, purchase, favorite })
  return [
    r('Heure de plomberie', 'service', 'SERV-001', 'Plomberie', 'heure', '65,00', '20', '35,00', true),
    r('Mitigeur thermostatique', 'produit', 'PR-014', 'Robinetterie', 'unité', '189,00', '20', '120,00'),
    r('Forfait déplacement', 'deplacement', 'DEP-001', 'Déplacement', 'forfait', '35,00', '20', '10,00'),
    r('Entretien chaudière annuel', 'abonnement', 'ABO-003', 'Chauffage', 'forfait', '149,00', '10', '80,00', true),
    r('Pose lavabo', 'service', 'SERV-012', 'Sanitaire', 'forfait', '220,00', '20', '120,00'),
    r('Main-d’œuvre dépannage', 'main-oeuvre', 'MO-004', 'Main-d’œuvre', 'heure', '85,00', '20', '50,00'),
    r('Vanne d’arrêt', 'produit', 'PR-021', 'Robinetterie', 'unité', '28,50', '20', '15,00', true),
    r('Diagnostic panne', 'service', 'SERV-018', 'Diagnostic', 'forfait', '95,00', '20', '30,00'),
    r('Remplacement ballon 200 L', 'service', 'SERV-025', 'Chauffage', 'forfait', '450,00', '20', '280,00'),
    r('Filtre à eau', 'produit', 'PR-032', 'Traitement eau', 'unité', '39,00', '20', '18,00'),
    r('Contrat maintenance PAC', 'abonnement', 'ABO-007', 'Chauffage', 'forfait', '180,00', '10', '90,00', true),
    emptyRow(d),
  ]
}

const readDraft = (): { rows: BulkRow[]; savedAt: string } | null => {
  try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}

const MODES: { id: BulkMode; title: string; text: string; icon: typeof FileTextIcon }[] = [
  { id: 'file', title: 'Importer un fichier', text: 'Excel, CSV ou autre fichier tabulaire', icon: MicrosoftExcelLogoIcon },
  { id: 'table', title: 'Saisir dans le tableau', text: 'Ajoutez ou collez vos articles directement', icon: PencilSimpleLineIcon },
  { id: 'paste', title: 'Copier depuis Excel', text: 'Copiez et collez plusieurs lignes depuis votre fichier', icon: FileTextIcon },
]

export function BulkAddPage({ catalogue, initialMode = 'table', onBack, onImport, notify }: Props) {
  const [mode, setMode] = useState<BulkMode>(initialMode)
  const [defaults, setDefaults] = useState<Defaults>(INITIAL_DEFAULTS)
  const [rows, setRows] = useState<BulkRow[]>(() => seed(INITIAL_DEFAULTS))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortState | null>(null)
  const [hidden, setHidden] = useState<Set<FieldKey>>(new Set())
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(readDraft)

  useEffect(() => { setMode(initialMode) }, [initialMode])

  const columns = COLUMNS.filter((c) => !hidden.has(c.key))
  const errors = useMemo(() => validateRows(rows, catalogue), [rows, catalogue])
  const filled = rows.filter((r) => !isEmptyRow(r))
  const errorRows = filled.filter((r) => errors.has(r.id))
  const ready = filled.filter((r) => !errors.has(r.id))
  const selCount = rows.filter((r) => selected.has(r.id)).length
  const categories = useMemo(() => Array.from(new Set([...BULK_CATEGORIES, ...catalogue.map((a) => a.category).filter(Boolean) as string[]])), [catalogue])

  /* ───── Lignes ───── */
  const focusFirstEmpty = () => requestAnimationFrame(() => {
    const inputs = document.querySelectorAll<HTMLInputElement>('.bgrid__input--name')
    const target = Array.from(inputs).find((i) => !i.value)
    if (target) { target.focus(); target.closest('tr')?.scrollIntoView({ block: 'nearest' }) }
  })

  const addRows = (n: number) => setRows((list) => [...list, ...Array.from({ length: n }, () => emptyRow(defaults))])

  /** « Ajouter une ligne » : réutilise la dernière ligne si elle est encore vide, puis place le curseur dessus. */
  const addOneRow = () => {
    if (!rows.length || !isEmptyRow(rows[rows.length - 1])) addRows(1)
    focusFirstEmpty()
  }

  const removeRows = (ids: Set<string>) => {
    const before = rows
    const next = rows.filter((r) => !ids.has(r.id))
    setRows(next.length ? next : [emptyRow(defaults)])
    setSelected(new Set())
    notify(`${ids.size} ligne${ids.size > 1 ? 's' : ''} supprimée${ids.size > 1 ? 's' : ''}`, 'Annuler', () => setRows(before))
  }

  const duplicateRows = (ids: Set<string>) => {
    setRows((list) => list.flatMap((r) => (ids.has(r.id) ? [r, { ...r, id: newId(), reference: '', favorite: false }] : [r])))
    notify(`${ids.size} ligne${ids.size > 1 ? 's' : ''} dupliquée${ids.size > 1 ? 's' : ''} · références à compléter`)
  }

  const onRowCommand = (id: string, cmd: RowCommand) => {
    if (cmd === 'delete') removeRows(new Set([id]))
    else if (cmd === 'duplicate') duplicateRows(new Set([id]))
    else setRows((list) => list.flatMap((r) => (r.id === id ? [r, emptyRow(defaults)] : [r])))
  }

  /* ───── Tri (réordonne réellement les lignes, les lignes vides restent en bas) ───── */
  const onSort = (key: FieldKey) => {
    const dir: SortState['dir'] = sort?.key === key && sort.dir === 'asc' ? 'desc' : 'asc'
    setSort({ key, dir })
    const value = (r: BulkRow): string | number => {
      if (key === 'price' || key === 'purchase') return parseAmount(r[key]) ?? -1
      if (key === 'vat') return Number(r.vat) || 0
      if (key === 'type') return ARTICLE_TYPES.find((t) => t.id === r.type)!.label
      return String(r[key])
    }
    setRows((list) => {
      const full = list.filter((r) => !isEmptyRow(r))
      const empty = list.filter(isEmptyRow)
      full.sort((a, b) => {
        const va = value(a), vb = value(b)
        const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'fr', { sensitivity: 'base' })
        return dir === 'asc' ? c : -c
      })
      return [...full, ...empty]
    })
  }

  /* ───── Valeurs par défaut : s'appliquent aux nouvelles lignes et aux lignes encore vides ───── */
  const changeDefaults = (patch: Partial<Defaults>) => {
    const next = { ...defaults, ...patch }
    setDefaults(next)
    setRows((list) => list.map((r) => (isEmptyRow(r) ? { ...r, type: next.type, unit: next.unit, vat: next.vat, category: next.category } : r)))
  }

  /* ───── Brouillon ───── */
  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ rows, savedAt: new Date().toISOString() }))
      notify(`Brouillon enregistré · ${filled.length} article${filled.length > 1 ? 's' : ''}`)
    } catch { notify('Le brouillon n’a pas pu être enregistré dans ce navigateur') }
  }
  const restoreDraft = () => {
    if (!draft) return
    setRows([...draft.rows.filter((r) => !isEmptyRow(r)), emptyRow(defaults)])
    setDraft(null)
    setMode('table')
    notify('Brouillon repris')
  }

  /* ───── Import ───── */
  const doImport = () => {
    if (!ready.length) return
    const articles = toArticles(ready, catalogue)
    const remaining = rows.filter((r) => errors.has(r.id))
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* stockage indisponible */ }
    if (remaining.length) {
      setRows([...remaining, emptyRow(defaults)])
      setSelected(new Set())
      onImport(articles, false)
      notify(`${articles.length} article${articles.length > 1 ? 's' : ''} importé${articles.length > 1 ? 's' : ''} · ${remaining.length} ligne${remaining.length > 1 ? 's' : ''} à corriger restent dans le tableau`)
    } else {
      onImport(articles, true)
    }
  }

  const onAddRows = (incoming: BulkRow[], sourceName: string) => {
    setRows((list) => [...list.filter((r) => !isEmptyRow(r)), ...incoming, emptyRow(defaults)])
    setMode('table')
    setSort(null)
    notify(`${incoming.length} ligne${incoming.length > 1 ? 's' : ''} ajoutée${incoming.length > 1 ? 's' : ''} depuis « ${sourceName} » · vérifiez les cellules signalées`)
  }

  return (
    <div className="bulk" data-expanded={expanded || undefined}>
      {!expanded && (
        <>
          <nav className="crumbs" aria-label="Fil d’Ariane">
            <span>Catalogue</span>
            <CaretRightIcon size={11} weight="bold" aria-hidden />
            <button type="button" className="crumbs__link" onClick={onBack}>Articles</button>
            <CaretRightIcon size={11} weight="bold" aria-hidden />
            <span className="crumbs__current" aria-current="page">Ajout en masse</span>
          </nav>

          <header className="bulk__head">
            <div>
              <h1 className="bulk__title">Ajouter des articles en masse</h1>
              <p className="bulk__desc">Importez votre catalogue depuis un fichier ou saisissez directement vos articles dans le tableau.</p>
            </div>
            <button type="button" className="btn btn--secondary bulk__back" onClick={onBack}>
              <ArrowLeftIcon size={16} weight="bold" aria-hidden /> Retour aux articles
            </button>
          </header>

          <div className="modes" role="group" aria-label="Mode de saisie">
            {MODES.map((m) => (
              <button key={m.id} type="button" className="mode" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
                <m.icon className="mode__icon" size={26} weight={mode === m.id ? 'duotone' : 'regular'} aria-hidden />
                <span className="mode__text">
                  <span className="mode__title">{m.title}</span>
                  <span className="mode__sub">{m.text}</span>
                </span>
                <CaretRightIcon size={16} weight="bold" className="mode__chev" aria-hidden />
              </button>
            ))}
          </div>

          {draft && (
            <div className="draft-note">
              <FloppyDiskIcon size={16} weight="duotone" aria-hidden />
              Un brouillon de {draft.rows.filter((r) => !isEmptyRow(r)).length} articles enregistré le {new Date(draft.savedAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} est disponible.
              <button type="button" className="draft-note__btn" onClick={restoreDraft}>Reprendre</button>
              <button type="button" className="draft-note__btn draft-note__btn--muted" onClick={() => setDraft(null)}>Ignorer</button>
            </div>
          )}
        </>
      )}

      {mode === 'table' ? (
        <>
          <div className="btoolbar">
            <div className="split">
              <button type="button" className="btn btn--teal-solid btn--sm split__main" onClick={addOneRow}>
                <PlusIcon size={15} weight="bold" aria-hidden /> Ajouter une ligne
              </button>
              <Dropdown className="btn btn--teal-solid btn--sm split__caret" ariaLabel="Ajouter plusieurs lignes" width={190} label={<CaretDownIcon size={14} weight="bold" aria-hidden />}>
                {(close) => [10, 25, 50].map((n) => (
                  <button key={n} type="button" className="menu__item" onClick={() => { addRows(n); close() }}>
                    <PlusIcon size={15} aria-hidden /> Ajouter {n} lignes
                  </button>
                ))}
              </Dropdown>
            </div>

            <span className="btoolbar__sep" aria-hidden />
            <button type="button" className="btn btn--secondary btn--sm" disabled={!selCount} onClick={() => removeRows(new Set(rows.filter((r) => selected.has(r.id)).map((r) => r.id)))}>
              <TrashIcon size={15} aria-hidden /> Supprimer
            </button>
            <button type="button" className="btn btn--secondary btn--sm" disabled={!selCount} onClick={() => duplicateRows(new Set(rows.filter((r) => selected.has(r.id)).map((r) => r.id)))}>
              <CopySimpleIcon size={15} aria-hidden /> Dupliquer
            </button>
            <span className="btoolbar__sep" aria-hidden />

            <Dropdown width={300} label={<><PaintBucketIcon size={15} aria-hidden /> Remplir <CaretDownIcon size={12} weight="bold" aria-hidden /></>}>
              {(close) => (
                <FillPanel
                  selectedCount={selCount}
                  totalCount={filled.length}
                  categories={categories}
                  onApply={(key, value, scope, onlyEmpty) => {
                    let n = 0
                    const next = rows.map((r) => {
                      const inScope = scope === 'selected' ? selected.has(r.id) : !isEmptyRow(r)
                      if (!inScope) return r
                      if (onlyEmpty && (key === 'favorite' ? r.favorite : String(r[key]).trim())) return r
                      n++
                      return { ...r, [key]: value }
                    })
                    setRows(next)
                    close()
                    notify(`${COLUMNS.find((c) => c.key === key)!.label} : valeur appliquée à ${n} ligne${n > 1 ? 's' : ''}`)
                  }}
                />
              )}
            </Dropdown>

            <Dropdown width={280} label={<><SlidersHorizontalIcon size={15} aria-hidden /> Valeurs par défaut <CaretDownIcon size={12} weight="bold" aria-hidden /></>}>
              {() => <DefaultsPanel defaults={defaults} categories={categories} onChange={changeDefaults} />}
            </Dropdown>

            <div className="btoolbar__right">
              <Dropdown align="right" width={220} label={<><ColumnsIcon size={15} aria-hidden /> Colonnes</>}>
                {() => (
                  <div className="cols-panel">
                    <div className="menu__label">Colonnes affichées</div>
                    {COLUMNS.filter((c) => c.hideable).map((c) => (
                      <label key={c.key} className="check">
                        <input type="checkbox" checked={!hidden.has(c.key)} onChange={() => setHidden((h) => { const n = new Set(h); n.has(c.key) ? n.delete(c.key) : n.add(c.key); return n })} />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Dropdown>
              <button
                type="button"
                className="btn btn--secondary btn--sm btn--icon"
                aria-pressed={expanded}
                aria-label={expanded ? 'Réduire le tableau' : 'Agrandir le tableau'}
                title={expanded ? 'Réduire' : 'Agrandir'}
                onClick={() => setExpanded((x) => !x)}
              >
                {expanded ? <ArrowsInIcon size={16} aria-hidden /> : <ArrowsOutIcon size={16} aria-hidden />}
              </button>
            </div>
          </div>

          <div className="bulk__grid">
            <BulkGrid
              rows={rows}
              columns={columns}
              errors={errors}
              selected={selected}
              sort={sort}
              defaults={defaults}
              categories={categories}
              onChange={setRows}
              onSelect={setSelected}
              onSort={onSort}
              onRowCommand={onRowCommand}
              onPasted={({ rows: n, mapped }) => notify(mapped ? `${n} ligne${n > 1 ? 's' : ''} collée${n > 1 ? 's' : ''} · colonnes reconnues : ${mapped.join(', ')}` : `${n} ligne${n > 1 ? 's' : ''} collée${n > 1 ? 's' : ''}`)}
            />
          </div>

          <div className="bulk__add">
            <div className="split split--ghost">
              <button type="button" className="add-more" onClick={() => addRows(10)}>
                <PlusIcon size={14} weight="bold" aria-hidden /> Ajouter 10 lignes
              </button>
              <Dropdown className="add-more add-more--caret" ariaLabel="Ajouter davantage de lignes" width={190} label={<CaretDownIcon size={12} weight="bold" aria-hidden />}>
                {(close) => [25, 50].map((n) => (
                  <button key={n} type="button" className="menu__item" onClick={() => { addRows(n); close() }}>
                    <PlusIcon size={15} aria-hidden /> Ajouter {n} lignes
                  </button>
                ))}
              </Dropdown>
            </div>
            <span className="bulk__keys"><KeyboardIcon size={15} aria-hidden /> Collez depuis Excel dans n’importe quelle cellule · Tab, Entrée et flèches pour se déplacer</span>
          </div>
        </>
      ) : (
        <div className="bulk__import">
          <ImportFlow key={mode} mode={mode} defaults={defaults} onAddRows={onAddRows} />
        </div>
      )}

      <footer className="bulk__foot">
        <div className="bulk__status" aria-live="polite">
          <span className="status__count"><FileTextIcon size={18} weight="duotone" aria-hidden /> <strong className="num">{filled.length}</strong> article{filled.length > 1 ? 's' : ''}</span>
          <span className="status__item" data-tone={errorRows.length ? 'error' : undefined}>
            {errorRows.length ? <WarningCircleIcon size={15} weight="fill" aria-hidden /> : <span className="status__dot" aria-hidden />}
            <span className="num">{errorRows.length}</span> erreur{errorRows.length > 1 ? 's' : ''}
          </span>
          <span className="status__item" data-tone="ok">
            <CheckCircleIcon size={15} weight="fill" aria-hidden />
            <span className="num">{ready.length}</span> prêt{ready.length > 1 ? 's' : ''} à importer
          </span>
        </div>
        <div className="bulk__actions">
          <button type="button" className="btn btn--secondary btn--lg" onClick={saveDraft} disabled={!filled.length}>
            <FloppyDiskIcon size={17} aria-hidden /> Enregistrer comme brouillon
          </button>
          <button type="button" className="btn btn--teal-solid btn--lg" onClick={doImport} disabled={!ready.length}>
            Importer {ready.length} article{ready.length > 1 ? 's' : ''} <ArrowRightIcon size={16} weight="bold" aria-hidden />
          </button>
        </div>
      </footer>
    </div>
  )
}

/* ───── Panneau « Remplir » ───── */
type FillKey = 'type' | 'category' | 'unit' | 'vat' | 'price' | 'purchase' | 'favorite'
const FILL_FIELDS: { key: FillKey; label: string }[] = [
  { key: 'type', label: 'Type' }, { key: 'vat', label: 'TVA' }, { key: 'unit', label: 'Unité' },
  { key: 'category', label: 'Catégorie' }, { key: 'price', label: 'Prix HT' }, { key: 'purchase', label: 'Prix d’achat' },
  { key: 'favorite', label: 'Favori' },
]

function FillPanel({ selectedCount, totalCount, categories, onApply }: {
  selectedCount: number
  totalCount: number
  categories: string[]
  onApply: (key: FillKey, value: string | boolean, scope: 'selected' | 'all', onlyEmpty: boolean) => void
}) {
  const [key, setKey] = useState<FillKey>('vat')
  const [value, setValue] = useState<string>('20')
  const [scope, setScope] = useState<'selected' | 'all'>(selectedCount ? 'selected' : 'all')
  const [onlyEmpty, setOnlyEmpty] = useState(false)

  const defaultsFor: Record<FillKey, string> = { type: 'service', vat: '20', unit: 'forfait', category: '', price: '', purchase: '', favorite: 'true' }
  const changeKey = (k: FillKey) => { setKey(k); setValue(defaultsFor[k]) }
  const count = scope === 'selected' ? selectedCount : totalCount
  const amount = key === 'price' || key === 'purchase' ? parseAmount(value) : null
  const invalid = (key === 'price' || key === 'purchase') && amount == null
  const final: string | boolean = key === 'favorite' ? value === 'true' : amount != null ? formatAmount(amount) : value

  return (
    <div className="fill">
      <div className="fill__row">
        <label className="fill__label" htmlFor="fill-field">Champ</label>
        <select id="fill-field" className="select" value={key} onChange={(e) => changeKey(e.target.value as FillKey)}>
          {FILL_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>
      <div className="fill__row">
        <label className="fill__label" htmlFor="fill-value">Valeur</label>
        {key === 'type' ? (
          <select id="fill-value" className="select" value={value} onChange={(e) => setValue(e.target.value)}>
            {ARTICLE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        ) : key === 'vat' ? (
          <select id="fill-value" className="select" value={value} onChange={(e) => setValue(e.target.value)}>
            {BULK_VATS.map((v) => <option key={v} value={v}>{vatLabel(v)}</option>)}
          </select>
        ) : key === 'unit' ? (
          <select id="fill-value" className="select" value={value} onChange={(e) => setValue(e.target.value)}>
            {BULK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        ) : key === 'favorite' ? (
          <select id="fill-value" className="select" value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="true">Favori</option>
            <option value="false">Pas favori</option>
          </select>
        ) : (
          <input
            id="fill-value"
            className="input"
            list={key === 'category' ? 'bulk-categories-fill' : undefined}
            inputMode={key === 'category' ? undefined : 'decimal'}
            placeholder={key === 'category' ? 'Ex. Chauffage' : '0,00'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        <datalist id="bulk-categories-fill">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </div>
      <fieldset className="fill__scope">
        <legend className="fill__label">Appliquer à</legend>
        <label className="check"><input type="radio" name="fill-scope" checked={scope === 'selected'} disabled={!selectedCount} onChange={() => setScope('selected')} /><span>Lignes sélectionnées ({selectedCount})</span></label>
        <label className="check"><input type="radio" name="fill-scope" checked={scope === 'all'} onChange={() => setScope('all')} /><span>Toutes les lignes remplies ({totalCount})</span></label>
        <label className="check"><input type="checkbox" checked={onlyEmpty} onChange={(e) => setOnlyEmpty(e.target.checked)} /><span>Uniquement les cellules vides</span></label>
      </fieldset>
      <button
        type="button"
        className="btn btn--teal-solid btn--sm fill__apply"
        disabled={!count || invalid || (key === 'category' && !value.trim())}
        onClick={() => onApply(key, final, scope, onlyEmpty)}
      >
        Appliquer à {count} ligne{count > 1 ? 's' : ''}
      </button>
    </div>
  )
}

/* ───── Panneau « Valeurs par défaut » ───── */
function DefaultsPanel({ defaults, categories, onChange }: { defaults: Defaults; categories: string[]; onChange: (p: Partial<Defaults>) => void }) {
  return (
    <div className="fill">
      <p className="fill__intro">Utilisées pour chaque nouvelle ligne et pour les lignes encore vides.</p>
      <div className="fill__row">
        <label className="fill__label" htmlFor="def-type">Type</label>
        <select id="def-type" className="select" value={defaults.type} onChange={(e) => onChange({ type: e.target.value as ArticleType })}>
          {ARTICLE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <div className="fill__row">
        <label className="fill__label" htmlFor="def-vat">TVA</label>
        <select id="def-vat" className="select" value={defaults.vat} onChange={(e) => onChange({ vat: e.target.value })}>
          {BULK_VATS.map((v) => <option key={v} value={v}>{vatLabel(v)}</option>)}
        </select>
      </div>
      <div className="fill__row">
        <label className="fill__label" htmlFor="def-unit">Unité</label>
        <select id="def-unit" className="select" value={defaults.unit} onChange={(e) => onChange({ unit: e.target.value })}>
          {BULK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="fill__row">
        <label className="fill__label" htmlFor="def-cat">Catégorie</label>
        <input id="def-cat" className="input" list="bulk-categories-def" placeholder="Aucune" value={defaults.category} onChange={(e) => onChange({ category: e.target.value })} />
        <datalist id="bulk-categories-def">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </div>
    </div>
  )
}
