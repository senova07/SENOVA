import { Bouton } from '@/ui/Bouton'
import { Dialogue } from '@/ui/Dialogue'

interface Props {
  ouvert: boolean
  nom: string
  enCours: boolean
  onFermer(): void
  onConfirmer(): void
}

/** Confirmation de la suppression définitive d'un client. */
export function DialogueSuppression({ ouvert, nom, enCours, onFermer, onConfirmer }: Props) {
  return (
    <Dialogue
      ouvert={ouvert}
      onFermer={onFermer}
      titre="Supprimer ce client"
      soustitre="Cette action est définitive."
      pied={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="danger" onClick={onConfirmer} disabled={enCours}>
            Supprimer définitivement
          </Bouton>
        </>
      }
    >
      <p>
        Supprimer <strong>{nom}</strong> effacera aussi ses adresses et ses contacts. Pour le garder sans qu’il
        encombre la liste, archivez-le plutôt.
      </p>
    </Dialogue>
  )
}
