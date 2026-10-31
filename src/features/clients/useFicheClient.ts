import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClients } from '@/services/clientsApi'
import type { ErreurApi } from '@/services/http'
import { useToast } from '@/store/toastContext'
import { nomAffichageClient, type Client } from '@shared/clients'

export type CalqueFiche = 'modifier' | 'archiver' | 'supprimer' | null

interface Resultat {
  id: string
  client?: Client
  erreur?: ErreurApi | Error
}

/** Chargement de la fiche, fenêtre ouverte et actions d'archivage, restauration et suppression. */
export function useFicheClient(id: string) {
  const navigate = useNavigate()
  const { notifier } = useToast()
  const [resultat, setResultat] = useState<Resultat | null>(null)
  const [calque, setCalque] = useState<CalqueFiche>(null)
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    let annule = false
    apiClients.lire(id).then(
      (client) => !annule && setResultat({ id, client }),
      (e: unknown) => !annule && setResultat({ id, erreur: e instanceof Error ? e : new Error('Erreur') }),
    )
    return () => {
      annule = true
    }
  }, [id])

  const courant = resultat?.id === id ? resultat : null
  const client = courant?.client

  const fermer = () => setCalque(null)
  const action = async (travail: (c: Client) => Promise<void>) => {
    if (!client) return
    setEnCours(true)
    try {
      await travail(client)
    } catch (e) {
      notifier('Action impossible', { message: e instanceof Error ? e.message : undefined, ton: 'alerte' })
    } finally {
      setEnCours(false)
    }
  }
  // PUT, archivage et restauration renvoient la fiche complète.
  const fusionner = (fiche: Client) => setResultat({ id, client: fiche })

  return {
    chargement: !courant,
    client,
    erreur: courant?.erreur,
    calque,
    ouvrir: setCalque,
    fermer,
    enCours,
    fusionner,
    archiver: (motif: string | null) =>
      action(async (c) => {
        fusionner(await apiClients.archiver(c.id, motif))
        fermer()
        notifier('Client archivé', { message: nomAffichageClient(c), ton: 'succes' })
      }),
    restaurer: () =>
      action(async (c) => {
        fusionner(await apiClients.restaurer(c.id))
        notifier('Client restauré', { message: nomAffichageClient(c), ton: 'succes' })
      }),
    supprimer: () =>
      action(async (c) => {
        await apiClients.supprimer(c.id)
        notifier('Client supprimé', { message: nomAffichageClient(c), ton: 'succes' })
        navigate('/clients')
      }),
  }
}
