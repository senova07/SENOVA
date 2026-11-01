import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowCounterClockwiseIcon, ArrowLeftIcon, ArrowUUpLeftIcon, CaretRightIcon, CheckCircleIcon, CheckIcon, ImageSquareIcon,
  InfoIcon, TextAlignCenterIcon, TextAlignLeftIcon, TrashIcon, UploadSimpleIcon, WarningCircleIcon,
} from '@phosphor-icons/react'
import { CLIENTS, initialQuote, type QuoteLine } from '../data/quote'
import { AtelierLogo, DocumentPreview, type DocArea } from '../components/docs/DocumentPreview'
import { ColorWheel } from '../components/docs/ColorWheel'
import { DocTable } from '../components/docs/DocTable'
import { PaneTabs, Segmented, Step, Switch, ZoomControls, useNarrow, usePreviewScale, type ZoomMode } from '../components/docs/Studio'
import {
  DEFAULT_LOGO_PALETTES, DEFAULT_THEME, FONTS, PRESET_PALETTES, TABLE_STYLES, TEMPLATES, contrast, normalizeHex, onColor, palettesFromImage, tint,
  type DocKind, type DocTheme, type Legal, type TableStyleId,
} from '../components/docs/theme'
import '../components/docs/appearance.css'

type SectionId = 'colors' | 'template' | 'table' | 'font' | 'header' | 'legal' | 'texts' | 'options'

interface Props {
  theme: DocTheme
  backLabel: string
  onBack: () => void
  onApply: (t: DocTheme) => void
  notify: (message: string, actionLabel?: string, onAction?: () => void) => void
}

const KINDS: { id: DocKind; label: string }[] = [
  { id: 'devis', label: 'Devis' }, { id: 'facture', label: 'Facture' }, { id: 'avoir', label: 'Avoir' },
]

const LEGAL_FIELDS: { key: keyof Legal; label: string; placeholder: string; required?: boolean; help?: string; wide?: boolean }[] = [
  { key: 'siret', label: 'SIRET', placeholder: '14 chiffres', required: true, help: 'Numéro à 14 chiffres figurant sur votre extrait Kbis ou avis de situation INSEE.' },
  { key: 'vatNumber', label: 'N° de TVA intracommunautaire', placeholder: 'FR 00 000000000', required: true },
  { key: 'legalForm', label: 'Forme juridique', placeholder: 'EI, SARL, SAS…', required: true },
  { key: 'capital', label: 'Capital social', placeholder: 'Ex. : 5 000 €' },
  { key: 'registry', label: 'Immatriculation (RCS / RM)', placeholder: 'Ex. : RM Lyon 812 345 678', wide: true },
  { key: 'insurer', label: 'Assureur décennale', placeholder: 'Nom de l’assureur', required: true, help: 'Pour les travaux du bâtiment, le nom de l’assureur et la zone couverte figurent sur vos devis et factures.' },
  { key: 'insuranceContract', label: 'N° de contrat', placeholder: 'Numéro de police', required: true },
  { key: 'insuranceZone', label: 'Zone couverte', placeholder: 'Ex. : France métropolitaine', wide: true },
  { key: 'iban', label: 'IBAN', placeholder: 'FR76 …', required: true, help: 'Affiché sur vos factures pour faciliter le paiement par virement.', wide: true },
  { key: 'bic', label: 'BIC', placeholder: 'Ex. : AGRIFRPP' },
]

const AREA_OF: Partial<Record<SectionId, DocArea>> = {
  colors: 'header', template: 'header', table: 'table', font: 'header', header: 'header', legal: 'footer', texts: 'conditions', options: 'table',
}

