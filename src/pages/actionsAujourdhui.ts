import type { NomIcone } from '@/ui/Icone'
import { formaterEuro } from '@/lib/format'
import { dateFinValidite, FACTURES_DEMO, totalTtcDevis, type Devis, type StatutDevis } from '@/features/devis'

const SEUIL_RELANCE_DEVIS = 7

export interface Action {
  id: string
  icone: NomIcone
  client: string
  objet: string
  contexte: string
  /** Urgent = affiché en rouge. */
  urgent?: boolean
  /** Sans lien, le bouton déclenche la relance (maquette). */
  bouton: { libelle: string; lien?: string }
}

const joursEntre = (iso: string, aujourdhui: Date) =>
  Math.round((aujourdhui.getTime() - new Date(`${iso.slice(0, 10)}T12:00:00`).getTime()) / 864e5)

/** Liste priorisée : retards de paiement, devis à relancer, devis acceptés, brouillons. */
export function construireActions(devis: readonly Devis[], aujourdhui: Date): Action[] {
  const retards = FACTURES_DEMO.filter((f) => f.statut === 'en_retard')
    .map((f) => ({ f, jours: joursEntre(f.echeance, aujourdhui) }))
    .sort((a, b) => b.jours - a.jours)
    .map<Action>(({ f, jours }) => ({
      id: `facture-${f.id}`,
      icone: 'attention',
      client: f.clientNom,
      objet: `Facture ${f.numero}`,
      contexte: `${formaterEuro(f.resteDu)} dus, en retard de ${jours} j`,
      urgent: true,
      bouton: { libelle: 'Relancer' },
    }))

  const relances = devis
    .filter((d) => d.statut === 'envoye')
    .flatMap<Action>((d) => {
      const sansReponse = joursEntre(d.envoyeLe ?? d.dateCreation, aujourdhui)
      const avantFin = -joursEntre(dateFinValidite(d), aujourdhui)
      if (sansReponse <= SEUIL_RELANCE_DEVIS && avantFin > SEUIL_RELANCE_DEVIS) return []
      const delai =
        avantFin < 0
          ? `expiré depuis ${-avantFin} j`
          : avantFin <= SEUIL_RELANCE_DEVIS
            ? `expire dans ${avantFin} j`
            : `sans réponse depuis ${sansReponse} j`
      return [
        {
          id: `devis-${d.id}`,
          icone: 'horloge',
          client: d.clientNom,
          objet: d.objet,
          contexte: `${formaterEuro(totalTtcDevis(d))}, ${delai}`,
          urgent: avantFin < 0,
          bouton: { libelle: 'Relancer' },
        },
      ]
    })

  const parStatut = (statut: StatutDevis, icone: NomIcone, libelle: string, contexte: string) =>
    devis
      .filter((d) => d.statut === statut)
      .map<Action>((d) => ({
        id: `devis-${d.id}`,
        icone,
        client: d.clientNom,
        objet: d.objet,
        contexte: `${formaterEuro(totalTtcDevis(d))}, ${contexte}`,
        bouton: { libelle, lien: `/devis/${d.id}` },
      }))

  return [
    ...retards,
    ...relances,
    ...parStatut('accepte', 'accepte', 'Facturer', 'accepté, à facturer'),
    ...parStatut('brouillon', 'crayon', 'Terminer', 'brouillon à finir'),
  ]
}
