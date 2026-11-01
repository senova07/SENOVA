import { Link } from 'react-router-dom'
import { Icone, type NomIcone } from '@/ui/Icone'
import { ElementMenu, MenuLigne } from '@/ui/Menu'
import { nomAffichageClient, type Client } from '@shared/clients'

export interface ActionsClient {
  peutGerer: boolean
  onModifier(client: Client): void
  onArchiver(client: Client): void
  onRestaurer(client: Client): void
}

function LienMenu({ vers, icone, onClick, children }: { vers: string; icone: NomIcone; onClick(): void; children: string }) {
  return (
    <Link to={vers} role="menuitem" className="menu__item" onClick={onClick}>
      <Icone nom={icone} taille={16} />
      {children}
    </Link>
  )
}

interface Props extends ActionsClient {
  client: Client
  /** Ouvre vers le haut (dernières lignes du tableau). */
  versLeHaut: boolean
}

export function MenuLigneClient({ client: c, peutGerer, versLeHaut, onModifier, onArchiver, onRestaurer }: Props) {
  const libelle = `Actions : ${nomAffichageClient(c)}`
  return (
    <MenuLigne libelle={libelle} versLeHaut={versLeHaut}>
      {(fermer) => {
        const agir = (action: (c: Client) => void) => () => {
          fermer()
          action(c)
        }
        return (
          <>
            <LienMenu vers={`/clients/${c.id}`} icone="ouvrir" onClick={fermer}>
              Ouvrir
            </LienMenu>
            {peutGerer ? (
              <ElementMenu icone="crayon" onClick={agir(onModifier)}>
                Modifier
              </ElementMenu>
            ) : null}
            <LienMenu vers={`/devis?nouveau=1&client=${c.id}`} icone="devis" onClick={fermer}>
              Nouveau devis
            </LienMenu>
            {peutGerer ? (
              c.archiveLe ? (
                <ElementMenu icone="restaurer" onClick={agir(onRestaurer)}>
                  Restaurer
                </ElementMenu>
              ) : (
                <ElementMenu icone="archive" onClick={agir(onArchiver)}>
                  Archiver
                </ElementMenu>
              )
            ) : null}
          </>
        )
      }}
    </MenuLigne>
  )
}
