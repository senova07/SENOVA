import { reinitialiserDemoDevis } from '@/features/devis'
import { reinitialiserDemoDocuments } from '@/features/documents'

/** undefined = rien vu encore ; null = personne de connecté. */
let organisationCourante: string | null | undefined

/**
 * Les données de démo (devis, charte, mentions dont l'IBAN) vivent en mémoire de module :
 * on les remet à zéro dès que l'organisation change (changement d'entreprise ou autre compte
 * dans le même onglet), pour qu'aucune donnée d'une organisation n'apparaisse chez une autre.
 * Idempotent : peut être appelé à chaque rendu.
 * shortcut: à retirer quand ces données viendront de l'API (cache indexé par organisation).
 */
export function isolerDemo(organisationId: string | null): void {
  if (organisationId === organisationCourante) return
  if (organisationCourante !== undefined) {
    reinitialiserDemoDevis()
    reinitialiserDemoDocuments()
  }
  organisationCourante = organisationId
}
