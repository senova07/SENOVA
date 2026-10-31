import { api } from '@/services/http'
import type { Client, ClientSaisie, PageClients } from '@shared/clients'

export interface FiltresClients {
  recherche?: string
  archives: boolean
  page: number
  parPage: number
}

/** Contrat `/api/clients`. `modifier` remplace tout : toujours envoyer l'objet complet. */
export const apiClients = {
  lister: (f: FiltresClients) =>
    api.lire<PageClients>('/clients', {
      recherche: f.recherche || undefined,
      archives: f.archives ? '1' : '0',
      page: f.page,
      parPage: f.parPage,
    }),
  lire: (id: string) => api.lire<Client>(`/clients/${id}`),
  creer: (saisie: ClientSaisie) => api.creer<Client>('/clients', saisie),
  modifier: (id: string, saisie: ClientSaisie) => api.remplacer<Client>(`/clients/${id}`, saisie),
  archiver: (id: string, motif: string | null) =>
    api.creer<Client>(`/clients/${id}/archiver`, { motif }),
  restaurer: (id: string) => api.creer<Client>(`/clients/${id}/restaurer`),
  supprimer: (id: string) => api.supprimer(`/clients/${id}`),
}
