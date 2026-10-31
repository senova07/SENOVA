import { ElementMenu, MenuLigne, SeparateurMenu } from '@/ui/Menu'
import type { Article } from '@shared/articles'

export type ActionLigne = 'modifier' | 'dupliquer' | 'favori' | 'archiver' | 'supprimer'

interface Props {
  article: Article
  /** Ouvre vers le haut (dernières lignes du tableau). */
  versLeHaut: boolean
  onAction(action: ActionLigne): void
}

export function MenuLigneArticle({ article: a, versLeHaut, onAction }: Props) {
  return (
    <MenuLigne libelle={`Actions pour ${a.nom}`} versLeHaut={versLeHaut}>
      {(fermer) => {
        const agir = (action: ActionLigne) => () => {
          fermer()
          onAction(action)
        }
        return (
          <>
            <ElementMenu icone="crayon" onClick={agir('modifier')}>
              Modifier
            </ElementMenu>
            <ElementMenu icone="copier" onClick={agir('dupliquer')}>
              Dupliquer
            </ElementMenu>
            <ElementMenu icone="etoile" onClick={agir('favori')}>
              {a.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </ElementMenu>
            <SeparateurMenu />
            <ElementMenu icone={a.actif ? 'archive' : 'restaurer'} onClick={agir('archiver')}>
              {a.actif ? 'Archiver' : 'Restaurer'}
            </ElementMenu>
            <ElementMenu icone="poubelle" danger onClick={agir('supprimer')}>
              Supprimer
            </ElementMenu>
          </>
        )
      }}
    </MenuLigne>
  )
}
