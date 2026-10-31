import { useMemo, useRef, useState, type DragEvent } from 'react'
import { ArrowRightIcon, ClipboardTextIcon, CloudArrowUpIcon, FileXlsIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import {
  COLUMNS, FIELD_LABELS, assignField, emptyRow, guessField, isEmptyRow, looksLikeHeader, parseDelimited,
  type BulkRow, type Defaults, type FieldKey,
} from './model'

type Target = FieldKey | 'ignore'

interface Props {
  mode: 'file' | 'paste'
  defaults: Defaults
  onAddRows: (rows: BulkRow[], source: string) => void
}

/** Décode un CSV en UTF-8, ou en Windows-1252 (export Excel français) si l'UTF-8 échoue. */
function decodeText(buf: ArrayBuffer) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf) } catch { return new TextDecoder('windows-1252').decode(buf) }
}

async function readFile(file: File): Promise<string[][]> {
  const buf = await file.arrayBuffer()
  if (/\.(xlsx|xlsm|xls|ods)$/i.test(file.name)) {
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: '' })
    return rows.map((r) => r.map((c) => String(c ?? ''))).filter((r) => r.some((c) => c.trim()))
  }
  return parseDelimited(decodeText(buf))
}

/**
 * Étape 1 : choisir la source (fichier ou collage) ; étape 2 : associer les colonnes et vérifier l'aperçu.
 * Les lignes sont ensuite ajoutées au tableau, où la validation en direct prend le relais (étape 3).
 */
