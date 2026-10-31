import { ElementMenu, MenuLigne, SeparateurMenu } from '@/ui/Menu'
import type { Devis } from './types'

export interface ActionsDevis {
  onOuvrir(d: Devis): void
  onDupliquer(d: Devis): void
  onEnvoye(d: Devis): void
  onAccepte(d: Devis): void
  onRefuse(d: Devis): void
  onSupprimer(d: Devis): void
}

/** Menu ⋮ d'une ligne : ouvrir, dupliquer, changer le statut, supprimer (brouillons seulement). */
export function MenuLigneDevis({
  devis: d,
  versLeHaut,
  ...actions
}: ActionsDevis & { devis: Devis; versLeHaut: boolean }) {
  const libelle = `Actions : ${d.numero}`
  const reponse = d.statut === 'envoye'
  return (
    <MenuLigne libelle={libelle} versLeHaut={versLeHaut}>
      {(fermer) => {
        const agir = (action: (d: Devis) => void) => () => {
          fermer()
          action(d)
        }
        return (
          <>
            <ElementMenu icone="ouvrir" onClick={agir(actions.onOuvrir)}>
              Ouvrir
            </ElementMenu>
            <ElementMenu icone="copier" onClick={agir(actions.onDupliquer)}>
              Dupliquer
            </ElementMenu>
            <SeparateurMenu />
            <ElementMenu icone="envoyer" disabled={d.statut !== 'brouillon'} onClick={agir(actions.onEnvoye)}>
              Marquer envoyé
            </ElementMenu>
            <ElementMenu icone="accepte" disabled={!reponse} onClick={agir(actions.onAccepte)}>
              Marquer accepté
            </ElementMenu>
            <ElementMenu icone="refuse" disabled={!reponse} onClick={agir(actions.onRefuse)}>
              Marquer refusé
            </ElementMenu>
            {d.statut === 'brouillon' ? (
              <>
                <SeparateurMenu />
                <ElementMenu icone="poubelle" danger onClick={agir(actions.onSupprimer)}>
                  Supprimer
                </ElementMenu>
              </>
            ) : null}
          </>
        )
      }}
    </MenuLigne>
  )
}
