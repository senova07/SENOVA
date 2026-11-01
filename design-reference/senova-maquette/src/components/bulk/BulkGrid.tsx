import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowDownIcon, ArrowUpIcon, CaretUpDownIcon, CopySimpleIcon, DotsThreeIcon, RowsPlusBottomIcon, StarIcon, TrashIcon,
} from '@phosphor-icons/react'
import { ARTICLE_TYPES } from '../../data/articles'
import { TYPE_ICONS } from '../../data/articleTypeIcons'
import { useDismiss } from '../../lib/useDismiss'
import {
  BULK_UNITS, BULK_VATS, assignField, emptyRow, formatAmount, guessField, looksLikeHeader, parseAmount, parseClipboard, vatLabel,
  type BulkRow, type ColumnDef, type Defaults, type FieldKey, type RowErrors,
} from './model'

export interface SortState { key: FieldKey; dir: 'asc' | 'desc' }
export type RowCommand = 'duplicate' | 'insert' | 'delete'

interface Props {
  rows: BulkRow[]
  columns: ColumnDef[]
  errors: Map<string, RowErrors>
  selected: Set<string>
  sort: SortState | null
  defaults: Defaults
  categories: string[]
  onChange: (updater: (rows: BulkRow[]) => BulkRow[]) => void
  onSelect: (next: Set<string>) => void
  onSort: (key: FieldKey) => void
  onRowCommand: (id: string, cmd: RowCommand) => void
  onPasted: (info: { rows: number; mapped?: string[] }) => void
}