export function AppearancePage({ theme: applied, backLabel, onBack, onApply, notify }: Props) {
  const [theme, setTheme] = useState<DocTheme>(applied)
  const [history, setHistory] = useState<DocTheme[]>([])
  const [kind, setKind] = useState<DocKind>('devis')
  const [open, setOpen] = useState<Set<SectionId>>(new Set(['colors']))
  const [flash, setFlash] = useState<{ area: DocArea; n: number } | null>(null)
  const [target, setTarget] = useState<'primary' | 'accent'>('primary')
  const [logoPalettes, setLogoPalettes] = useState<string[][]>(DEFAULT_LOGO_PALETTES)
  const [zoom, setZoom] = useState<ZoomMode>('fit')
  const [pane, setPane] = useState<'edit' | 'preview'>('edit')
  const narrow = useNarrow()
  const { ref: previewRef, scale } = usePreviewScale(zoom)
  const lastPush = useRef<{ key: string; at: number }>({ key: '', at: 0 })
  const fileRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const quote = useMemo(initialQuote, [])
  const client = CLIENTS[0]
  const dirty = JSON.stringify(theme) !== JSON.stringify(applied)

  /** Applique une modification ; les gestes continus (roue, saisie) sont regroupés en une seule étape d'annulation. */
  const update = (patch: Partial<DocTheme>, section: SectionId, coalesceKey?: string) => {
    const now = Date.now()
    const key = coalesceKey ?? `${section}:${Object.keys(patch).join(',')}`
    if (!(key === lastPush.current.key && now - lastPush.current.at < 900)) setHistory((h) => [...h.slice(-49), theme])
    lastPush.current = { key, at: now }
    setTheme((t) => ({ ...t, ...patch }))
    const area = AREA_OF[section]
    if (area) setFlash({ area, n: now })
  }
  const undo = () => {
    const prev = history[history.length - 1]
    if (!prev) return
    setHistory((h) => h.slice(0, -1))
    setTheme(prev)
    lastPush.current = { key: '', at: 0 }
  }
  const reset = () => {
    const before = theme
    setHistory((h) => [...h, theme])
    setTheme({ ...DEFAULT_THEME, legal: theme.legal })
    setLogoPalettes(DEFAULT_LOGO_PALETTES)
    notify('Modèle par défaut rétabli (vos informations légales sont conservées)', 'Annuler', () => setTheme(before))
  }
  const toggle = (id: SectionId) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const goTo = (id: SectionId) => {
    setOpen((s) => new Set(s).add(id))
    if (narrow) setPane('edit')
    requestAnimationFrame(() => document.getElementById(`ap-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  /* ───── Progression ───── */
  const L = theme.legal
  const checks: { label: string; ok: boolean; section: SectionId }[] = [
    { label: 'Logo', ok: true, section: 'colors' },
    { label: 'Couleurs définies', ok: true, section: 'colors' },
    { label: 'Modèle choisi', ok: true, section: 'template' },
    { label: 'Police définie', ok: true, section: 'font' },
    { label: 'Textes par défaut', ok: !!(theme.texts.conditions && theme.texts.thanks), section: 'texts' },
    { label: 'Mentions légales', ok: !!(L.siret && L.vatNumber && L.legalForm && L.insurer && L.insuranceContract), section: 'legal' },
    { label: 'IBAN', ok: !!L.iban, section: 'legal' },
  ]
  const pct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100)
  const missingLegal = LEGAL_FIELDS.filter((f) => f.required && !L[f.key].trim())

  /* ───── Logo ───── */
  const onLogo = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { notify('Choisissez une image : PNG, JPG ou SVG'); return }
    const reader = new FileReader()
    reader.onload = async () => {
      const src = String(reader.result)
      update({ logo: src }, 'colors')
      try { setLogoPalettes(await palettesFromImage(src)) } catch { setLogoPalettes(DEFAULT_LOGO_PALETTES) }
      notify('Logo importé · 3 palettes vous sont proposées à partir de ses couleurs')
    }
    reader.readAsDataURL(file)
  }

  const onPhoto = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { notify('Choisissez une photo : JPG, PNG ou WebP'); return }
    const reader = new FileReader()
    reader.onload = () => { update({ photo: String(reader.result) }, 'template'); notify('Photo ajoutée aux modèles « Hero image » et « Artisan »') }
    reader.readAsDataURL(file)
  }
  const tplList = [...TEMPLATES].sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended))
  const tblList = [...TABLE_STYLES].sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended))
  const currentTpl = TEMPLATES.find((t) => t.id === theme.template)!

  const colorWarning = (hex: string, role: 'primary' | 'accent') =>
    role === 'primary' ? contrast(hex, '#FFFFFF') < 3 : contrast(hex, '#FFFFFF') < 1.5
  const vars = {
    '--p': theme.primary, '--a': theme.accent, '--p-on': onColor(theme.primary), '--a-soft': tint(theme.accent, 0.14),
    '--p-soft': tint(theme.primary, 0.06), '--p-line': tint(theme.primary, 0.22), fontFamily: FONTS.find((f) => f.id === theme.font)!.family,
  } as CSSProperties

  return (
    <>
      <div className="studio-head">
        <div>
          <nav className="crumbs" aria-label="Fil d’Ariane">
            <span>Catalogue</span><CaretRightIcon size={11} weight="bold" aria-hidden />
            <span>Documents</span><CaretRightIcon size={11} weight="bold" aria-hidden />
            <span aria-current="page">Apparence</span>
          </nav>
          <h1 className="studio-head__title">Apparence des documents</h1>
          <p className="studio-head__sub">Devis, factures, avoirs et bons d’intervention à vos couleurs.</p>
        </div>
        <div className="studio-head__actions">
          <button type="button" className="btn btn--secondary" onClick={onBack}><ArrowLeftIcon size={16} weight="bold" aria-hidden /> {backLabel}</button>
        </div>
      </div>

      <PaneTabs value={pane} onChange={setPane} />

      <div className="studio" data-pane={pane}>
        <div className="studio__form">
          {/* Progression */}
          <section className="ready" aria-label="Progression">
            <div className="ready__head">
              <strong>Vos documents sont prêts à {pct} %</strong>
              <span className="ready__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></span>
            </div>
            <ul className="ready__list">
              {checks.map((c) => (
                <li key={c.label} data-ok={c.ok || undefined}>
                  {c.ok ? <CheckCircleIcon size={16} weight="fill" aria-hidden /> : <WarningCircleIcon size={16} weight="fill" aria-hidden />}
                  {c.ok ? c.label : <button type="button" onClick={() => goTo(c.section)}>{c.label} à compléter</button>}
                </li>
              ))}
            </ul>
          </section>

          {/* 1. Logo et couleurs */}
          <Step id="ap-colors" n={1} title="Logo et couleurs" open={open.has('colors')} onToggle={() => toggle('colors')} status="done"
            summary={<span className="sum-swatches"><i style={{ background: theme.primary }} /><i style={{ background: theme.accent }} /></span>}>
            <div className="logo-row">
              <div className="logo-box">
                {theme.logo ? <img src={theme.logo} alt="Votre logo" /> : <AtelierLogo height={40} />}
                <div><strong>Atelier Martin</strong><small>Plomberie · Chauffage</small></div>
              </div>
              <div className="logo-actions">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => fileRef.current?.click()}>
                  <UploadSimpleIcon size={15} aria-hidden /> {theme.logo ? 'Changer le logo' : 'Importer un logo'}
                </button>
                {theme.logo && (
                  <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => { update({ logo: null }, 'colors'); setLogoPalettes(DEFAULT_LOGO_PALETTES) }}>
                    <TrashIcon size={15} aria-hidden /> Retirer
                  </button>
                )}
                <input ref={fileRef} id="ap-logo-file" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = '' }} />
              </div>
            </div>
            <p className="hint"><ImageSquareIcon size={14} aria-hidden /> PNG, JPG ou SVG. Un logo sur fond transparent rend mieux sur les modèles colorés.</p>

            <div className="block">
              <span className="sub-title">Palettes proposées à partir de votre logo</span>
              <div className="logo-pals">
                {logoPalettes.map((p, i) => {
                  const on = theme.primary === p[0] && theme.accent === p[1]
                  return (
                    <button key={i} type="button" className="logo-pal" aria-pressed={on} aria-label={`Palette ${i + 1}`}
                      onClick={() => update({ primary: p[0], accent: p[1] }, 'colors')}>
                      {p.map((c) => <i key={c} style={{ background: c }} />)}
                      {on && <CheckIcon size={12} weight="bold" className="logo-pal__check" aria-hidden />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="block">
              <span className="sub-title">Palettes prêtes à l’emploi</span>
              <div className="presets">
                {PRESET_PALETTES.map((p) => {
                  const on = theme.primary === p.primary && theme.accent === p.accent
                  return (
                    <button key={p.id} type="button" className="preset" aria-pressed={on} onClick={() => update({ primary: p.primary, accent: p.accent }, 'colors')}>
                      <span className="preset__name">{p.label}</span>
                      <span className="preset__sim" aria-hidden>
                        <span className="preset__head" style={{ background: p.primary }} />
                        {[0, 1, 2].map((r) => (
                          <span key={r} className="preset__row"><i style={{ background: p.accent }} /><b /><b /></span>
                        ))}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="block">
              <span className="sub-title">Personnaliser vos couleurs</span>
              <div className="custom-colors">
                <div className="custom-colors__fields">
                  {(['primary', 'accent'] as const).map((role) => (
                    <ColorField
                      key={role}
                      label={role === 'primary' ? 'Couleur principale' : 'Couleur d’accent'}
                      hint={role === 'primary' ? 'Titres, totaux, en-têtes' : 'Détails et bandeaux'}
                      value={theme[role]}
                      active={target === role}
                      warn={colorWarning(theme[role], role)}
                      onSelect={() => setTarget(role)}
                      onChange={(hex) => update({ [role]: hex } as Partial<DocTheme>, 'colors', `color:${role}`)}
                    />
                  ))}
                </div>
                <ColorWheel
                  label={target === 'primary' ? 'Couleur principale' : 'Couleur d’accent'}
                  value={theme[target]}
                  onChange={(hex) => update({ [target]: hex } as Partial<DocTheme>, 'colors', `color:${target}`)}
                />
              </div>
              {(colorWarning(theme.primary, 'primary') || colorWarning(theme.accent, 'accent')) && (
                <p className="warn"><WarningCircleIcon size={16} weight="fill" aria-hidden /> Cette couleur rend certains textes difficiles à lire. Choisissez une teinte plus foncée.</p>
              )}
            </div>
          </Step>

          {/* 2. Modèle */}
          <Step id="ap-template" n={2} title="Modèle de mise en page" open={open.has('template')} onToggle={() => toggle('template')}
            summary={TEMPLATES.find((t) => t.id === theme.template)!.label}>
            <p className="hint">Les modèles conseillés conviennent à la plupart des artisans. Vos couleurs, votre logo et votre police s’appliquent à tous.</p>
            <div className="tpl-grid">
              {tplList.map((t) => (
                <button key={t.id} type="button" className="tpl" aria-pressed={theme.template === t.id} onClick={() => update({ template: t.id }, 'template')}>
                  {t.recommended && <span className="tag-reco">Conseillé</span>}
                  <span className="tpl__thumb">
                    <DocumentPreview theme={{ ...theme, template: t.id }} kind="devis" quote={quote} client={client} scale={0.142} thumbnail />
                  </span>
                  <span className="tpl__label">{t.label}</span>
                  <span className="tpl__hint">{t.hint}</span>
                </button>
              ))}
            </div>
            {currentTpl.photo && (
              <div className="photo-row">
                <div className="photo-row__preview" aria-hidden>
                  {theme.photo ? <img src={theme.photo} alt="" /> : <ImageSquareIcon size={22} />}
                </div>
                <div className="photo-row__text">
                  <strong>Photo de réalisation <small>(facultatif)</small></strong>
                  <span>Une photo d’un de vos chantiers. Sans photo, un motif à vos couleurs la remplace.</span>
                </div>
                <div className="logo-actions">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => photoRef.current?.click()}>
                    <UploadSimpleIcon size={15} aria-hidden /> {theme.photo ? 'Changer' : 'Importer une photo'}
                  </button>
                  {theme.photo && (
                    <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => update({ photo: null }, 'template')}>
                      <TrashIcon size={15} aria-hidden /> Retirer
                    </button>
                  )}
                  <input ref={photoRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { onPhoto(e.target.files?.[0]); e.target.value = '' }} />
                </div>
              </div>
            )}
          </Step>

          {/* 3. Tableaux */}
          <Step id="ap-table" n={3} title="Style de vos tableaux" open={open.has('table')} onToggle={() => toggle('table')}
            summary={TABLE_STYLES.find((t) => t.id === theme.table)!.label}>
            <p className="hint">Indépendant du modèle : combinez librement. Aperçu avec vos premières lignes.</p>
            <div className="tbl-grid">
              {tblList.map((t) => (
                <button key={t.id} type="button" className="tbl" aria-pressed={theme.table === t.id} onClick={() => update({ table: t.id }, 'table')}>
                  {t.recommended && <span className="tag-reco">Conseillé</span>}
                  <TableThumb id={t.id} vars={vars} lines={quote.lines} />
                  <span className="tbl__label">{t.label}</span>
                  <span className="tbl__hint">{t.hint}</span>
                </button>
              ))}
            </div>
          </Step>

          {/* 4. Police */}
          <Step id="ap-font" n={4} title="Police" open={open.has('font')} onToggle={() => toggle('font')}
            summary={FONTS.find((f) => f.id === theme.font)!.label}>
            <div className="fonts" role="radiogroup" aria-label="Police du document">
              {FONTS.map((f) => (
                <button key={f.id} type="button" role="radio" aria-checked={theme.font === f.id} className="font-tile" onClick={() => update({ font: f.id }, 'font')}>
                  <span className="font-tile__sample" style={{ fontFamily: f.family }}><b>Aa</b><span>Devis n°42</span></span>
                  <span className="font-tile__label">{f.label}</span>
                </button>
              ))}
            </div>
          </Step>

          {/* 5. En-tête et pied */}
          <Step id="ap-header" n={5} title="En-tête et pied de page" open={open.has('header')} onToggle={() => toggle('header')}
            summary={`Logo ${theme.logoSize === 'S' ? 'petit' : theme.logoSize === 'M' ? 'moyen' : 'grand'} · ${theme.logoAlign === 'left' ? 'à gauche' : 'centré'}`}>
            <div className="fgrid">
              <div className="field">
                <span className="field__label">Taille du logo</span>
                <Segmented label="Taille du logo" value={theme.logoSize} onChange={(v) => update({ logoSize: v }, 'header')}
                  options={[{ id: 'S', label: 'Petit' }, { id: 'M', label: 'Moyen' }, { id: 'L', label: 'Grand' }]} />
              </div>
              <div className="field">
                <span className="field__label">Position</span>
                <Segmented label="Position du logo" value={theme.logoAlign} onChange={(v) => update({ logoAlign: v }, 'header')}
                  options={[
                    { id: 'left', label: <><TextAlignLeftIcon size={14} aria-hidden /> Gauche</> },
                    { id: 'center', label: <><TextAlignCenterIcon size={14} aria-hidden /> Centre</> },
                  ]} />
              </div>
            </div>
            <Switch label="Afficher les coordonnées de l’entreprise" hint="Adresse, téléphone et e-mail sous le logo" checked={theme.showContact}
              onChange={(v) => update({ showContact: v }, 'header')} />
            <div className="field">
              <label className="field__label" htmlFor="ap-footer">Texte du pied de page</label>
              <textarea id="ap-footer" className="textarea" rows={2} value={theme.footer} onChange={(e) => update({ footer: e.target.value }, 'legal', 'footer-text')} />
            </div>
            <Switch label="Mentions légales en bas de page" hint="SIRET, TVA, assurance… (voir section 6)" checked={theme.footerLegal}
              onChange={(v) => update({ footerLegal: v }, 'legal')} />
          </Step>

          {/* 6. Informations légales */}
          <Step id="ap-legal" n={6} title="Informations légales" open={open.has('legal')} onToggle={() => toggle('legal')}
            status={missingLegal.length ? 'warn' : 'done'}
            summary={missingLegal.length ? <span className="sum-warn">{missingLegal.length} à compléter</span> : 'Complètes'}>
            <p className="note"><InfoIcon size={16} aria-hidden /> Ces informations apparaissent en bas de vos documents. En cas de doute sur les mentions obligatoires pour votre activité, votre expert-comptable peut vous les confirmer.</p>
            <div className="fgrid">
              {LEGAL_FIELDS.map((f) => {
                const missing = f.required && !L[f.key].trim()
                return (
                  <div key={f.key} className={`field${f.wide ? ' field--wide' : ''}`} data-missing={missing || undefined}>
                    <label className="field__label" htmlFor={`lg-${f.key}`}>
                      {f.label}{missing && <span className="tag-missing">À compléter</span>}
                    </label>
                    <input id={`lg-${f.key}`} className="input" placeholder={f.placeholder} value={L[f.key]}
                      onChange={(e) => update({ legal: { ...L, [f.key]: e.target.value } }, 'legal', `legal:${f.key}`)} />
                    {f.help && <span className="field__aside">{f.help}</span>}
                  </div>
                )
              })}
            </div>
          </Step>

          {/* 7. Textes par défaut */}
          <Step id="ap-texts" n={7} title="Textes par défaut" open={open.has('texts')} onToggle={() => toggle('texts')} summary="Conditions, remerciement…">
            {([
              ['conditions', 'Conditions générales', 3],
              ['validity', 'Validité du devis', 2],
              ['penalties', 'Pénalités de retard (factures)', 2],
              ['indemnity', 'Indemnité forfaitaire de recouvrement (clients professionnels)', 2],
              ['thanks', 'Message de remerciement', 1],
            ] as const).map(([k, label, rows]) => (
              <div key={k} className="field">
                <label className="field__label" htmlFor={`tx-${k}`}>{label}</label>
                {rows === 1
                  ? <input id={`tx-${k}`} className="input" value={theme.texts[k]} onChange={(e) => update({ texts: { ...theme.texts, [k]: e.target.value } }, 'texts', `texts:${k}`)} />
                  : <textarea id={`tx-${k}`} className="textarea" rows={rows} value={theme.texts[k]} onChange={(e) => update({ texts: { ...theme.texts, [k]: e.target.value } }, 'texts', `texts:${k}`)} />}
              </div>
            ))}
          </Step>

          {/* 8. Options */}
          <Step id="ap-options" n={8} title="Options d’affichage" open={open.has('options')} onToggle={() => toggle('options')}
            summary={`${Object.values(theme.options).filter(Boolean).length} activées`}>
            <div>
              {([
                ['showRefs', 'Afficher les références', 'Colonne « Réf. » dans le tableau', 'table'],
                ['showUnits', 'Afficher les unités', 'heure, forfait, m²…', 'table'],
                ['groupSections', 'Regrouper par section', 'Titres « Salle de bain », « Cuisine »…', 'table'],
                ['showSignature', 'Zone « Bon pour accord »', 'Pour la signature du client sur les devis', 'conditions'],
                ['showQr', 'QR code de paiement', 'Le client paie en scannant le code avec son téléphone', 'conditions'],
              ] as const).map(([k, label, hint]) => (
                <Switch key={k} label={label} hint={hint} checked={theme.options[k]}
                  onChange={(v) => update({ options: { ...theme.options, [k]: v } }, k === 'showSignature' || k === 'showQr' ? 'texts' : 'options')} />
              ))}
            </div>
          </Step>
        </div>

        <div className="studio__preview">
          <div className="preview-bar">
            <div className="doc-tabs" role="tablist" aria-label="Type de document">
              {KINDS.map((k) => (
                <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</button>
              ))}
            </div>
            <span className="preview-bar__spacer" />
            <ZoomControls zoom={zoom} scale={scale} onZoom={setZoom} />
          </div>
          <div className="preview-scroll" ref={previewRef}>
            <DocumentPreview theme={theme} kind={kind} quote={quote} client={client} scale={scale} flash={flash} />
          </div>
        </div>
      </div>

      <div className="studio-bar">
        <span className="autosave" data-dirty={dirty || undefined}>
          <span className="autosave__dot" aria-hidden />
          {dirty ? 'Modifications non appliquées' : 'Apparence appliquée à vos documents'}
        </span>
        <div className="studio-bar__actions">
          <button type="button" className="btn btn--secondary" onClick={undo} disabled={!history.length}>
            <ArrowUUpLeftIcon size={17} aria-hidden /> Annuler la dernière modification
          </button>
          <button type="button" className="btn btn--secondary" onClick={reset}>
            <ArrowCounterClockwiseIcon size={17} aria-hidden /> Revenir au modèle par défaut
          </button>
          <button type="button" className="btn btn--teal-solid" disabled={!dirty}
            onClick={() => { onApply(theme); notify('Apparence appliquée à vos devis, factures, avoirs et bons d’intervention') }}>
            <CheckIcon size={17} weight="bold" aria-hidden /> Appliquer à tous mes documents
          </button>
        </div>
      </div>
    </>
  )
}

/* Champ couleur : pastille + valeur saisissable */
function ColorField({ label, hint, value, active, warn, onSelect, onChange }: {
  label: string; hint: string; value: string; active: boolean; warn: boolean; onSelect: () => void; onChange: (hex: string) => void
}) {
  const [text, setText] = useState(value)
  const [focused, setFocused] = useState(false)
  const shown = focused ? text : value
  return (
    <div className="cfield" data-active={active || undefined} data-warn={warn || undefined}>
      <button type="button" className="cfield__swatch" style={{ background: value }} onClick={onSelect} aria-label={`Modifier la ${label.toLowerCase()} avec la roue`} aria-pressed={active} />
      <div className="cfield__body">
        <span className="cfield__label">{label}</span>
        <span className="cfield__hint">{hint}</span>
        <input
          className="input cfield__input"
          value={shown}
          aria-label={`${label}, code couleur`}
          spellCheck={false}
          onFocus={() => { setFocused(true); setText(value); onSelect() }}
          onBlur={() => setFocused(false)}
          onChange={(e) => { setText(e.target.value); const h = normalizeHex(e.target.value); if (h) onChange(h) }}
        />
      </div>
    </div>
  )
}

/* Miniature d'un style de tableau : le vrai tableau du document, réduit à la largeur de la tuile */
const THUMB_W = 440
function TableThumb({ id, vars, lines }: { id: TableStyleId; vars: CSSProperties; lines: QuoteLine[] }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [zoom, setZoom] = useState(0.34)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setZoom(Math.max(0.2, (el.clientWidth - 12) / THUMB_W)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const sample = lines.slice(0, 6)
  return (
    <span ref={ref} className="tthumb" style={vars} aria-hidden>
      <span className="tthumb__inner" style={{ width: THUMB_W, zoom }}>
        <DocTable style={id} lines={sample} options={{ showRefs: false, showUnits: false, groupSections: true }} />
      </span>
    </span>
  )
}
