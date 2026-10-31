import { Link } from 'react-router-dom'
import { Badge } from '@/ui/Badge'
import { Bouton } from '@/ui/Bouton'
import { EntetePage } from '@/ui/EntetePage'
import { Icone } from '@/ui/Icone'
import { formaterDate } from '@/lib/format'
import { ElementMenu, Menu } from '@/ui/Menu'
import { nomAffichageClient, type Client } from '@shared/clients'
import { BadgeNature, ListeTags } from './ElementsClient'

interface Actions {
  enCours: boolean
  onModifier(): void
  onArchiver(): void
  onRestaurer(): void
  onSupprimer(): void
}

function MenuFiche({ archive, enCours, onArchiver, onRestaurer, onSupprimer }: Omit<Actions, 'onModifier'> & { archive: boolean }) {
  return (
    <Menu
      aligne="droite"
      libelle="Autres actions"
      declencheur={({ ouvert, basculer }) => (
        <Bouton icone="actions" aria-label="Autres actions" aria-haspopup="menu" aria-expanded={ouvert} onClick={basculer} />
      )}
    >
      {(fermer) => {
        const agir = (action: () => void) => () => {
          fermer()
          action()
        }
        return (
          <>
            {archive ? (
              <ElementMenu icone="restaurer" disabled={enCours} onClick={agir(onRestaurer)}>
                Restaurer
              </ElementMenu>
            ) : (
              <ElementMenu icone="archive" onClick={agir(onArchiver)}>
                Archiver
              </ElementMenu>
            )}
            <ElementMenu icone="poubelle" danger onClick={agir(onSupprimer)}>
              Supprimer
            </ElementMenu>
          </>
        )
      }}
    </Menu>
  )
}

interface Props extends Actions {
  client: Client
  peutGerer: boolean
}

/** Fil d'Ariane, titre, actions, puis nature, tags et coordonnées. */
export function EnteteFiche({ client, peutGerer, onModifier, ...menu }: Props) {
  const archive = client.archiveLe !== null
  const nom = nomAffichageClient(client)
  return (
    <>
      <EntetePage
        titre={nom}
        filAriane={[{ libelle: 'Clients', vers: '/clients' }, { libelle: nom }]}
        actions={
          <>
            {peutGerer ? (
              <Bouton icone="crayon" onClick={onModifier}>
                Modifier
              </Bouton>
            ) : null}
            <Link to={`/devis?nouveau=1&client=${client.id}`} className="btn btn--primary btn--signature">
              <Icone nom="devis" taille={18} />
              Nouveau devis
            </Link>
            {peutGerer ? <MenuFiche archive={archive} {...menu} /> : null}
          </>
        }
      />
      <div className="fiche-identite">
        <div className="fiche-identite__badges">
          <BadgeNature nature={client.nature} />
          {archive ? <Badge ton="alerte">Archivé le {formaterDate(client.archiveLe!)}</Badge> : null}
          <ListeTags tags={client.tags} />
        </div>
        <ul className="fiche-identite__coordonnees">
          {client.telephone ? (
            <li>
              <Icone nom="telephone" taille={16} />
              <a href={`tel:${client.telephone}`}>{client.telephone}</a>
            </li>
          ) : null}
          {client.email ? (
            <li>
              <Icone nom="courriel" taille={16} />
              <a href={`mailto:${client.email}`}>{client.email}</a>
            </li>
          ) : null}
        </ul>
        {archive && client.archiveMotif ? <p className="fiche-identite__motif">Motif d’archivage : {client.archiveMotif}</p> : null}
      </div>
    </>
  )
}
