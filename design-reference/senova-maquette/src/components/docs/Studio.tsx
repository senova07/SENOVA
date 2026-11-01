import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowsHorizontalIcon, CaretDownIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@phosphor-icons/react'
import { A4_W } from './DocumentPreview'
import './studio.css'

/* ───── Section numérotée repliable ───── */
interface StepProps {
  id: string
  n: number
  title: string
  open: boolean
  onToggle: () => void
  /** Résumé affiché quand la section est fermée */
  summary?: ReactNode
  status?: 'done' | 'warn'
  children: ReactNode
}

export function Step({ id, n, title, open, onToggle, summary, status, children }: StepProps) {
  return (
    <section className="step" id={id} data-open={open || undefined}>
      <button type="button" className="step__head" aria-expanded={open} aria-controls={`${id}-body`} onClick={onToggle}>
        <span className="step__n" data-status={status}>{n}</span>
        <span className="step__title">{title}</span>
        {!open && summary && <span className="step__summary">{summary}</span>}
        <CaretDownIcon size={16} weight="bold" className="step__caret" aria-hidden />
      </button>
      {open && <div className="step__body" id={`${id}-body`}>{children}</div>}
    </section>
  )
}

/* ───── Zoom de l'aperçu ───── */
export type ZoomMode = 'fit' | number

/** Calcule l'échelle de l'aperçu : « ajuster à la largeur » ou un pourcentage fixe. */
export function usePreviewScale(zoom: ZoomMode) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(700)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const fit = Math.max(0.3, Math.min(1.1, (width - 48) / A4_W))
  return { ref, scale: zoom === 'fit' ? fit : zoom, fit }
}

export function ZoomControls({ zoom, scale, onZoom }: { zoom: ZoomMode; scale: number; onZoom: (z: ZoomMode) => void }) {
  const steps = [0.5, 0.65, 0.8, 1, 1.25]
  const pct = Math.round(scale * 100)
  const dec = () => onZoom(steps.filter((s) => s < scale - 0.01).pop() ?? steps[0])
  const inc = () => onZoom(steps.find((s) => s > scale + 0.01) ?? steps[steps.length - 1])
  return (
    <div className="zoom" role="group" aria-label="Zoom de l’aperçu">
      <button type="button" className="zoom__btn" data-active={zoom === 'fit' || undefined} onClick={() => onZoom('fit')} title="Ajuster à la largeur">
        <ArrowsHorizontalIcon size={15} aria-hidden /> Ajuster
      </button>
      <span className="zoom__sep" aria-hidden />
      <button type="button" className="zoom__icon" onClick={dec} aria-label="Dézoomer"><MagnifyingGlassMinusIcon size={16} aria-hidden /></button>
      <span className="zoom__pct num" aria-live="polite">{pct} %</span>
      <button type="button" className="zoom__icon" onClick={inc} aria-label="Zoomer"><MagnifyingGlassPlusIcon size={16} aria-hidden /></button>
    </div>
  )
}

/* ───── Onglets Modification / Aperçu sous 1200 px ───── */
export function useNarrow(q = '(max-width: 1199px)') {
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}

export function PaneTabs({ value, onChange }: { value: 'edit' | 'preview'; onChange: (v: 'edit' | 'preview') => void }) {
  return (
    <div className="pane-tabs" role="tablist" aria-label="Affichage">
      <button type="button" role="tab" aria-selected={value === 'edit'} onClick={() => onChange('edit')}>Modification</button>
      <button type="button" role="tab" aria-selected={value === 'preview'} onClick={() => onChange('preview')}>Aperçu</button>
    </div>
  )
}

/* ───── Petits contrôles partagés ───── */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className="seg__opt" onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="sw-row">
      <span className="sw-row__text">
        <span className="sw-row__label">{label}</span>
        {hint && <span className="sw-row__hint">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}
