import { Link } from 'react-router-dom'
import { Badge } from '@/ui/Badge'
import { Icone, type NomIcone } from '@/ui/Icone'
import { LIBELLES_STATUT_DEVIS, type FactureDemo, type StatutDevis } from '@/features/devis'
import type { Client } from '@shared/clients'

const LIBELLES_NATURE = { particulier: 'Particulier', entreprise: 'Entreprise' } as const

export function BadgeNature({ nature }: { nature: Client['nature'] }) {
  return <Badge ton={nature === 'entreprise' ? 'info' : 'neutre'}>{LIBELLES_NATURE[nature]}</Badge>
}

/** Nature en texte + icône, sans fond : pour les tableaux denses. */
export function NatureTexte({ nature }: { nature: Client['nature'] }) {
  return (
    <span className="client-nature">
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

type Ton = 'neutre' | 'succes' | 'alerte' | 'danger'

const STATUT_DEVIS: Record<StatutDevis, { icone: NomIcone; ton: Ton }> = {
  brouillon: { icone: 'crayon', ton: 'neutre' },
  envoye: { icone: 'envoyer', ton: 'neutre' },
  accepte: { icone: 'accepte', ton: 'succes' },
  refuse: { icone: 'refuse', ton: 'danger' },
  expire: { icone: 'horloge', ton: 'alerte' },
}

const STATUT_FACTURE: Record<FactureDemo['statut'], { icone: NomIcone; ton: Ton; libelle: string }> = {
  payee: { icone: 'accepte', ton: 'succes', libelle: 'Payée' },
  en_attente: { icone: 'horloge', ton: 'neutre', libelle: 'En attente' },
  en_retard: { icone: 'attention', ton: 'danger', libelle: 'En retard' },
}

export const StatutDevisPiece = ({ statut }: { statut: StatutDevis }) => (
  <StatutPiece {...STATUT_DEVIS[statut]} libelle={LIBELLES_STATUT_DEVIS[statut]} />
)
export const StatutFacture = ({ statut }: { statut: FactureDemo['statut'] }) => <StatutPiece {...STATUT_FACTURE[statut]} />

/** Action proposée quand le client n'a encore aucune pièce. */
export function BoutonCreerDevis() {
  return (
    <Link to="/devis" className="btn btn--primary">
      <Icone nom="plus" taille={18} />
      Créer un devis
    </Link>
  )
}
