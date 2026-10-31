import { forwardRef } from 'react'
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { value, onChange, placeholder = 'Rechercher…' }, ref,
) {
  return (
    <div className="searchbar">
      <MagnifyingGlassIcon size={15} weight="bold" className="searchbar__icon" aria-hidden />
      <input
        ref={ref}
        id="article-search"
        type="search"
        className="input searchbar__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape' && value) { e.preventDefault(); onChange('') } }}
        aria-label={placeholder}
        autoComplete="off"
      />
      {value ? (
        <button type="button" className="searchbar__clear" onClick={() => onChange('')} aria-label="Effacer la recherche">
          <XIcon size={13} weight="bold" aria-hidden />
        </button>
      ) : null}
    </div>
  )
})