export function ImportFlow({ mode, defaults, onAddRows }: Props) {
  const [source, setSource] = useState<{ name: string; matrix: string[][] } | null>(null)
  const [hasHeader, setHasHeader] = useState(true)
  const [mapping, setMapping] = useState<Target[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = (name: string, matrix: string[][]) => {
    if (!matrix.length) { setError('Aucune donnée trouvée. Vérifiez que le fichier contient un tableau.'); return }
    const header = looksLikeHeader(matrix[0])
    setHasHeader(header)
    setMapping(autoMap(matrix, header))
    setSource({ name, matrix })
    setError(null)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (!/\.(xlsx|xlsm|xls|ods|csv|tsv|txt)$/i.test(file.name)) {
      setError(`« ${file.name} » n’est pas un fichier tabulaire. Formats acceptés : .xlsx, .xls, .csv, .tsv.`)
      return
    }
    setBusy(true)
    try { load(file.name, await readFile(file)) }
    catch { setError(`Impossible de lire « ${file.name} ». Enregistrez-le en .xlsx ou .csv puis réessayez.`) }
    finally { setBusy(false) }
  }

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files[0]) }

  const width = source ? Math.max(...source.matrix.map((r) => r.length)) : 0
  const dataRows = source ? (hasHeader ? source.matrix.slice(1) : source.matrix) : []

  const built = useMemo(() => {
    if (!source) return []
    return dataRows
      .map((line) => line.reduce((row, val, j) => (mapping[j] && mapping[j] !== 'ignore' ? assignField(row, mapping[j] as FieldKey, val, defaults) : row), emptyRow(defaults)))
      .filter((r) => !isEmptyRow(r))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, hasHeader, mapping, defaults])

  const dupTargets = mapping.filter((m, i) => m !== 'ignore' && mapping.indexOf(m) !== i)
  const nameMapped = mapping.includes('name')

  /* ───── Étape 1 : source ───── */
  if (!source) {
    return (
      <section className="import" aria-label={mode === 'file' ? 'Importer un fichier' : 'Copier depuis Excel'}>
        <Steps step={1} />
        {mode === 'file' ? (
          <div
            className="import__drop"
            data-dragging={dragging || undefined}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <CloudArrowUpIcon size={30} weight="duotone" aria-hidden />
            <p className="import__drop-title">{busy ? 'Lecture du fichier…' : 'Déposez votre fichier ici'}</p>
            <p className="import__drop-text">Excel (.xlsx, .xls) ou CSV. La première feuille est utilisée.</p>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              <FileXlsIcon size={16} weight="duotone" aria-hidden /> Choisir un fichier
            </button>
            <input ref={fileRef} id="bulk-file" type="file" accept=".xlsx,.xlsm,.xls,.ods,.csv,.tsv,.txt" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
          </div>
        ) : (
          <div className="import__paste">
            <label htmlFor="bulk-paste" className="import__paste-label">
              <ClipboardTextIcon size={18} weight="duotone" aria-hidden />
              Sélectionnez vos lignes dans Excel (avec la ligne d’en-têtes si possible), copiez-les, puis collez-les ici.
            </label>
            <textarea
              id="bulk-paste"
              className="textarea import__paste-area"
              placeholder={'Désignation\tCode\tPU HT\tTVA\nHeure de plomberie\tMO-001\t65,00\t20 %'}
              onPaste={(e) => { e.preventDefault(); load('Collage depuis Excel', parseDelimited(e.clipboardData.getData('text/plain'))) }}
              onChange={(e) => { if (e.target.value.includes('\n')) load('Collage depuis Excel', parseDelimited(e.target.value)) }}
            />
          </div>
        )}
        {error && <p className="import__error"><WarningCircleIcon size={16} weight="fill" aria-hidden /> {error}</p>}
      </section>
    )
  }

  /* ───── Étape 2 : association des colonnes + aperçu ───── */
  return (
    <section className="import" aria-label="Associer les colonnes">
      <Steps step={2} />
      <div className="import__bar">
        <span className="import__source"><FileXlsIcon size={17} weight="duotone" aria-hidden /> {source.name} · {dataRows.length} ligne{dataRows.length > 1 ? 's' : ''}</span>
        <label className="check import__header-toggle">
          <input type="checkbox" checked={hasHeader} onChange={(e) => { setHasHeader(e.target.checked); setMapping(autoMap(source.matrix, e.target.checked)) }} />
          <span>La première ligne contient les en-têtes</span>
        </label>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSource(null)}><XIcon size={14} weight="bold" aria-hidden /> Changer de source</button>
      </div>

      <div className="import__cols">
        <div className="mapping">
          <div className="mapping__head"><span>Colonne du fichier</span><span /><span>Champ SENOVA</span></div>
          {Array.from({ length: width }, (_, j) => {
            const header = hasHeader ? source.matrix[0][j] || `Colonne ${j + 1}` : `Colonne ${j + 1}`
            const sample = dataRows.find((r) => r[j]?.trim())?.[j] ?? ''
            const dup = mapping[j] !== 'ignore' && dupTargets.includes(mapping[j])
            return (
              <div key={j} className="mapping__row" data-ignored={mapping[j] === 'ignore' || undefined}>
                <span className="mapping__src">
                  <strong>{header}</strong>
                  <small title={sample}>{sample || '—'}</small>
                </span>
                <ArrowRightIcon size={14} className="mapping__arrow" aria-hidden />
                <select
                  className="select mapping__select"
                  aria-label={`Champ SENOVA pour la colonne ${header}`}
                  aria-invalid={dup || undefined}
                  value={mapping[j] ?? 'ignore'}
                  onChange={(e) => setMapping((m) => m.map((v, k) => (k === j ? (e.target.value as Target) : v)))}
                >
                  <option value="ignore">Ne pas importer</option>
                  {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            )
          })}
        </div>

        <div className="preview">
          <p className="preview__title">Aperçu <small>{built.length > 5 ? `5 premières lignes sur ${built.length}` : `${built.length} ligne${built.length > 1 ? 's' : ''}`}</small></p>
          <div className="preview__scroll">
            <table className="preview__table">
              <thead><tr>{(['name', 'reference', 'price', 'vat'] as FieldKey[]).map((k) => <th key={k}>{FIELD_LABELS[k]}</th>)}</tr></thead>
              <tbody>
                {built.slice(0, 5).map((r) => (
                  <tr key={r.id}><td>{r.name || <em>vide</em>}</td><td>{r.reference || '—'}</td><td className="num" data-bad={r.price && !/^\d+,\d{2}$/.test(r.price) ? true : undefined}>{r.price || '—'}</td><td>{r.vat ? `${r.vat.replace('.', ',')} %` : '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="import__foot">
        <p className="import__hint">
          {!nameMapped
            ? <span className="import__warn"><WarningCircleIcon size={15} weight="fill" aria-hidden /> Associez une colonne au champ « Nom de l’article ».</span>
            : dupTargets.length
              ? <span className="import__warn"><WarningCircleIcon size={15} weight="fill" aria-hidden /> Un même champ est associé à plusieurs colonnes ; seule la dernière sera prise en compte.</span>
              : 'Les lignes seront ajoutées au tableau, où vous pourrez les corriger avant l’import.'}
        </p>
        <button type="button" className="btn btn--teal-solid" disabled={!nameMapped || !built.length} onClick={() => onAddRows(built, source.name)}>
          Ajouter {built.length} ligne{built.length > 1 ? 's' : ''} au tableau <ArrowRightIcon size={15} weight="bold" aria-hidden />
        </button>
      </div>
    </section>
  )
}

function autoMap(matrix: string[][], header: boolean): Target[] {
  const width = Math.max(...matrix.map((r) => r.length))
  if (header) {
    const seen = new Set<FieldKey>()
    return Array.from({ length: width }, (_, j) => {
      const g = guessField(matrix[0][j] ?? '')
      if (!g || seen.has(g)) return 'ignore'
      seen.add(g)
      return g
    })
  }
  // Sans en-têtes : ordre des colonnes SENOVA
  return Array.from({ length: width }, (_, j) => COLUMNS[j]?.key ?? 'ignore')
}

function Steps({ step }: { step: 1 | 2 }) {
  const items = ['Source', 'Colonnes et aperçu', 'Vérification dans le tableau']
  return (
    <ol className="steps">
      {items.map((label, i) => (
        <li key={label} className="steps__item" data-state={i + 1 < step ? 'done' : i + 1 === step ? 'current' : 'todo'}>
          <span className="steps__n">{i + 1}</span>{label}
        </li>
      ))}
    </ol>
  )
}
