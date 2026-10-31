import { Link } from 'react-router-dom'
import { Badge, type TonBadge } from '@/ui/Badge'
import { Bouton } from '@/ui/Bouton'
import { Icone } from '@/ui/Icone'
import { MenuDeroulant } from '@/ui/Menu'
import { LIBELLES_STATUT_DEVIS, type Devis, type ModeleDevis, type StatutDevis } from './donnees'

const TON: Record<StatutDevis, TonBadge> = {
  brouillon: 'neutre',
  envoye: 'info',
  accepte: 'succes',
  refuse: 'danger',
  expire: 'alerte',
}

interface BarreDevisProps {
  devis: Devis
  modeles: readonly ModeleDevis[]
  lectureSeule: boolean
  /** Texte de l'indicateur d'enregistrement. */
  sauvegarde: string
  onApercu(): void
  onTelecharger(): void
  onEnvoyer(): void
  onDupliquer(): void
  onModele(id: string): void
  onStatut(statut: 'accepte' | 'refuse'): void
}

export function BarreDevis({
  devis,
  modeles,
  lectureSeule,
  sauvegarde,
  onApercu,
  onTelecharger,
  onEnvoyer,
  onDupliquer,
  onModele,
  onStatut,
}: BarreDevisProps) {
  return (
    <header className="espace-barre">
      <Link to="/devis" className="espace-retour">
        <Icone nom="retour" taille={18} />
        <span>Devis</span>
      </Link>
      <div className="espace-barre__titre">
        <h1>{devis.numero}</h1>
        <Badge ton={TON[devis.statut]}>{LIBELLES_STATUT_DEVIS[devis.statut]}</Badge>
      </div>
      <p className="espace-sauvegarde" role="status">
        {sauvegarde}
      </p>
      <div className="espace-barre__actions">
        <Bouton taille="sm" icone="apercu" className="espace-btn-apercu" onClick={onApercu}>
          <span className="espace-libelle">Aperçu</span>
        </Bouton>
        <Bouton taille="sm" icone="telecharger" onClick={onTelecharger}>
          <span className="espace-libelle">Télécharger PDF</span>
        </Bouton>
        <Bouton taille="sm" variante="primaire" onClick={onEnvoyer} disabled={lectureSeule}>
          Envoyer
        </Bouton>
        <MenuDeroulant
          declencheur={({ ouvert, basculer }) => (
            <button
              type="button"
              className="btn btn--sm btn--icone"
              aria-label="Plus d’actions"
              aria-haspopup="menu"
              aria-expanded={ouvert}
              onClick={basculer}
            >
              <Icone nom="actions" taille={20} poids="bold" />
            </button>
          )}
        >
          {(fermer) => {
            const agir = (action: () => void) => () => {
              fermer()
              action()
            }
            return (
              <div className="menu__liste" role="menu" aria-label="Actions du devis">
                <button
                  type="button"
                  role="menuitem"
                  className="menu__item"
                  onClick={agir(onDupliquer)}
                >
                  <Icone nom="copier" taille={18} />
                  Dupliquer
                </button>
                <p className="espace-menu-titre" role="presentation">
                  Changer de modèle
                </p>
                {modeles.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={m.id === devis.modeleId}
                    className="menu__item"
                    disabled={lectureSeule}
                    onClick={agir(() => onModele(m.id))}
                  >
                    {m.nom}
                  </button>
                ))}
                <hr className="espace-menu-sep" />
                <button
                  type="button"
                  role="menuitem"
                  className="menu__item"
                  disabled={lectureSeule}
                  onClick={agir(() => onStatut('accepte'))}
                >
                  <Icone nom="accepte" taille={18} />
                  Marquer accepté
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="menu__item"
                  disabled={lectureSeule}
                  onClick={agir(() => onStatut('refuse'))}
                >
                  <Icone nom="refuse" taille={18} />
                  Marquer refusé
                </button>
              </div>
            )
          }}
        </MenuDeroulant>
      </div>
    </header>
  )
}
