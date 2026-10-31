import { useRouteError } from 'react-router-dom'
import { Bouton } from '@/ui/Bouton'
import { EtatVide } from '@/ui/EtatVide'

/** Remplace l'écran technique de react-router quand un écran plante : message clair, sans détail interne. */
export function PageErreur() {
  const erreur = useRouteError()
  console.error(erreur) // trace pour le développeur ; l'utilisateur ne voit que le message

  return (
    <main className="page">
      <EtatVide
        icone="attention"
        titre="Cet écran a rencontré un problème"
        texte="Vos données enregistrées ne sont pas touchées. Rechargez la page ; si le problème continue, contactez le support."
        action={<Bouton variante="primaire" onClick={() => window.location.reload()}>Recharger la page</Bouton>}
      />
    </main>
  )
}
