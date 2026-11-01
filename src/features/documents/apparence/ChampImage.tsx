import { useRef, useState } from 'react'
import { Bouton } from '@/ui/Bouton'
import { lireDimensions, lireEnDataUrl, validerDimensions, validerImage, type RegleImage } from './image'

interface Props {
  /** Nom de l'image au singulier, sans article : « logo », « photo ». */
  nom: string
  valeur?: string
  regle: RegleImage
  onChoisir(dataUrl: string): void
  onRetirer(): void
}

/** Importe une image après contrôle du type et de la taille ; le fichier est lu en data URL (rien n'est envoyé). */
export function ChampImage({ nom, valeur, regle, onChoisir, onRetirer }: Props) {
  const entree = useRef<HTMLInputElement>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const choisir = async (fichier: File | undefined) => {
    if (!fichier) return
    const probleme = validerImage(fichier, regle)
    setErreur(probleme)
    if (probleme) return
    try {
      const tailleTrop = validerDimensions(await lireDimensions(fichier), regle)
      setErreur(tailleTrop)
      if (tailleTrop) return
      onChoisir(await lireEnDataUrl(fichier))
    } catch {
      setErreur('Image illisible. Essayez un autre fichier.')
    }
  }

  return (
    <div className="champ-image">
      <div className="champ-image__actions">
        <Bouton taille="sm" icone="importer" onClick={() => entree.current?.click()}>
          {valeur ? `Changer le ${nom}` : `Importer un ${nom}`}
        </Bouton>
        {valeur ? <Bouton taille="sm" variante="fantome" icone="poubelle" onClick={onRetirer}>Retirer</Bouton> : null}
        <input
          ref={entree}
          type="file"
          hidden
          aria-label={`Fichier du ${nom}`}
          accept={regle.types.join(',')}
          onChange={(e) => {
            void choisir(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      {erreur ? <p className="apparence-alerte" role="alert">{erreur}</p> : null}
    </div>
  )
}
