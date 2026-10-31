import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiClients } from '@/services/clientsApi'
import { useToast } from '@/store/toastContext'
import { nomAffichageClient, type Client } from '@shared/clients'

/** `client` nul = création ; `archiver` ouvre la confirmation avec motif. */
export type CalqueClients = { genre: 'client'; client: Client | null } | { genre: 'archiver'; client: Client }

/**
 * Fenêtres ouvertes sur la liste et actions d'écriture (modifier, restaurer, archiver).
 * `version` augmente après chaque écriture : la liste se recharge.
 */
export function useActionsClients(peutGerer: boolean) {
  const { notifier } = useToast()
  const [parametres, setParametres] = useSearchParams()
  const [calque, setCalque] = useState<CalqueClients | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [version, setVersion] = useState(0)

  // « + Nouveau → Client » de la topbar arrive ici avec ?nouveau=1.
  const demandeCreation = parametres.has('nouveau')
  useEffect(() => {
    if (!demandeCreation) return
    setParametres(
      (actuels) => {
        const suite = new URLSearchParams(actuels)
        suite.delete('nouveau')
        return suite
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ouverture demandée par l'URL
    if (peutGerer) setCalque({ genre: 'client', client: null })
  }, [demandeCreation, peutGerer, setParametres])

  const echec = (e: unknown) =>
    notifier('Action impossible', { message: e instanceof Error ? e.message : undefined, ton: 'alerte' })
  const recharger = () => setVersion((v) => v + 1)

  return {
    calque,
    ouvrir: setCalque,
    fermer: () => setCalque(null),
    enCours,
    version,
    recharger,
    /** La liste n'a ni adresses ni contacts : on charge la fiche complète avant de modifier. */
    modifier: (c: Client) => apiClients.lire(c.id).then((fiche) => setCalque({ genre: 'client', client: fiche }), echec),
    restaurer: (c: Client) =>
      apiClients.restaurer(c.id).then(() => {
        recharger()
        notifier('Client restauré', { message: nomAffichageClient(c), ton: 'succes' })
      }, echec),
    archiver: async (c: Client, motif: string | null) => {
      setEnCours(true)
      try {
        await apiClients.archiver(c.id, motif)
        setCalque(null)
        recharger()
        notifier('Client archivé', { message: nomAffichageClient(c), ton: 'succes' })
      } catch (e) {
        echec(e)
      } finally {
        setEnCours(false)
      }
    },
  }
}
