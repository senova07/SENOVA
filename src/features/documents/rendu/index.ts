/** API publique du rendu des documents (module autonome, réutilisable pour l'aperçu, l'apparence et le PDF). */
export { ApercuDocument } from './ApercuDocument'
export { TableauDocument } from './TableauDocument'
export { A4_HAUTEUR, A4_LARGEUR } from './usePagesA4'
export { CHARTE_PAR_DEFAUT, MODELES_PAGE, PALETTES, POLICES, STYLES_TABLEAU, variablesCharte } from './charte'
export { DOCUMENT_EXEMPLE } from './exemple'
export type {
  AdresseDocument, ChartePage, ClientDocument, DocumentRendu, EmetteurDocument, LigneDocument, LignePrestation,
  LigneSection, LigneTexte, LigneTva, MentionsLegales, ModelePageId, OptionsAffichage, PoliceId, StyleTableauId,
  TextesDocument, TotauxDocument, TypeDocument, ZoneDocument,
} from './types'
