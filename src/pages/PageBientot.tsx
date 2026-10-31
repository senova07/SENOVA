import { EntetePage } from '@/ui/EntetePage'
import { Badge } from '@/ui/Badge'
import { Carte } from '@/ui/Carte'
import { EtatVide } from '@/ui/EtatVide'
import type { NomIcone } from '@/ui/Icone'

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
