import { StarIcon } from '@phosphor-icons/react'

interface Props {
  active: boolean
  name: string
  onToggle: () => void
}

export function FavoriteStar({ active, name, onToggle }: Props) {
  return (
    <button
      type="button"
      className="fav-star"
      aria-pressed={active}
      aria-label={active ? `Retirer « ${name} » des favoris` : `Ajouter « ${name} » aux favoris`}
      title={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
    >
      <StarIcon size={17} weight={active ? 'fill' : 'regular'} aria-hidden />
    </button>
  )
}
