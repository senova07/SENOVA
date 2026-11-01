import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  CalendarBlankIcon, ClockIcon, EnvelopeSimpleIcon, MapPinIcon, MedalIcon, PhoneIcon, ShieldCheckIcon, UserIcon,
} from '@phosphor-icons/react'
import {
  COMPANY, addDays, computeTotals, formatDate, lineId,
  type Client, type Company, type Quote, type QuoteLine,
} from '../../data/quote'
import { formatPrice } from '../../lib/format'
import { DocTable, vatLabel } from './DocTable'
import { FONTS, LOGO_HEIGHT, onColor, tint, type DocKind, type DocTheme } from './theme'
import './doc.css'

export const A4_W = 794
export const A4_H = 1123

export type DocArea = 'header' | 'parties' | 'table' | 'totals' | 'conditions' | 'footer'

interface Props {
  theme: DocTheme
  kind: DocKind
  quote: Quote
  client: Client | null
  company?: Company
  scale: number
  /** Zone brièvement mise en évidence après une modification */
  flash?: { area: DocArea; n: number } | null
  /** Clic sur une zone de l'aperçu (ex. : aller au champ correspondant) */
  onJump?: (area: DocArea) => void
  onPages?: (pages: number) => void
  /** Miniature : hauteur limitée à une page, sans interaction */
  thumbnail?: boolean
}

/** Logo par défaut de l'entreprise d'exemple : une goutte et une flamme (plomberie · chauffage). */
export function AtelierLogo({ height }: { height: number }) {
  return (
    <svg viewBox="0 0 48 52" height={height} width={(height * 48) / 52} aria-label="Logo Atelier Martin" role="img">
      <path d="M24 2c7 10 18 20 18 31a18 18 0 0 1-36 0C6 22 17 12 24 2Z" fill="#0B2A50" />
      <path d="M27 18c4 6 9 10 9 16a10 10 0 0 1-15 8.7c4.5-1.6 7.3-5.4 6-10.5C26.2 28.6 25 25 27 18Z" fill="#16B8B0" />
      <path d="M15 33a9 9 0 0 0 6 8.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".85" />
    </svg>
  )
}

function Logo({ theme, scale = 1 }: { theme: DocTheme; scale?: number }) {
  const h = Math.round(LOGO_HEIGHT[theme.logoSize] * scale)
  return theme.logo
    ? <img src={theme.logo} alt="Logo de l’entreprise" style={{ height: h, width: 'auto', maxWidth: h * 3.2, objectFit: 'contain', display: 'block' }} />
    : <AtelierLogo height={h} />
}