export function BulkGrid({
  rows, columns, errors, selected, sort, defaults, categories,
  onChange, onSelect, onSort, onRowCommand, onPasted,
}: Props) {
  const tableRef = useRef<HTMLTableElement>(null)
  const pendingFocus = useRef<{ r: number; c: number } | null>(null)
  const lastChecked = useRef<number | null>(null)
  // Colonnes atteignables au clavier (l'étoile se manipule à la souris ou avec Espace)
  const nav = useMemo(() => columns.filter((c) => c.kind !== 'star'), [columns])

  const focusCell = (r: number, c: number) => {
    const rr = Math.max(0, Math.min(r, rows.length - 1))
    const cc = Math.max(0, Math.min(c, nav.length - 1))
    const el = tableRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-cell="${rr}:${cc}"]`)
    if (!el) return
    el.focus()
    if (el instanceof HTMLInputElement) el.select()
    el.closest('td')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  useEffect(() => {
    if (!pendingFocus.current) return
    const { r, c } = pendingFocus.current
    pendingFocus.current = null
    focusCell(r, c)
  })

  const set = (id: string, key: FieldKey, value: string | boolean) =>
    onChange((list) => list.map((r) => (r.id === id ? { ...r, [key]: value } : r)))

  const addRowAndFocus = (r: number, c: number) => {
    pendingFocus.current = { r, c }
    onChange((list) => [...list, emptyRow(defaults)])
  }

  /* ───── Clavier façon tableur ───── */
  const onKeyDown = (e: KeyboardEvent<HTMLTableSectionElement>) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement
    const pos = el.dataset?.cell
    if (!pos) return
    const [r, c] = pos.split(':').map(Number)
    const isSelect = el.tagName === 'SELECT'
    const input = el as HTMLInputElement
    const atStart = !isSelect && input.selectionStart === 0 && input.selectionEnd === 0
    const atEnd = !isSelect && input.selectionStart === input.value.length && input.selectionEnd === input.value.length
    const last = rows.length - 1

    switch (e.key) {
      case 'ArrowDown':
        if (e.altKey) return
        e.preventDefault(); focusCell(r + 1, c); break
      case 'ArrowUp':
        if (e.altKey) return
        e.preventDefault(); focusCell(r - 1, c); break
      case 'ArrowLeft':
        if (!isSelect && !atStart) return
        e.preventDefault(); focusCell(r, c - 1); break
      case 'ArrowRight':
        if (!isSelect && !atEnd) return
        e.preventDefault(); focusCell(r, c + 1); break
      case 'Enter':
        e.preventDefault()
        if (e.shiftKey) focusCell(r - 1, c)
        else if (r === last) addRowAndFocus(r + 1, c)
        else focusCell(r + 1, c)
        break
      case 'Tab': {
        e.preventDefault()
        if (e.shiftKey) {
          if (c > 0) focusCell(r, c - 1)
          else if (r > 0) focusCell(r - 1, nav.length - 1)
        } else if (c < nav.length - 1) focusCell(r, c + 1)
        else if (r < last) focusCell(r + 1, 0)
        else addRowAndFocus(r + 1, 0)
        break
      }
    }
  }

  /* ───── Collage multi-cellules depuis Excel ───── */
  const onPaste = (e: ClipboardEvent<HTMLTableSectionElement>) => {
    const el = e.target as HTMLElement
    const pos = el.dataset?.cell
    if (!pos) return
    const text = e.clipboardData.getData('text/plain')
    const multi = text.includes('\t') || /\n./.test(text.replace(/\r/g, ''))
    if (!multi && el.tagName !== 'SELECT') return // collage simple : comportement natif du champ
    e.preventDefault()
    const [r, c] = pos.split(':').map(Number)
    let matrix = parseClipboard(text)
    let targets: (FieldKey | null)[] = []
    let mapped: string[] | undefined

    // Avec une ligne d'en-têtes reconnue (« Désignation », « PU HT »…), on associe par nom de colonne
    if (matrix.length > 1 && looksLikeHeader(matrix[0])) {
      targets = matrix[0].map((h) => guessField(h))
      mapped = targets.filter(Boolean).map((k) => columns.find((col) => col.key === k)?.label ?? k!) as string[]
      matrix = matrix.slice(1)
    } else {
      targets = matrix[0].map((_, j) => nav[c + j]?.key ?? null)
    }

    onChange((list) => {
      const next = [...list]
      matrix.forEach((line, i) => {
        const ri = r + i
        while (ri >= next.length) next.push(emptyRow(defaults))
        let row = next[ri]
        line.forEach((val, j) => {
          const key = targets[j]
          if (key) row = assignField(row, key, val, defaults)
        })
        next[ri] = row
      })
      return next
    })
    onPasted({ rows: matrix.length, mapped })
  }

  /* ───── Sélection ───── */
  const allIds = rows.map((r) => r.id)
  const allChecked = rows.length > 0 && allIds.every((id) => selected.has(id))
  const someChecked = !allChecked && allIds.some((id) => selected.has(id))
  const headerBox = useRef<HTMLInputElement>(null)
  useEffect(() => { if (headerBox.current) headerBox.current.indeterminate = someChecked }, [someChecked])

  const toggleRow = (index: number, shift: boolean) => {
    const next = new Set(selected)
    const id = rows[index].id
    const turnOn = !next.has(id)
    if (shift && lastChecked.current != null) {
      const [a, b] = [lastChecked.current, index].sort((x, y) => x - y)
      for (let i = a; i <= b; i++) turnOn ? next.add(rows[i].id) : next.delete(rows[i].id)
    } else turnOn ? next.add(id) : next.delete(id)
    lastChecked.current = index
    onSelect(next)
  }

  const knownCategories = useMemo(
    () => Array.from(new Set([...categories, ...rows.map((r) => r.category.trim()).filter(Boolean)])).sort((a, b) => a.localeCompare(b, 'fr')),
    [categories, rows],
  )

  return (
    <table ref={tableRef} className="bgrid" aria-label="Articles à ajouter">
      <colgroup>
        <col style={{ width: 40 }} />
        <col style={{ width: 36 }} />
        {columns.map((c) => <col key={c.key} style={{ width: c.key === 'name' ? undefined : c.width, minWidth: c.width }} />)}
        <col style={{ width: 44 }} />
      </colgroup>
      <thead>
        <tr>
          <th className="bgrid__num" aria-label="Ligne" />
          <th className="bgrid__check">
            <input
              ref={headerBox}
              type="checkbox"
              className="bgrid__box"
              checked={allChecked}
              onChange={() => onSelect(allChecked ? new Set() : new Set(allIds))}
              aria-label="Tout sélectionner"
            />
          </th>
          {columns.map((c) => {
            const active = sort?.key === c.key
            return (
              <th key={c.key} className={`bgrid__th bgrid__th--${c.kind}`} aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                {c.sortable ? (
                  <button type="button" className="bgrid__sort" data-active={active || undefined} onClick={() => onSort(c.key)}>
                    {c.label}{c.required && <span className="bgrid__req" aria-hidden> *</span>}
                    {active
                      ? (sort!.dir === 'asc' ? <ArrowUpIcon size={11} weight="bold" aria-hidden /> : <ArrowDownIcon size={11} weight="bold" aria-hidden />)
                      : <CaretUpDownIcon size={11} weight="bold" className="bgrid__sort-idle" aria-hidden />}
                  </button>
                ) : c.label}
              </th>
            )
          })}
          <th className="bgrid__actions" aria-label="Actions" />
        </tr>
      </thead>
      <tbody onKeyDown={onKeyDown} onPaste={onPaste}>
        {rows.map((row, r) => {
          const err = errors.get(row.id)
          const isSel = selected.has(row.id)
          return (
            <tr key={row.id} className="bgrid__row" data-selected={isSel || undefined} data-invalid={err ? true : undefined}>
              <td className="bgrid__num">{r + 1}</td>
              <td className="bgrid__check">
                <input
                  type="checkbox"
                  className="bgrid__box"
                  checked={isSel}
                  onChange={(e) => toggleRow(r, (e.nativeEvent as MouseEvent).shiftKey)}
                  aria-label={`Sélectionner la ligne ${r + 1}`}
                />
              </td>
              {columns.map((col) => {
                const c = nav.findIndex((n) => n.key === col.key)
                const msg = err?.[col.key]
                const cellProps = { 'data-cell': `${r}:${c}`, 'aria-invalid': msg ? true : undefined, 'aria-label': `${col.label}, ligne ${r + 1}${msg ? ` : ${msg}` : ''}` }
                let content
                if (col.kind === 'star') {
                  content = (
                    <button
                      type="button"
                      className="bgrid__star"
                      aria-pressed={row.favorite}
                      aria-label={row.favorite ? `Retirer la ligne ${r + 1} des favoris` : `Mettre la ligne ${r + 1} en favori`}
                      onClick={() => set(row.id, 'favorite', !row.favorite)}
                    >
                      <StarIcon size={18} weight={row.favorite ? 'fill' : 'regular'} aria-hidden />
                    </button>
                  )
                } else if (col.key === 'type') {
                  const Icon = TYPE_ICONS[row.type]
                  content = (
                    <span className="bgrid__type" data-type={row.type}>
                      <Icon size={16} weight="duotone" aria-hidden />
                      <select {...cellProps} className="bgrid__input bgrid__select" value={row.type} onChange={(e) => set(row.id, 'type', e.target.value)}>
                        {ARTICLE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </span>
                  )
                } else if (col.key === 'unit') {
                  const opts = BULK_UNITS.includes(row.unit) ? BULK_UNITS : [...BULK_UNITS, row.unit]
                  content = (
                    <select {...cellProps} className="bgrid__input bgrid__select" value={row.unit} onChange={(e) => set(row.id, 'unit', e.target.value)}>
                      {opts.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  )
                } else if (col.key === 'vat') {
                  const opts = BULK_VATS.includes(row.vat) ? BULK_VATS : [...BULK_VATS, row.vat]
                  content = (
                    <select {...cellProps} className="bgrid__input bgrid__select" value={row.vat} onChange={(e) => set(row.id, 'vat', e.target.value)}>
                      {opts.map((v) => <option key={v} value={v}>{BULK_VATS.includes(v) ? vatLabel(v) : v || '—'}</option>)}
                    </select>
                  )
                } else if (col.kind === 'number') {
                  content = (
                    <input
                      {...cellProps}
                      className="bgrid__input bgrid__input--num"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={row[col.key as 'price' | 'purchase']}
                      onChange={(e) => set(row.id, col.key, e.target.value)}
                      onBlur={(e) => { const n = parseAmount(e.target.value); if (n != null) set(row.id, col.key, formatAmount(n)) }}
                    />
                  )
                } else {
                  content = (
                    <input
                      {...cellProps}
                      className={`bgrid__input${col.key === 'name' ? ' bgrid__input--name' : ''}`}
                      list={col.key === 'category' ? 'bulk-categories' : undefined}
                      placeholder={r === rows.length - 1 && !row.name ? (col.key === 'name' ? 'Nom de l’article…' : col.key === 'reference' ? 'Référence…' : col.key === 'category' ? 'Catégorie…' : '') : ''}
                      value={row[col.key as 'name' | 'reference' | 'category']}
                      onChange={(e) => set(row.id, col.key, col.key === 'reference' ? e.target.value.toUpperCase() : e.target.value)}
                    />
                  )
                }
                return (
                  <td key={col.key} className={`bgrid__cell bgrid__cell--${col.kind}`} data-error={msg}>
                    {content}
                  </td>
                )
              })}
              <td className="bgrid__actions">
                <RowActions rowNumber={r + 1} onCommand={(cmd) => onRowCommand(row.id, cmd)} />
              </td>
            </tr>
          )
        })}
      </tbody>
      <datalist id="bulk-categories">{knownCategories.map((c) => <option key={c} value={c} />)}</datalist>
    </table>
  )
}

/** Menu « … » d'une ligne, rendu en position fixe pour ne pas être rogné par la grille. */
function RowActions({ rowNumber, onCommand }: { rowNumber: number; onCommand: (cmd: RowCommand) => void }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useDismiss(!!pos, [btnRef, menuRef], () => setPos(null))

  useLayoutEffect(() => {
    if (!pos) return
    const close = () => setPos(null)
    window.addEventListener('resize', close)
    document.querySelector('.bulk__grid')?.addEventListener('scroll', close)
    return () => { window.removeEventListener('resize', close); document.querySelector('.bulk__grid')?.removeEventListener('scroll', close) }
  }, [pos])

  const open = () => {
    const r = btnRef.current!.getBoundingClientRect()
    const h = 130, w = 210
    setPos({ top: r.bottom + 4 + h > window.innerHeight ? r.top - 4 - h : r.bottom + 4, left: Math.max(8, r.right - w) })
  }
  const run = (cmd: RowCommand) => { setPos(null); onCommand(cmd) }

  return (
    <>
      <button ref={btnRef} type="button" className="bgrid__more" aria-haspopup="menu" aria-expanded={!!pos} aria-label={`Actions pour la ligne ${rowNumber}`} onClick={() => (pos ? setPos(null) : open())}>
        <DotsThreeIcon size={18} weight="bold" aria-hidden />
      </button>
      {pos && createPortal(
        <div ref={menuRef} className="menu" role="menu" style={{ position: 'fixed', top: pos.top, left: pos.left, width: 210 }}>
          <button type="button" role="menuitem" className="menu__item" onClick={() => run('duplicate')}><CopySimpleIcon size={16} aria-hidden /> Dupliquer la ligne</button>
          <button type="button" role="menuitem" className="menu__item" onClick={() => run('insert')}><RowsPlusBottomIcon size={16} aria-hidden /> Insérer une ligne dessous</button>
          <div className="menu__sep" />
          <button type="button" role="menuitem" className="menu__item menu__item--danger" onClick={() => run('delete')}><TrashIcon size={16} aria-hidden /> Supprimer la ligne</button>
        </div>,
        document.body,
      )}
    </>
  )
}
