import { Onglets } from '@/ui/Onglets'
import { ONGLETS, type Onglet } from './filtres'

export const PREFIXE_ONGLETS = 'articles'

export function OngletsArticles({ actif, onChoisir }: { actif: Onglet; onChoisir(id: Onglet): void }) {
  return (
    <Onglets
      libelle="Filtrer les articles"
      prefixe={PREFIXE_ONGLETS}
      onglets={ONGLETS}
      actif={actif}
      onChoisir={onChoisir}
    />
  )
}