/** QR code illustratif (motif déterministe), pour visualiser l'emplacement. */
function FakeQr({ size = 74, color }: { size?: number; color: string }) {
  const cells = useMemo(() => {
    const out: [number, number][] = []
    let seed = 7
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
      if (finder) continue
      seed = (seed * 9301 + 49297) % 233280
      if (seed / 233280 > 0.52) out.push([x, y])
    }
    return out
  }, [])
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill={color} />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill={color} />
    </g>
  )
  return (
    <svg viewBox="-1 -1 23 23" width={size} height={size} aria-hidden>
      <rect x="-1" y="-1" width="23" height="23" fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x}:${y}`} x={x} y={y} width="1" height="1" fill={color} />)}
      {finder(0, 0)}{finder(14, 0)}{finder(0, 14)}
    </svg>
  )
}

const money = (n: number, negative = false) => formatPrice(negative ? -n : n)

/* Contenu propre à chaque type de document */
function docMeta(kind: DocKind, quote: Quote) {
  if (kind === 'facture') return {
    title: 'Facture', number: 'FAC-2026-0118',
    rows: [['Date', formatDate(quote.date)], ['Échéance', formatDate(addDays(quote.date, 30))], ['Devis', quote.number]],
  }
  if (kind === 'avoir') return {
    title: 'Avoir', number: 'AV-2026-0007',
    rows: [['Date', formatDate(quote.date)], ['Sur facture', 'FAC-2026-0118']],
  }
  return {
    title: 'Devis', number: quote.number,
    rows: [['Date', formatDate(quote.date)], ['Valable jusqu’au', formatDate(addDays(quote.date, quote.validityDays))]],
  }
}

/**
 * Emplacement photo (modèles « Hero image » et « Artisan »).
 * Sans photo importée, un motif à facettes aux couleurs du document le remplace : aucune image générée.
 */
function PhotoSlot({ theme, className }: { theme: DocTheme; className: string }) {
  if (theme.photo) return <div className={className}><img src={theme.photo} alt="Réalisation de l’entreprise" /></div>
  const p = theme.primary, a = theme.accent
  return (
    <div className={className}>
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="400" height="260" fill={tint(p, 0.1)} />
        <polygon points="0,260 150,90 260,260" fill={tint(p, 0.2)} />
        <polygon points="120,0 400,0 400,150 250,210" fill={tint(p, 0.32)} />
        <polygon points="250,210 400,150 400,260 300,260" fill={tint(a, 0.55)} />
        <polygon points="150,90 250,210 260,260" fill={tint(a, 0.3)} />
        <polygon points="0,0 120,0 150,90 0,170" fill={tint(p, 0.14)} />
        <polygon points="330,0 400,0 400,70" fill={a} />
        <polygon points="300,260 400,150 400,185 335,260" fill={p} />
      </svg>
    </div>
  )
}

const AVOIR_LINES: QuoteLine[] = [
  { id: lineId(), kind: 'item', label: 'Retour mitigeur thermostatique Grohe (non posé)', reference: 'PR-014', qty: 1, unit: 'pièce', price: 189, vat: 20, discount: 0 },
  { id: lineId(), kind: 'text', label: 'Article retourné en état neuf le 22/10/2026.', qty: 0, unit: '', price: 0, vat: 0, discount: 0 },
]

export function DocumentPreview({ theme, kind, quote, client, company = COMPANY, scale, flash, onJump, onPages, thumbnail }: Props) {
  const pageRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(A4_H)

  useLayoutEffect(() => {
    if (thumbnail || !pageRef.current) return
    const el = pageRef.current
    const ro = new ResizeObserver(() => {
      const h = Math.max(A4_H, Math.ceil(el.scrollHeight / A4_H) * A4_H)
      setHeight(h)
      onPages?.(Math.round(h / A4_H))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [thumbnail, onPages])

  const tpl = theme.template
  const lines = kind === 'avoir' ? AVOIR_LINES : quote.lines
  const totals = computeTotals(lines, kind === 'devis' || kind === 'facture' ? quote.depositPct : 0)
  const meta = docMeta(kind, quote)
  const negative = kind === 'avoir'
  const font = FONTS.find((f) => f.id === theme.font)!.family
  const { legal, options, texts } = theme
  const clientLabel = kind === 'devis' ? 'Client' : 'Facturé à'
  const clientName = client ? [client.civility, client.name].filter(Boolean).join(' ') : null
  const site = quote.siteDifferent ? quote.site : client ? { address: client.address, zip: client.zip, city: client.city } : null

  const style = {
    '--p': theme.primary,
    '--p-on': onColor(theme.primary),
    '--a': theme.accent,
    '--a-on': onColor(theme.accent),
    '--a-soft': tint(theme.accent, 0.14),
    '--a-line': tint(theme.accent, 0.4),
    '--p-soft': tint(theme.primary, 0.06),
    '--p-tint': tint(theme.primary, 0.12),
    '--p-line': tint(theme.primary, 0.22),
    fontFamily: font,
  } as CSSProperties

  const area = (key: DocArea, children: ReactNode, className = '') => (
    <div
      className={`doc-area ${className}`}
      data-area={key}
      data-jump={onJump ? true : undefined}
      onClick={onJump ? () => onJump(key) : undefined}
      title={onJump ? 'Modifier cette partie' : undefined}
    >
      {children}
      {flash?.area === key && <span key={flash.n} className="doc-flash" aria-hidden />}
    </div>
  )

  /* ───── Blocs réutilisés par les modèles ───── */

  const contact = theme.showContact && (
    <div className="doc-company__contact">
      {company.address}, {company.zip} {company.city}<br />{company.phone} · {company.email}
    </div>
  )

  const companyBlock = (
    <div className="doc-company">
      <Logo theme={theme} />
      <div className="doc-company__text">
        <div className="doc-company__name">{company.name}</div>
        <div className="doc-company__activity">{company.activity}</div>
        {contact}
      </div>
    </div>
  )

  const titleBlock = (
    <div className="doc-title">
      <div className="doc-title__label">{meta.title}</div>
      <div className="doc-title__number">N° {meta.number}</div>
      <dl className="doc-title__meta">
        {meta.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
    </div>
  )

  const clientBody = client
    ? <div className="doc-party__body"><strong>{clientName}</strong><br />{client.address}<br />{client.zip} {client.city}</div>
    : <div className="doc-party__empty">Aucun client sélectionné</div>
  const siteBody = site
    ? <div className="doc-party__body">{site.address || '—'}<br />{site.zip} {site.city}{!quote.siteDifferent && <span className="doc-party__note">Même adresse que le client</span>}</div>
    : <div className="doc-party__body doc-muted">—</div>

  const parties = (
    <div className="doc-parties">
      <div className="doc-party"><div className="doc-label">{clientLabel}</div>{clientBody}</div>
      {quote.siteDifferent && <div className="doc-party"><div className="doc-label">Adresse du chantier</div>{siteBody}</div>}
    </div>
  )

  const object = kind !== 'avoir' && quote.object
    ? <p className="doc-object"><span>Objet :</span> {quote.object}</p>
    : null

  const table = area('table', <DocTable style={theme.table} lines={lines} options={options} negative={negative} />)

  const totalsBlock = area('totals', (
    <div className="doc-totals">
      <dl>
        <div><dt>Total HT</dt><dd>{money(totals.ht, negative)}</dd></div>
        {theme.table !== 'sans-tva' || totals.vat.length > 1
          ? totals.vat.map((v) => <div key={v.rate}><dt>TVA {vatLabel(v.rate)}</dt><dd>{money(v.amount, negative)}</dd></div>)
          : <div><dt>TVA {totals.vat[0] ? vatLabel(totals.vat[0].rate) : ''}</dt><dd>{money(totals.vatTotal, negative)}</dd></div>}
        <div className="doc-totals__ttc"><dt>{negative ? 'Avoir TTC' : 'Total TTC'}</dt><dd>{money(totals.ttc, negative)}</dd></div>
      </dl>
      {kind === 'devis' && quote.depositPct > 0 && (
        <div className="doc-deposit"><span>Acompte à la commande ({quote.depositPct} %)</span><strong>{money(totals.deposit)}</strong></div>
      )}
      {kind === 'facture' && quote.depositPct > 0 && (
        <>
          <div className="doc-totals__row"><span>Acompte déjà versé</span><span>{money(totals.deposit, true)}</span></div>
          <div className="doc-deposit"><span>Reste à payer</span><strong>{money(totals.ttc - totals.deposit)}</strong></div>
        </>
      )}
    </div>
  ))

  const conditions = area('conditions', (
    <div className="doc-conditions">
      <div className="doc-conditions__cols">
        {kind !== 'avoir' && (
          <div>
            <div className="doc-label">Conditions de paiement</div>
            <p>{quote.paymentTerms}{kind === 'devis' && quote.depositPct > 0 ? ` (acompte de ${quote.depositPct} %).` : '.'}</p>
          </div>
        )}
        <div>
          <div className="doc-label">{kind === 'avoir' ? 'Remboursement' : 'Moyens de paiement'}</div>
          <p>{kind === 'avoir' ? 'Montant déduit de votre prochaine facture ou remboursé par virement.' : quote.paymentMethods.join(', ') || '—'}</p>
          {kind !== 'devis' && legal.iban && <p className="doc-bank">IBAN {legal.iban}{legal.bic ? ` · BIC ${legal.bic}` : ''}</p>}
        </div>
        {options.showQr && kind !== 'avoir' && (
          <div className="doc-qr">
            <FakeQr color={theme.primary} size={64} />
            <span>Payer par virement<br />en scannant ce code</span>
          </div>
        )}
      </div>
      {quote.notes && kind === 'devis' && <p className="doc-notes">{quote.notes}</p>}
      {kind === 'devis' && (texts.validity || texts.conditions) && <p className="doc-small">{[texts.validity, texts.conditions].filter(Boolean).join(' ')}</p>}
      {kind === 'facture' && <p className="doc-small">{[texts.penalties, texts.indemnity].filter(Boolean).join(' ')}</p>}
      <div className="doc-closing">
        {texts.thanks && <p className="doc-thanks">{texts.thanks}</p>}
        {options.showSignature && kind === 'devis' && (
          <div className="doc-sign">
            <div className="doc-label">Bon pour accord</div>
            <p>Date et signature du client, précédées de la mention « Bon pour accord »</p>
          </div>
        )}
      </div>
    </div>
  ))

  const reassurance = tpl === 'artisan' && (
    <div className="doc-assure">
      <div className="doc-assure__title">Pourquoi nous choisir ?</div>
      <div className="doc-assure__item"><MedalIcon size={20} weight="duotone" aria-hidden /><span><strong>Qualité</strong>Matériaux et finitions soignés</span></div>
      <div className="doc-assure__item"><ClockIcon size={20} weight="duotone" aria-hidden /><span><strong>Respect des délais</strong>Planning tenu et suivi</span></div>
      <div className="doc-assure__item"><ShieldCheckIcon size={20} weight="duotone" aria-hidden /><span><strong>Garantie décennale</strong>{legal.insurer ? `Assurée par ${legal.insurer}` : 'Travaux assurés'}</span></div>
    </div>
  )

  const footer = area('footer', (
    <footer className="doc-footer">
      {theme.footer && <p>{theme.footer}</p>}
      {theme.footerLegal && (
        <p className="doc-footer__legal">
          {[
            company.name,
            [legal.legalForm, legal.capital && `au capital de ${legal.capital}`].filter(Boolean).join(' '),
            legal.siret && `SIRET ${legal.siret}`,
            legal.registry,
            legal.vatNumber && `TVA ${legal.vatNumber}`,
            legal.insurer && `Assurance décennale ${legal.insurer}${legal.insuranceContract ? ` n° ${legal.insuranceContract}` : ''}${legal.insuranceZone ? `, ${legal.insuranceZone}` : ''}`,
          ].filter(Boolean).join(' · ')}
        </p>
      )}
    </footer>
  ), 'doc-area--footer')

  const body = <>{table}{totalsBlock}{conditions}{reassurance}{footer}</>

  /* ───── Mise en page propre à chaque modèle ───── */
  let page: ReactNode
  switch (tpl) {
    case 'colonne':
      page = (
        <>
          <aside className="doc-side">
            {area('header', (
              <div className="doc-side__brand">
                <div className="doc-plate"><Logo theme={theme} scale={0.9} /></div>
                <div className="doc-company__name">{company.name}</div>
                <div className="doc-company__activity">{company.activity}</div>
              </div>
            ))}
            {theme.showContact && (
              <ul className="doc-side__list">
                <li><MapPinIcon size={13} aria-hidden /><span>{company.address}<br />{company.zip} {company.city}</span></li>
                <li><PhoneIcon size={13} aria-hidden /><span>{company.phone}</span></li>
                <li><EnvelopeSimpleIcon size={13} aria-hidden /><span>{company.email}</span></li>
              </ul>
            )}
            {area('parties', (
              <div className="doc-side__blocks">
                <div><div className="doc-side__label">{clientLabel}</div>{clientBody}</div>
                <div><div className="doc-side__label">Chantier</div>{siteBody}</div>
                <div>
                  <div className="doc-side__label">Dates</div>
                  {meta.rows.map(([k, v]) => <div key={k} className="doc-side__kv"><span>{k}</span><strong>{v}</strong></div>)}
                </div>
              </div>
            ))}
          </aside>
          <div className="doc-main">
            <div className="doc-main__title">
              <div className="doc-title__label">{meta.title}</div>
              <div className="doc-title__number">N° {meta.number}</div>
            </div>
            {object}
            {body}
          </div>
        </>
      )
      break

    case 'hero':
      page = (
        <>
          {area('header', (
            <div className="doc-hero">
              <PhotoSlot theme={theme} className="doc-hero__photo" />
              <div className="doc-hero__bar">
                <div className="doc-plate"><Logo theme={theme} /></div>
                <div className="doc-hero__company">
                  <div className="doc-company__name">{company.name}</div>
                  <div className="doc-company__activity">{company.activity}</div>
                  {contact}
                </div>
                {titleBlock}
              </div>
            </div>
          ), 'doc-area--bleed')}
          {area('parties', <>{parties}{object}</>)}
          {body}
        </>
      )
      break

    case 'plan':
      page = (
        <>
          <span className="doc-grid" aria-hidden />
          {area('header', (
            <div className="doc-header">
              {companyBlock}
              <div className="doc-cartouche">
                <div className="doc-cartouche__title">{meta.title}</div>
                <div className="doc-cartouche__cell"><span>N°</span><strong>{meta.number}</strong></div>
                {meta.rows.map(([k, v]) => <div key={k} className="doc-cartouche__cell"><span>{k}</span><strong>{v}</strong></div>)}
              </div>
            </div>
          ))}
          {area('parties', (
            <>
              <div className="doc-parties doc-parties--plan">
                <div className="doc-party"><div className="doc-label">{clientLabel}</div>{clientBody}</div>
                <div className="doc-party"><div className="doc-label">Chantier</div>{siteBody}</div>
                {kind !== 'avoir' && quote.object && <div className="doc-party"><div className="doc-label">Objet des travaux</div><div className="doc-party__body">{quote.object}</div></div>}
              </div>
            </>
          ))}
          {body}
        </>
      )
      break

    case 'bandeau':
      page = (
        <>
          {area('header', (
            <div className="doc-band">
              <div className="doc-plate"><Logo theme={theme} /></div>
              <div className="doc-band__company">
                <div className="doc-company__name">{company.name}</div>
                <div className="doc-company__activity">{company.activity}</div>
              </div>
              {titleBlock}
            </div>
          ), 'doc-area--bleed')}
          {theme.showContact && <div className="doc-band__contact">{company.address}, {company.zip} {company.city} · {company.phone} · {company.email}</div>}
          {area('parties', <>{parties}{object}</>)}
          {body}
        </>
      )
      break

    case 'bloc-client':
      page = (
        <>
          {area('header', <div className="doc-header">{companyBlock}{titleBlock}</div>)}
          {area('parties', (
            <div className="doc-cards">
              <div className="doc-cards__item">
                <UserIcon size={18} weight="duotone" aria-hidden />
                <div><div className="doc-label">{clientLabel}</div>{clientBody}</div>
              </div>
              <div className="doc-cards__item">
                <MapPinIcon size={18} weight="duotone" aria-hidden />
                <div><div className="doc-label">Adresse du chantier</div>{siteBody}</div>
              </div>
              <div className="doc-cards__item">
                <CalendarBlankIcon size={18} weight="duotone" aria-hidden />
                <div>
                  <div className="doc-label">{kind === 'avoir' ? 'Avoir' : 'Travaux'}</div>
                  <div className="doc-party__body">
                    {kind !== 'avoir' && quote.object ? <strong>{quote.object}</strong> : <strong>{meta.title} {meta.number}</strong>}
                    {meta.rows.map(([k, v]) => <div key={k}>{k} : {v}</div>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {body}
        </>
      )
      break

    case 'artisan':
      page = (
        <>
          {area('header', (
            <div className="doc-artisan">
              <div className="doc-artisan__left">
                {companyBlock}
                {titleBlock}
              </div>
              <PhotoSlot theme={theme} className="doc-artisan__photo" />
            </div>
          ), 'doc-area--bleed')}
          {area('parties', <>{parties}{object}</>)}
          {body}
        </>
      )
      break

    default: // classique-pro, epure
      page = (
        <>
          {tpl === 'classique-pro' && <span className="doc-corner" aria-hidden />}
          {area('header', <div className="doc-header">{companyBlock}{titleBlock}</div>)}
          {area('parties', <>{parties}{object}</>)}
          {body}
        </>
      )
  }

  return (
    <div className="doc-frame" style={{ width: A4_W * scale, height: (thumbnail ? A4_H : height) * scale }}>
      <div
        ref={pageRef}
        className={`doc doc--${tpl}`}
        data-logo={theme.logoAlign}
        data-thumb={thumbnail || undefined}
        style={{ ...style, transform: `scale(${scale})`, minHeight: A4_H, height: thumbnail ? A4_H : undefined }}
      >
        {page}
      </div>
      {/* Repères de saut de page, hors de la page mesurée */}
      {!thumbnail && Array.from({ length: Math.round(height / A4_H) - 1 }, (_, i) => (
        <div key={i} className="doc-pagebreak" style={{ top: (i + 1) * A4_H * scale }} aria-hidden><span>Page {i + 2}</span></div>
      ))}
    </div>
  )
}
