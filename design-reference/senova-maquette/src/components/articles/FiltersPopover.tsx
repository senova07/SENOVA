import { useRef, useState } from 'react'
import { FunnelSimpleIcon } from '@phosphor-icons/react'
import { useDismiss } from '../../lib/useDismiss'
import { formatVat } from '../../lib/format'

export interface AdvancedFilters {
  vatRates: number[]
  categories: string[]
  neverUsed: boolean
}

export const EMPTY_FILTERS: AdvancedFilters = { vatRates: [], categories: [], neverUsed: false }

export const countFilters = (f: AdvancedFilters) => f.vatRates.length + f.categories.length + (f.neverUsed ? 1 : 0)

interface Props {
  value: AdvancedFilters
  onChange: (f: AdvancedFilters) => void
  vatOptions: number[]
  categoryOptions: string[]
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export function FiltersPopover({ value, onChange, vatOptions, categoryOptions }: Props) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  useDismiss(open, [btnRef, popRef], () => setOpen(false))
  const n = countFilters(value)

  return (
    <div className="filters">
      <button
        ref={btnRef}
        type="button"
        className="btn btn--secondary btn--sm"
        aria-expanded={open}
        aria-haspopup="dialog"
        data-active={n > 0 || undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <FunnelSimpleIcon size={15} weight="bold" aria-hidden />
        Filtres
        {n > 0 && <span className="filters__badge num">{n}</span>}
      </button>
      {open && (
        <div ref={popRef} className="menu filters__pop" role="dialog" aria-label="Filtres avancés">
          <fieldset className="filters__group">
            <legend className="menu__label">Taux de TVA</legend>
            {vatOptions.map((v) => (
              <label key={v} className="check">
                <input type="checkbox" checked={value.vatRates.includes(v)} onChange={() => onChange({ ...value, vatRates: toggle(value.vatRates, v) })} />
                <span>{formatVat(v)}</span>
              </label>
            ))}
          </fieldset>
          <div className="menu__sep" />
          <fieldset className="filters__group">
            <legend className="menu__label">Catégorie</legend>
            {categoryOptions.map((c) => (
              <label key={c} className="check">
                <input type="checkbox" checked={value.categories.includes(c)} onChange={() => onChange({ ...value, categories: toggle(value.categories, c) })} />
                <span>{c}</span>
              </label>
            ))}
          </fieldset>
          <div className="menu__sep" />
          <label className="check">
            <input type="checkbox" checked={value.neverUsed} onChange={() => onChange({ ...value, neverUsed: !value.neverUsed })} />
            <span>Jamais utilisés</span>
          </label>
          <div className="filters__foot">
            <button type="button" className="btn btn--ghost btn--sm" disabled={n === 0} onClick={() => onChange(EMPTY_FILTERS)}>Réinitialiser</button>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOpen(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
