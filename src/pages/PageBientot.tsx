import { EntetePage } from '@/components/layout/EntetePage'
import { Badge } from '@/components/ui/Badge'
import { Carte } from '@/components/ui/Carte'
import { EtatVide } from '@/components/ui/EtatVide'
import type { NomIcone } from '@/components/ui/Icone'

interface PageBientotProps {
  titre: string
  icone: NomIcone
}

/** Placeholder propre pour les rubriques des lots suivants. */
export function PageBientot({ titre, icone }: PageBientotProps) {
  return (
    <>
      <EntetePage titre={titre} actions={<Badge ton="info">Bientôt</Badge>} />
      <Carte className="bientot">
        <EtatVide
          icone={icone}
          titre={`${titre} arrive bientôt`}
          texte="Cette rubrique sera disponible dans une prochaine version."
        />
      </Carte>
    </>
  )
}
