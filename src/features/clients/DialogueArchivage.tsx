import { useState } from 'react'
import { Bouton } from '@/ui/Bouton'
import { Dialogue } from '@/ui/Dialogue'
import { ChampTexte } from '@/ui/Formulaire'

interface Props {
  nom: string
  enCours: boolean
  onFermer(): void
  /** Motif saisi, `null` s'il est vide. */
  onConfirmer(motif: string | null): void
}

/** Confirmation d'archivage avec motif facultatif. À monter seulement quand elle est ouverte. */
export function DialogueArchivage({ nom, enCours, onFermer, onConfirmer }: Props) {
  const [motif, setMotif] = useState('')
  return (
    <Dialogue
      ouvert
      onFermer={onFermer}
      titre="Archiver ce client"
      soustitre={`${nom} quittera la liste des clients actifs. Vous pourrez le restaurer.`}
      pied={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="primaire" disabled={enCours} onClick={() => onConfirmer(motif.trim() || null)}>
            Archiver le client
          </Bouton>
        </>
      }
    >
      <ChampTexte libelle="Motif (facultatif)" value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={255} />
    </Dialogue>
  )
}
