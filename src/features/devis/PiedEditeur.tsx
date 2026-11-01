import { Bouton } from '@/ui/Bouton'
import { PiedAtelier } from '@/ui/ApercuAtelier'
import type { EtatBrouillon } from './useBrouillonDevis'

interface Props {
  etat: EtatBrouillon
  /** Devis fige (accepté, refusé, expiré) : rien à enregistrer. */
  fige: boolean
  brouillon: boolean
  onEnregistrer(): void
}

const STATUTS: Record<EtatBrouillon, { texte: string; ton: 'enregistre' | 'non-enregistre' }> = {
  intact: { texte: 'Démo : ce brouillon n’est pas sauvegardé sur le serveur', ton: 'enregistre' },
  modifie: { texte: 'Modifications non enregistrées', ton: 'non-enregistre' },
  enregistre: {
    texte: 'Brouillon enregistré dans cette session (démo : non sauvegardé sur le serveur)',
    ton: 'enregistre',
  },
  erreur: { texte: 'Enregistrement impossible, réessayez', ton: 'non-enregistre' },
}

/** Pied de l'atelier. L'aperçu PDF et l'envoi ne sont pas branchés : boutons désactivés et expliqués. */
export function PiedEditeur({ etat, fige, brouillon, onEnregistrer }: Props) {
  const { texte, ton } = STATUTS[etat]
  const statut = brouillon ? texte : texte.replace('ce brouillon', 'ce devis').replace('Brouillon enregistré', 'Devis enregistré')
  return (
    <PiedAtelier statut={statut} ton={ton}>
      <p className="sr-only" id="devis-bientot">
        PDF et envoi au client : bientôt disponibles.
      </p>
      <Bouton onClick={onEnregistrer} disabled={fige}>
        {brouillon ? 'Enregistrer le brouillon' : 'Enregistrer'}
      </Bouton>
      <Bouton icone="apercu" disabled aria-describedby="devis-bientot">
        Aperçu PDF
      </Bouton>
      <Bouton variante="primaire" icone="envoyer" disabled aria-describedby="devis-bientot">
        Envoyer au client
      </Bouton>
    </PiedAtelier>
  )
}
