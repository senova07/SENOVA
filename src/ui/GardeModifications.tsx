import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { Bouton } from './Bouton'
import { Dialogue } from './Dialogue'

interface GardeModificationsProps {
  /** Vrai tant qu'il reste des modifications non enregistrées. */
  actif: boolean
  titre?: string
  message: string
}

/**
 * Empêche de perdre des modifications : confirmation avant toute navigation interne
 * (barre latérale, fil d'Ariane, retour) et alerte du navigateur à la fermeture de l'onglet.
 * Nécessite le routeur de données (createBrowserRouter).
 */
export function GardeModifications({ actif, titre = 'Quitter sans enregistrer ?', message }: GardeModificationsProps) {
  const blocage = useBlocker(({ currentLocation, nextLocation }) => actif && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (!actif) return undefined
    const avertir = (ev: BeforeUnloadEvent) => {
      ev.preventDefault()
      ev.returnValue = '' // Safari et anciens navigateurs
    }
    window.addEventListener('beforeunload', avertir)
    return () => window.removeEventListener('beforeunload', avertir)
  }, [actif])

  const bloque = blocage.state === 'blocked'
  return (
    <Dialogue
      ouvert={bloque}
      onFermer={() => blocage.reset?.()}
      titre={titre}
      soustitre={message}
      pied={
        <>
          <Bouton onClick={() => blocage.reset?.()}>Rester</Bouton>
          <Bouton variante="danger" onClick={() => blocage.proceed?.()}>Quitter sans enregistrer</Bouton>
        </>
      }
    >
      <p>Vos modifications seront perdues.</p>
    </Dialogue>
  )
}
