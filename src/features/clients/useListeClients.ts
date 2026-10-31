import { useEffect, useState } from 'react'
import { apiClients } from '@/services/clientsApi'
import type { Client } from '@shared/clients'

const PAR_PAGE_API = 100 // maximum accepté par l'API
const PAGES_MAX = 20

interface Resultat {
  cle: string
  clients?: Client[]
  erreur?: string
}

async function toutCharger(recherche: string, archives: boolean): Promise<Client[]> {
  const clients: Client[] = []
  for (let page = 1; page <= PAGES_MAX; page++) {
    const lot = await apiClients.lister({ recherche, archives, page, parPage: PAR_PAGE_API })
    clients.push(...lot.donnees)
    if (clients.length >= lot.total || lot.donnees.length === 0) break
  }
  return clients
}

/**
 * Charge tous les clients du filtre serveur (la maquette trie, pagine et filtre par nature côté client).
 * `actif` à faux = rien à charger. `version` change = rechargement.
 */
export function useListeClients(
  actif: boolean,
  recherche: string,
  archives: boolean,
  version: number,
) {
  const [resultat, setResultat] = useState<Resultat | null>(null)
  const cle = `${archives ? 1 : 0}|${recherche}|${version}`

  useEffect(() => {
    if (!actif) return
    let annule = false
    toutCharger(recherche, archives).then(
      (clients) => !annule && setResultat({ cle, clients }),
      (e: unknown) =>
        !annule &&
        setResultat({ cle, erreur: e instanceof Error ? e.message : 'Chargement impossible.' }),
    )
    return () => {
      annule = true
    }
  }, [actif, cle, recherche, archives])

  const courant = resultat?.cle === cle ? resultat : null
  return {
    clients: courant?.clients ?? resultat?.clients,
    erreur: courant?.erreur,
    /** Un résultat précédent peut rester affiché (atténué) pendant le rechargement. */
    enCours: actif && !courant,
  }
}
