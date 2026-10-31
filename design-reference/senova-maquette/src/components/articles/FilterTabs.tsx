export interface TabOption<T extends string> {
  id: T
  label: string
  count?: number
}

interface Props<T extends string> {
  options: TabOption<T>[]
  value: T
  onChange: (v: T) => void
  label: string
}

/** Onglets soulignés (pas de pilules). Navigation clavier gauche / droite. */
export function FilterTabs<T extends string>({ options, value, onChange, label }: Props<T>) {
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.id === value)
    const next = options[(i + dir + options.length) % options.length]
    onChange(next.id)
    requestAnimationFrame(() => document.getElementById(`tab-${next.id}`)?.focus())
  }
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map((o) => {
        const selected = o.id === value
        return (
          <button
            key={o.id}
            id={`tab-${o.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className="tabs__tab"
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') { e.preventDefault(); move(1) }
              if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1) }
            }}
          >
            {o.label}
            {o.count != null && <span className="tabs__count num">{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
