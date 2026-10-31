import { Badge } from '@/components/ui/Badge'
import { Icone, type NomIcone } from '@/components/ui/Icone'
import type { Client } from '@shared/clients'

const LIBELLES_NATURE = { particulier: 'Particulier', entreprise: 'Entreprise' } as const

export function BadgeNature({ nature }: { nature: Client['nature'] }) {
  return <Badge ton={nature === 'entreprise' ? 'info' : 'neutre'}>{LIBELLES_NATURE[nature]}</Badge>
}

/** Nature en texte + icône, sans fond : pour les tableaux denses. */
export function NatureTexte({ nature }: { nature: Client['nature'] }) {
  return (
    <span className="client__nature">
      <Icone nom={nature === 'entreprise' ? 'entreprise' : 'particulier'} taille={14} />
      {LIBELLES_NATURE[nature]}
    </span>
  )
}

export function ListeTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  return (
    <ul className="client-tags">
      {tags.map((t) => (
        <li className="client-tag" key={t}>
          {t}
        </li>
      ))}
    </ul>
  )
}

/** Statut de pièce : toujours texte + icône, la couleur n'est qu'un renfort. */
export function StatutPiece({
  icone,
  libelle,
  ton,
}: {
  icone: NomIcone
  libelle: string
  ton: 'neutre' | 'succes' | 'alerte' | 'danger'
}) {
  return (
    <span className={`statut-piece statut-piece--${ton}`}>
      <Icone nom={icone} taille={14} />
      {libelle}
    </span>
  )
}
