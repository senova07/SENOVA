import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react'
import {
  CaretRightIcon, CheckIcon, DotsSixVerticalIcon, EnvelopeSimpleIcon, EyeIcon, FloppyDiskIcon, LockSimpleIcon, MagnifyingGlassIcon,
  NotePencilIcon, PackageIcon, PaintBrushIcon, PaperclipIcon, PercentIcon, PaperPlaneTiltIcon, PhoneIcon, PlusIcon, RowsIcon, StarIcon, TextTIcon, TrashIcon, UserPlusIcon, XIcon,
} from '@phosphor-icons/react'
import type { Article } from '../data/articles'
import {
  CLIENTS, PAYMENT_METHODS, PAYMENT_TERMS, UNITS, VALIDITIES, VATS, addDays, computeTotals, formatDate, initialQuote, lineId, lineTotal, sectionTotal,
  type Client, type Quote, type QuoteLine,
} from '../data/quote'
import { formatPrice, normalize } from '../lib/format'
import { useDismiss } from '../lib/useDismiss'
import { DocumentPreview, type DocArea } from '../components/docs/DocumentPreview'
import { PaneTabs, Step, ZoomControls, useNarrow, usePreviewScale, type ZoomMode } from '../components/docs/Studio'
import type { DocTheme } from '../components/docs/theme'
import '../components/docs/quote.css'

type StepId = 'client' | 'infos' | 'lines' | 'conditions' | 'recap'

interface Props {
  theme: DocTheme
  catalogue: Article[]
  onOpenAppearance: () => void
  onBack: () => void
  notify: (message: string, actionLabel?: string, onAction?: () => void) => void
}

const AREA_TO_STEP: Record<DocArea, StepId> = {
  header: 'infos', parties: 'client', table: 'lines', totals: 'recap', conditions: 'conditions', footer: 'conditions',
}

