import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EtatVide } from '@/ui/EtatVide'
import { apiDevis } from './api'
import { EditeurDevis } from './EditeurDevis'
import type { Devis } from './types'

type Chargement = { id: string; devis: Devis | null }

/** Écran « Nouveau devis » (routes `/devis/:id`) : charge le devis par `apiDevis`, puis ouvre l'éditeur. */
export function PageEditeurDevis() {
  const { id = '' } = useParams()
  const [charge, setCharge] = useState<Chargement | null>(null)

  useEffect(() => {
    let annule = false
    apiDevis.lire(id).then(
      (devis) => !annule && setCharge({ id, devis }),
      () => !annule && setCharge({ id, devis: null }),
    )
    return () => {
      annule = true
    }
  }, [id])

  if (charge?.id !== id) return <p className="devis-chargement" role="status">Chargement du devis…</p>
  if (!charge.devis) {
    return (
      <EtatVide
        icone="devis"
        titre="Devis introuvable"
        texte="Ce devis n’existe pas ou a été supprimé."
        action={
          <Link to="/devis" className="btn btn--secondary">
            Retour aux devis
          </Link>
        }
      />
    )
  }
  return <EditeurDevis key={charge.devis.id} initial={charge.devis} />
}
