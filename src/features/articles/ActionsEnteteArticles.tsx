import { useNavigate } from 'react-router-dom'
import { Bouton } from '@/ui/Bouton'
import { BoutonMenu } from '@/ui/BoutonMenu'
import { ElementMenu, SeparateurMenu } from '@/ui/Menu'
import type { Calque } from './CalquesArticles'

interface Props {
  nbArticles: number
  onCreer(): void
  onCalque(calque: Calque): void
}

/** Boutons « Importer » et « Nouvel article ▾ » (menu : ajout en masse, import, catégories, ordre). */
export function ActionsEnteteArticles({ nbArticles, onCreer, onCalque }: Props) {
  const navigate = useNavigate()
  const versImport = () => navigate('/articles/import')
  return (
    <>
      <Bouton icone="importer" onClick={versImport}>
        Importer
      </Bouton>
      <BoutonMenu
        libelle="Nouvel article"
        icone="plus"
        onPrincipal={onCreer}
        libelleMenu="Autres façons d’ajouter des articles"
      >
        {(fermer) => {
          const lancer = (action: () => void) => () => {
            fermer()
            action()
          }
          return (
            <>
              <ElementMenu icone="plus" onClick={lancer(versImport)}>
                Ajout en masse
              </ElementMenu>
              <ElementMenu icone="importerFichier" onClick={lancer(versImport)}>
                Importer un fichier
              </ElementMenu>
              <SeparateurMenu />
              <ElementMenu icone="etiquette" onClick={lancer(() => onCalque({ genre: 'categories' }))}>
                Gérer les catégories
              </ElementMenu>
              <ElementMenu
                icone="ordre"
                disabled={nbArticles < 2}
                onClick={lancer(() => onCalque({ genre: 'ordre' }))}
              >
                Réorganiser l’ordre
              </ElementMenu>
            </>
          )
        }}
      </BoutonMenu>
    </>
  )
}