const num = (raw: string) => {
  const n = Number(raw.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}
const fmtNum = (n: number) => String(n).replace('.', ',')
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export function QuotePage({ theme, catalogue, onOpenAppearance, onBack, notify }: Props) {
  const [quote, setQuote] = useState<Quote>(initialQuote)
  const [clients, setClients] = useState<Client[]>(CLIENTS)
  const [open, setOpen] = useState<Set<StepId>>(new Set(['client', 'infos', 'lines']))
  const [zoom, setZoom] = useState<ZoomMode>('fit')
  const [pages, setPages] = useState(1)
  const [pane, setPane] = useState<'edit' | 'preview'>('edit')
  const [dialog, setDialog] = useState<'pdf' | 'send' | null>(null)
  const [savedAt, setSavedAt] = useState(() => Date.now() - 5000)
  const [saving, setSaving] = useState(false)
  const [, tick] = useState(0)
  const narrow = useNarrow()
  const { ref: previewRef, scale } = usePreviewScale(zoom)
  const firstRender = useRef(true)

  const client = clients.find((c) => c.id === quote.clientId) ?? null
  const totals = useMemo(() => computeTotals(quote.lines, quote.depositPct), [quote.lines, quote.depositPct])
  const itemCount = quote.lines.filter((l) => l.kind === 'item').length

  // Enregistrement automatique simulé (local)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    setSaving(true)
    const t = window.setTimeout(() => { setSaving(false); setSavedAt(Date.now()) }, 700)
    return () => window.clearTimeout(t)
  }, [quote])
  useEffect(() => { const i = window.setInterval(() => tick((x) => x + 1), 5000); return () => window.clearInterval(i) }, [])
  const ago = Math.max(1, Math.round((Date.now() - savedAt) / 1000))
  const agoLabel = ago < 60 ? `il y a ${ago} s` : `il y a ${Math.round(ago / 60)} min`

  const patch = (p: Partial<Quote>) => setQuote((q) => ({ ...q, ...p }))
  const toggle = (id: StepId) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const jump = (area: DocArea) => {
    const id = AREA_TO_STEP[area]
    setOpen((s) => new Set(s).add(id))
    if (narrow) setPane('edit')
    requestAnimationFrame(() => {
      const el = document.getElementById(`step-${id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el?.querySelector<HTMLElement>('input, select, textarea, button.client-card__change')?.focus({ preventScroll: true })
    })
  }

  /* ───── Lignes ───── */
  const setLines = (fn: (l: QuoteLine[]) => QuoteLine[]) => setQuote((q) => ({ ...q, lines: fn(q.lines) }))
  const updateLine = (id: string, p: Partial<QuoteLine>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)))
  const removeLine = (id: string) => {
    const before = quote.lines
    setLines((ls) => ls.filter((l) => l.id !== id))
    notify('Ligne supprimée', 'Annuler', () => setLines(() => before))
  }
  const addLine = (line: Omit<QuoteLine, 'id'>) => {
    const l = { ...line, id: lineId() }
    setLines((ls) => [...ls, l])
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-line="${l.id}"] .qline__desc`)?.focus())
  }
  const addFromCatalogue = (a: Article) => {
    addLine({ kind: 'item', label: a.name, reference: a.reference, qty: 1, unit: a.unit, price: a.priceHT, vat: a.vatRate, discount: 0 })
    notify(`« ${a.name} » ajouté au devis`)
  }

  return (
    <>
      <div className="studio-head">
        <div>
          <nav className="crumbs" aria-label="Fil d’Ariane">
            <span>Ventes</span><CaretRightIcon size={11} weight="bold" aria-hidden />
            <button type="button" onClick={onBack}>Devis</button><CaretRightIcon size={11} weight="bold" aria-hidden />
            <span aria-current="page">Nouveau devis</span>
          </nav>
          <h1 className="studio-head__title">Nouveau devis <span className="studio-head__num">{quote.number}</span></h1>
        </div>
      </div>

      <PaneTabs value={pane} onChange={setPane} />

      <div className="studio" data-pane={pane}>
        {/* ═════ Formulaire ═════ */}
        <div className="studio__form">
          <Step id="step-client" n={1} title="Client" open={open.has('client')} onToggle={() => toggle('client')} status={client ? 'done' : undefined}
            summary={client ? [client.civility, client.name].filter(Boolean).join(' ') : 'À choisir'}>
            <ClientStep
              clients={clients}
              client={client}
              quote={quote}
              onPick={(id) => patch({ clientId: id })}
              onCreate={(c) => { setClients((l) => [c, ...l]); patch({ clientId: c.id }); notify(`Client « ${c.name} » créé`) }}
              onPatch={patch}
            />
          </Step>

          <Step id="step-infos" n={2} title="Informations" open={open.has('infos')} onToggle={() => toggle('infos')}
            summary={quote.object || quote.number}>
            <div className="field">
              <label className="field__label" htmlFor="q-object">Objet du devis</label>
              <input id="q-object" className="input" placeholder="Ex. : Rénovation salle de bain" value={quote.object} onChange={(e) => patch({ object: e.target.value })} />
            </div>
            <div className="fgrid fgrid--3">
              <div className="field">
                <label className="field__label" htmlFor="q-number">Numéro</label>
                <div className="input-lock"><input id="q-number" className="input" value={quote.number} readOnly /><LockSimpleIcon size={14} aria-hidden /></div>
                <span className="field__aside">Attribué automatiquement</span>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="q-date">Date</label>
                <input id="q-date" type="date" className="input" value={quote.date} onChange={(e) => e.target.value && patch({ date: e.target.value })} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="q-validity">Validité</label>
                <select id="q-validity" className="select" value={quote.validityDays} onChange={(e) => patch({ validityDays: Number(e.target.value) })}>
                  {VALIDITIES.map((v) => <option key={v} value={v}>{v} jours</option>)}
                </select>
                <span className="field__aside">Expire le {formatDate(addDays(quote.date, quote.validityDays))}</span>
              </div>
            </div>
          </Step>

          <Step id="step-lines" n={3} title="Lignes" open={open.has('lines')} onToggle={() => toggle('lines')}
            summary={`${itemCount} article${itemCount > 1 ? 's' : ''} · ${formatPrice(totals.ht)} HT`}>
            <LinesStep
              lines={quote.lines}
              catalogue={catalogue}
              onUpdate={updateLine}
              onRemove={removeLine}
              onReorder={(next) => setLines(() => next)}
              onAddItem={(a) => addFromCatalogue(a)}
              onAddBlank={() => addLine({ kind: 'item', label: '', qty: 1, unit: 'forfait', price: 0, vat: 10, discount: 0 })}
              onAddSection={() => addLine({ kind: 'section', label: '', qty: 0, unit: '', price: 0, vat: 0, discount: 0 })}
              onAddText={() => addLine({ kind: 'text', label: '', qty: 0, unit: '', price: 0, vat: 0, discount: 0 })}
            />
          </Step>

          <Step id="step-conditions" n={4} title="Conditions" open={open.has('conditions')} onToggle={() => toggle('conditions')}
            summary={quote.depositPct ? `Acompte ${quote.depositPct} %` : 'Sans acompte'}>
            <div className="field">
              <span className="field__label" id="q-deposit-label">Acompte demandé</span>
              <div className="deposit" role="group" aria-labelledby="q-deposit-label">
                {[0, 20, 30, 40, 50].map((p) => (
                  <button key={p} type="button" className="deposit__opt" aria-pressed={quote.depositPct === p} onClick={() => patch({ depositPct: p })}>
                    {p === 0 ? 'Aucun' : `${p} %`}
                  </button>
                ))}
                <label className="deposit__custom">
                  <span className="sr-only">Autre pourcentage</span>
                  <input className="input" inputMode="numeric" value={quote.depositPct} onChange={(e) => patch({ depositPct: Math.min(100, Math.round(num(e.target.value))) })} />
                  <span>%</span>
                </label>
              </div>
              {quote.depositPct > 0 && <span className="field__aside">Soit {formatPrice(totals.deposit)} à verser à la commande</span>}
            </div>
            <div className="field">
              <label className="field__label" htmlFor="q-terms">Conditions de paiement</label>
              <select id="q-terms" className="select" value={quote.paymentTerms} onChange={(e) => patch({ paymentTerms: e.target.value })}>
                {PAYMENT_TERMS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field__label">Moyens de paiement acceptés</span>
              <div className="chips">
                {PAYMENT_METHODS.map((m) => {
                  const on = quote.paymentMethods.includes(m)
                  return (
                    <button key={m} type="button" className="chip" aria-pressed={on}
                      onClick={() => patch({ paymentMethods: on ? quote.paymentMethods.filter((x) => x !== m) : PAYMENT_METHODS.filter((x) => x === m || quote.paymentMethods.includes(x)) })}>
                      {on && <CheckIcon size={13} weight="bold" aria-hidden />}{m}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="q-notes">Note pour le client <small>facultatif</small></label>
              <textarea id="q-notes" className="textarea" rows={3} placeholder="Ex. : Les travaux peuvent débuter sous 15 jours après acceptation." value={quote.notes} onChange={(e) => patch({ notes: e.target.value })} />
            </div>
          </Step>

          <Step id="step-recap" n={5} title="Récapitulatif" open={open.has('recap')} onToggle={() => toggle('recap')}
            summary={`${formatPrice(totals.ttc)} TTC`}>
            <dl className="recap">
              <div><dt>Total HT</dt><dd>{formatPrice(totals.ht)}</dd></div>
              {totals.vat.map((v) => <div key={v.rate}><dt>TVA {fmtNum(v.rate)} % <small>sur {formatPrice(v.base)}</small></dt><dd>{formatPrice(v.amount)}</dd></div>)}
              <div className="recap__ttc"><dt>Total TTC</dt><dd>{formatPrice(totals.ttc)}</dd></div>
              {quote.depositPct > 0 && <div className="recap__deposit"><dt>Acompte demandé ({quote.depositPct} %)</dt><dd>{formatPrice(totals.deposit)}</dd></div>}
            </dl>
          </Step>
        </div>

        {/* ═════ Aperçu ═════ */}
        <div className="studio__preview">
          <div className="preview-bar">
            <ZoomControls zoom={zoom} scale={scale} onZoom={setZoom} />
            <span className="preview-bar__pages">Page{pages > 1 ? 's' : ''} 1{pages > 1 ? `–${pages}` : ''} sur {pages}</span>
            <span className="preview-bar__spacer" />
            <button type="button" className="btn btn--secondary btn--sm" onClick={onOpenAppearance}>
              <PaintBrushIcon size={15} aria-hidden /> Modifier l’apparence
            </button>
          </div>
          <div className="preview-scroll" ref={previewRef}>
            <DocumentPreview theme={theme} kind="devis" quote={quote} client={client} scale={scale} onJump={jump} onPages={setPages} />
          </div>
        </div>
      </div>

      <div className="studio-bar">
        <span className="autosave" data-saving={saving || undefined} aria-live="polite">
          <span className="autosave__dot" aria-hidden />
          {saving ? 'Enregistrement…' : `Enregistré ${agoLabel}`}
        </span>
        <div className="studio-bar__actions">
          <button type="button" className="btn btn--secondary" onClick={() => { setSavedAt(Date.now()); notify(`Brouillon ${quote.number} enregistré`) }}>
            <FloppyDiskIcon size={17} aria-hidden /> Enregistrer le brouillon
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setDialog('pdf')}>
            <EyeIcon size={17} aria-hidden /> Aperçu PDF
          </button>
          <button type="button" className="btn btn--teal-solid" onClick={() => setDialog('send')} disabled={!client || !itemCount}>
            <PaperPlaneTiltIcon size={17} weight="fill" aria-hidden /> Envoyer au client
          </button>
        </div>
      </div>

      {dialog === 'pdf' && (
        <Modal title={`Aperçu PDF · ${quote.number}`} onClose={() => setDialog(null)} wide>
          <div className="pdf-view">
            <DocumentPreview theme={theme} kind="devis" quote={quote} client={client} scale={1} />
          </div>
        </Modal>
      )}
      {dialog === 'send' && client && (
        <SendDialog quote={quote} client={client} total={totals.ttc} onClose={() => setDialog(null)}
          onSend={() => { setDialog(null); notify('Démonstration : aucun e-mail n’a été envoyé') }} />
      )}
    </>
  )
}

/* ═════ Étape 1 : client ═════ */
function ClientStep({ clients, client, quote, onPick, onCreate, onPatch }: {
  clients: Client[]; client: Client | null; quote: Quote
  onPick: (id: string) => void; onCreate: (c: Client) => void; onPatch: (p: Partial<Quote>) => void
}) {
  const [searching, setSearching] = useState(!client)
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState({ name: '', email: '', phone: '', address: '', zip: '', city: '' })
  const found = clients.filter((c) => !query || normalize(`${c.name} ${c.city} ${c.email}`).includes(normalize(query)))

  if (creating) {
    const valid = draft.name.trim().length > 1
    return (
      <div className="client-new">
        <div className="fgrid">
          <div className="field field--wide"><label className="field__label" htmlFor="nc-name">Nom ou raison sociale</label><input id="nc-name" className="input" autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
          <div className="field"><label className="field__label" htmlFor="nc-email">E-mail</label><input id="nc-email" type="email" className="input" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
          <div className="field"><label className="field__label" htmlFor="nc-phone">Téléphone</label><input id="nc-phone" className="input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
          <div className="field field--wide"><label className="field__label" htmlFor="nc-address">Adresse</label><input id="nc-address" className="input" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></div>
          <div className="field"><label className="field__label" htmlFor="nc-zip">Code postal</label><input id="nc-zip" className="input" value={draft.zip} onChange={(e) => setDraft({ ...draft, zip: e.target.value })} /></div>
          <div className="field"><label className="field__label" htmlFor="nc-city">Ville</label><input id="nc-city" className="input" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></div>
        </div>
        <div className="inline-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCreating(false)}>Annuler</button>
          <button type="button" className="btn btn--primary btn--sm" disabled={!valid}
            onClick={() => { onCreate({ id: `c${Date.now()}`, civility: '', ...draft }); setCreating(false); setSearching(false) }}>
            Créer le client
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="client-row">
        {searching || !client ? (
          <div className="client-search">
            <MagnifyingGlassIcon size={16} className="client-search__icon" aria-hidden />
            <input className="input" autoFocus={!!client} placeholder="Rechercher un client par nom, ville ou e-mail…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher un client" />
            <ul className="client-search__list" role="listbox" aria-label="Clients">
              {found.map((c) => (
                <li key={c.id}>
                  <button type="button" role="option" aria-selected={c.id === quote.clientId} onClick={() => { onPick(c.id); setSearching(false); setQuery('') }}>
                    <span className="avatar">{initials(c.name)}</span>
                    <span><strong>{[c.civility, c.name].filter(Boolean).join(' ')}</strong><small>{c.city} · {c.email}</small></span>
                  </button>
                </li>
              ))}
              {!found.length && <li className="client-search__empty">Aucun client trouvé. Créez-le avec « Nouveau client ».</li>}
            </ul>
          </div>
        ) : (
          <div className="client-card">
            <span className="avatar avatar--lg">{initials(client.name)}</span>
            <div className="client-card__text">
              <strong>{[client.civility, client.name].filter(Boolean).join(' ')}</strong>
              <span><EnvelopeSimpleIcon size={13} aria-hidden /> {client.email}</span>
              <span><PhoneIcon size={13} aria-hidden /> {client.phone}</span>
            </div>
            <button type="button" className="btn btn--ghost btn--sm client-card__change" onClick={() => setSearching(true)}>Changer</button>
          </div>
        )}
        <button type="button" className="btn btn--secondary btn--sm client-row__new" onClick={() => setCreating(true)}>
          <UserPlusIcon size={15} aria-hidden /> Nouveau client
        </button>
      </div>

      {client && !searching && (
        <div className="fgrid">
          <div className="field">
            <span className="field__label">Adresse de facturation</span>
            <p className="addr">{client.address}<br />{client.zip} {client.city}</p>
          </div>
          <div className="field">
            <label className="check check--plain">
              <input type="checkbox" checked={quote.siteDifferent} onChange={(e) => onPatch({ siteDifferent: e.target.checked })} />
              <span>Adresse du chantier différente</span>
            </label>
            {quote.siteDifferent && (
              <div className="site-fields">
                <input className="input" aria-label="Adresse du chantier" placeholder="Adresse" value={quote.site.address} onChange={(e) => onPatch({ site: { ...quote.site, address: e.target.value } })} />
                <div className="site-fields__row">
                  <input className="input" aria-label="Code postal du chantier" placeholder="Code postal" value={quote.site.zip} onChange={(e) => onPatch({ site: { ...quote.site, zip: e.target.value } })} />
                  <input className="input" aria-label="Ville du chantier" placeholder="Ville" value={quote.site.city} onChange={(e) => onPatch({ site: { ...quote.site, city: e.target.value } })} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* ═════ Étape 3 : lignes ═════ */
function LinesStep({ lines, catalogue, onUpdate, onRemove, onReorder, onAddItem, onAddBlank, onAddSection, onAddText }: {
  lines: QuoteLine[]; catalogue: Article[]
  onUpdate: (id: string, p: Partial<QuoteLine>) => void; onRemove: (id: string) => void; onReorder: (l: QuoteLine[]) => void
  onAddItem: (a: Article) => void; onAddBlank: () => void; onAddSection: () => void; onAddText: () => void
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null)
  const [showDisc, setShowDisc] = useState<Set<string>>(new Set())

  const onDragOver = (e: DragEvent<HTMLDivElement>, id: string) => {
    if (!dragId) return
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    setOver({ id, after: e.clientY > r.top + r.height / 2 })
  }
  const onDrop = () => {
    if (!dragId || !over || dragId === over.id) { setDragId(null); setOver(null); return }
    const moving = lines.find((l) => l.id === dragId)!
    const rest = lines.filter((l) => l.id !== dragId)
    const i = rest.findIndex((l) => l.id === over.id)
    rest.splice(over.after ? i + 1 : i, 0, moving)
    onReorder(rest)
    setDragId(null); setOver(null)
  }
  const move = (id: string, dir: -1 | 1) => {
    const i = lines.findIndex((l) => l.id === id)
    const j = i + dir
    if (j < 0 || j >= lines.length) return
    const next = [...lines]; [next[i], next[j]] = [next[j], next[i]]
    onReorder(next)
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-line="${id}"] .qline__handle`)?.focus())
  }

  return (
    <>
      <div className="lines-toolbar">
        <CataloguePicker catalogue={catalogue} onPick={onAddItem} onBlank={onAddBlank} />
        <button type="button" className="btn btn--secondary btn--sm" onClick={onAddSection}><RowsIcon size={15} aria-hidden /> Ajouter une section</button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={onAddText}><TextTIcon size={15} aria-hidden /> Texte libre</button>
      </div>

      <div className="qlines" onDragEnd={() => { setDragId(null); setOver(null) }}>
        {lines.length === 0 && <p className="qlines__empty">Aucune ligne pour l’instant. Ajoutez un article du catalogue ou une section.</p>}
        {lines.map((l, i) => {
          const common = {
            'data-line': l.id,
            'data-dragging': dragId === l.id || undefined,
            'data-over': over?.id === l.id ? (over.after ? 'after' : 'before') : undefined,
            onDragOver: (e: DragEvent<HTMLDivElement>) => onDragOver(e, l.id),
            onDrop,
          }
          const handle = (
            <button
              type="button"
              className="qline__handle"
              draggable
              onDragStart={(e) => { setDragId(l.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', l.id) }}
              onKeyDown={(e) => { if (e.key === 'ArrowUp' && e.altKey) { e.preventDefault(); move(l.id, -1) } if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); move(l.id, 1) } }}
              aria-label={`Déplacer la ligne ${i + 1} (glisser, ou Alt + flèches)`}
              title="Glisser pour déplacer"
            >
              <DotsSixVerticalIcon size={16} weight="bold" aria-hidden />
            </button>
          )
          const del = (
            <button type="button" className="qline__del" onClick={() => onRemove(l.id)} aria-label={`Supprimer la ligne ${i + 1}`} title="Supprimer">
              <TrashIcon size={15} aria-hidden />
            </button>
          )

          if (l.kind === 'section') {
            return (
              <div key={l.id} className="qline qline--section" {...common}>
                {handle}
                <input className="qline__section-input" value={l.label} placeholder="Nom de la section (ex. : Cuisine)" onChange={(e) => onUpdate(l.id, { label: e.target.value })} aria-label="Nom de la section" />
                <span className="qline__subtotal num">{formatPrice(sectionTotal(lines, i))}</span>
                {del}
              </div>
            )
          }
          if (l.kind === 'text') {
            return (
              <div key={l.id} className="qline qline--text" {...common}>
                {handle}
                <NotePencilIcon size={15} className="qline__text-icon" aria-hidden />
                <input className="qline__desc qline__desc--text" value={l.label} placeholder="Texte libre affiché dans le devis" onChange={(e) => onUpdate(l.id, { label: e.target.value })} aria-label="Texte libre" />
                {del}
              </div>
            )
          }
          return (
            <div key={l.id} className="qline" {...common}>
              {handle}
              <div className="qline__main">
                <div className="qline__top">
                  <input className="qline__desc" value={l.label} placeholder="Description de la prestation" onChange={(e) => onUpdate(l.id, { label: e.target.value })} aria-label={`Description, ligne ${i + 1}`} />
                  <span className="qline__total num" aria-label="Total HT de la ligne">{formatPrice(lineTotal(l))}</span>
                </div>
                <div className="qline__fields">
                  <label className="mini mini--qty"><span>Qté</span><input inputMode="decimal" value={fmtNum(l.qty)} onChange={(e) => onUpdate(l.id, { qty: num(e.target.value) })} /></label>
                  <label className="mini mini--unit"><span className="sr-only">Unité</span>
                    <select value={l.unit} onChange={(e) => onUpdate(l.id, { unit: e.target.value })}>
                      {(UNITS.includes(l.unit) ? UNITS : [l.unit, ...UNITS]).map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </label>
                  <label className="mini mini--price"><span className="sr-only">Prix unitaire HT</span><input inputMode="decimal" value={fmtNum(l.price)} onChange={(e) => onUpdate(l.id, { price: num(e.target.value) })} /><em>€ HT</em></label>
                  <label className="mini mini--vat"><span>TVA</span>
                    <select value={l.vat} onChange={(e) => onUpdate(l.id, { vat: Number(e.target.value) })}>
                      {VATS.map((v) => <option key={v} value={v}>{fmtNum(v)} %</option>)}
                    </select>
                  </label>
                  {l.discount > 0 || showDisc.has(l.id) ? (
                    <label className="mini mini--disc" data-active={l.discount > 0 || undefined}><span>Remise</span><input autoFocus={l.discount === 0} inputMode="decimal" value={fmtNum(l.discount)} onChange={(e) => onUpdate(l.id, { discount: Math.min(100, num(e.target.value)) })} /><em>%</em></label>
                  ) : (
                    <button type="button" className="mini-add" onClick={() => setShowDisc((s) => new Set(s).add(l.id))} aria-label={`Ajouter une remise, ligne ${i + 1}`} title="Ajouter une remise">
                      <PercentIcon size={13} weight="bold" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
              {del}
            </div>
          )
        })}
      </div>
    </>
  )
}

/* Recherche dans le catalogue d'articles, favoris en premier */
function CataloguePicker({ catalogue, onPick, onBlank }: { catalogue: Article[]; onPick: (a: Article) => void; onBlank: () => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [onlyFav, setOnlyFav] = useState(true)
  const btn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  useDismiss(open, [btn, panel], () => setOpen(false))
  const list = catalogue
    .filter((a) => (q ? normalize(`${a.name} ${a.reference} ${a.category ?? ''}`).includes(normalize(q)) : !onlyFav || a.favorite))
    .slice(0, 40)

  return (
    <div className="picker">
      <button ref={btn} type="button" className="btn btn--primary btn--sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <PlusIcon size={15} weight="bold" aria-hidden /> Ajouter un article
      </button>
      {open && (
        <div ref={panel} className="menu picker__panel" role="dialog" aria-label="Choisir un article">
          <div className="picker__search">
            <MagnifyingGlassIcon size={15} aria-hidden />
            <input autoFocus className="input" placeholder="Rechercher dans le catalogue…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {!q && (
            <div className="seg picker__tabs" role="radiogroup" aria-label="Filtrer">
              <button type="button" role="radio" className="seg__opt" aria-checked={onlyFav} onClick={() => setOnlyFav(true)}><StarIcon size={13} weight="fill" aria-hidden /> Favoris</button>
              <button type="button" role="radio" className="seg__opt" aria-checked={!onlyFav} onClick={() => setOnlyFav(false)}>Tous les articles</button>
            </div>
          )}
          <ul className="picker__list">
            {list.map((a) => (
              <li key={a.id}>
                <button type="button" className="picker__item" onClick={() => { onPick(a); setOpen(false); setQ('') }}>
                  {a.favorite ? <StarIcon size={14} weight="fill" className="picker__star" aria-hidden /> : <PackageIcon size={14} className="picker__pkg" aria-hidden />}
                  <span className="picker__name">{a.name}<small>{a.reference} · {a.unit}</small></span>
                  <span className="picker__price num">{formatPrice(a.priceHT)}</span>
                </button>
              </li>
            ))}
            {!list.length && <li className="picker__empty">Aucun article ne correspond.</li>}
          </ul>
          <button type="button" className="menu__item picker__blank" onClick={() => { onBlank(); setOpen(false) }}>
            <PlusIcon size={15} aria-hidden /> Ligne vide, hors catalogue
          </button>
        </div>
      )}
    </div>
  )
}

/* ═════ Fenêtres ═════ */
function Modal({ title, onClose, children, wide, footer }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="modal-root">
      <div className="modal-scrim" onClick={onClose} aria-hidden />
      <div className="modal" data-wide={wide || undefined} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer"><XIcon size={18} weight="bold" aria-hidden /></button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  )
}

function SendDialog({ quote, client, total, onClose, onSend }: { quote: Quote; client: Client; total: number; onClose: () => void; onSend: () => void }) {
  const [to, setTo] = useState(client.email)
  const [subject, setSubject] = useState(`Devis ${quote.number} – ${quote.object}`)
  const [message, setMessage] = useState(
    `Bonjour ${[client.civility, client.name].filter(Boolean).join(' ')},\n\nVeuillez trouver ci-joint notre devis ${quote.number} pour « ${quote.object} », d’un montant de ${formatPrice(total)} TTC.\n\nVous pouvez le signer en ligne ou nous le retourner avec la mention « Bon pour accord ».\n\nBien cordialement,\nAtelier Martin`,
  )
  return (
    <Modal
      title="Envoyer le devis"
      onClose={onClose}
      footer={(
        <>
          <span className="modal__note">Démonstration : l’envoi d’e-mails n’est pas encore branché dans cette maquette.</span>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button type="button" className="btn btn--teal-solid" onClick={onSend}><PaperPlaneTiltIcon size={16} weight="fill" aria-hidden /> Envoyer</button>
        </>
      )}
    >
      <div className="field"><label className="field__label" htmlFor="m-to">Destinataire</label><input id="m-to" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      <div className="field"><label className="field__label" htmlFor="m-subject">Objet</label><input id="m-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <div className="field"><label className="field__label" htmlFor="m-msg">Message</label><textarea id="m-msg" className="textarea" rows={8} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
      <div className="attach"><PaperclipIcon size={15} aria-hidden /> Pièce jointe : <strong>{quote.number}.pdf</strong></div>
    </Modal>
  )
}
