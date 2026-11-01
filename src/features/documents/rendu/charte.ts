import { couleurTexteLisible, melangerAvecBlanc } from '../../../lib/couleur'
import type { ChartePage, ModelePageId, PoliceId, StyleTableauId } from './types'

interface Choix<Id extends string> { id: Id; libelle: string; description: string; recommande?: boolean }

export const MODELES_PAGE: (Choix<ModelePageId> & { photo?: boolean })[] = [
  { id: 'classique-pro', libelle: 'Classique pro', description: 'Sobre et rassurant, idéal pour tous les artisans.', recommande: true },
  { id: 'colonne', libelle: 'Colonne latérale', description: 'Coordonnées et informations clés dans une colonne.' },
  { id: 'hero', libelle: 'Hero image', description: 'Une photo de réalisation pour valoriser votre savoir-faire.', photo: true },
  { id: 'plan', libelle: 'Plan chantier', description: 'Style technique, pour la rénovation et la construction.', recommande: true },
  { id: 'epure', libelle: 'Épuré premium', description: 'Minimaliste et élégant, image haut de gamme.' },
  { id: 'bandeau', libelle: 'Bandeau moderne', description: 'Plus visuel tout en restant professionnel.', recommande: true },
  { id: 'bloc-client', libelle: 'Bloc client', description: 'Client et chantier mis en avant, très clair.', recommande: true },
  { id: 'artisan', libelle: 'Artisan', description: 'Visuel, avec une zone de réassurance.', photo: true },
]

export const STYLES_TABLEAU: Choix<StyleTableauId>[] = [
  { id: 'standard', libelle: 'Standard', description: 'Classique et lisible' },
  { id: 'entete', libelle: 'En-tête coloré', description: 'Met en valeur vos couleurs', recommande: true },
  { id: 'alterne', libelle: 'Lignes alternées', description: 'Confortable pour les longs devis', recommande: true },
  { id: 'numeros', libelle: 'Avec numéros', description: 'Pour se référer facilement aux lignes', recommande: true },
  { id: 'cartes', libelle: 'Sections en cartes', description: 'Chaque section ressort visuellement', recommande: true },
  { id: 'minimal', libelle: 'Minimaliste', description: 'Design épuré, haut de gamme' },
  { id: 'montant', libelle: 'Montant mis en avant', description: 'Les totaux de ligne plus visibles' },
  { id: 'sans-tva', libelle: 'Sans colonne TVA', description: 'Plus simple si un seul taux' },
  { id: 'groupes', libelle: 'Groupes visuels', description: 'Sections en bandeaux de couleur' },
  { id: 'bordures', libelle: 'Bordures modernes', description: 'Structuré, quadrillage fin' },
]

export const POLICES: { id: PoliceId; libelle: string; famille: string }[] = [
  { id: 'geist', libelle: 'Moderne', famille: '"Geist", system-ui, sans-serif' },
  { id: 'serif', libelle: 'Classique', famille: '"Source Serif 4", Georgia, serif' },
  { id: 'lisible', libelle: 'Très lisible', famille: '"Atkinson Hyperlegible", Verdana, sans-serif' },
  { id: 'arrondie', libelle: 'Douce', famille: '"Manrope", system-ui, sans-serif' },
]

/** Couleurs proposées à l'utilisateur : ce sont des données qu'il choisit, pas du style de l'application. */
export const PALETTES: { id: string; libelle: string; principale: string; accent: string }[] = [
  { id: 'marine', libelle: 'Bleu marine', principale: '#0B2A50', accent: '#16B8B0' },
  { id: 'turquoise', libelle: 'Turquoise', principale: '#0E6E6A', accent: '#16B8B0' },
  { id: 'vert', libelle: 'Vert', principale: '#1E5E3B', accent: '#4DAF68' },
  { id: 'orange', libelle: 'Orange', principale: '#8A3F12', accent: '#E8892E' },
  { id: 'rouge', libelle: 'Rouge', principale: '#8E1B2B', accent: '#E05A5A' },
  { id: 'violet', libelle: 'Violet', principale: '#3F2475', accent: '#8B64D8' },
  { id: 'anthracite', libelle: 'Anthracite', principale: '#2B2F36', accent: '#8A94A3' },
]

export const CHARTE_PAR_DEFAUT: ChartePage = {
  modele: 'classique-pro',
  styleTableau: 'standard',
  couleurPrincipale: '#0B2A50',
  couleurAccent: '#16B8B0',
  police: 'geist',
  tailleLogo: 'M',
  alignementLogo: 'gauche',
  afficherContact: true,
  piedDePage: '',
  afficherMentionsLegales: true,
  options: { afficherReferences: false, afficherUnites: true, regrouperSections: true, afficherSignature: true, afficherQr: false },
}

/** Variables CSS `--doc-…` du document : couleurs, teintes mélangées au blanc, texte lisible dessus, police. */
export function variablesCharte(charte: ChartePage): Record<`--doc-${string}`, string> {
  const p = charte.couleurPrincipale
  const a = charte.couleurAccent
  return {
    '--doc-p': p,
    '--doc-p-sur': couleurTexteLisible(p),
    '--doc-a': a,
    '--doc-a-sur': couleurTexteLisible(a),
    '--doc-a-doux': melangerAvecBlanc(a, 0.14),
    '--doc-a-trait': melangerAvecBlanc(a, 0.4),
    '--doc-p-doux': melangerAvecBlanc(p, 0.06),
    '--doc-p-teinte': melangerAvecBlanc(p, 0.12),
    '--doc-p-trait': melangerAvecBlanc(p, 0.22),
    '--doc-p-t10': melangerAvecBlanc(p, 0.1),
    '--doc-p-t14': melangerAvecBlanc(p, 0.14),
    '--doc-p-t20': melangerAvecBlanc(p, 0.2),
    '--doc-p-t32': melangerAvecBlanc(p, 0.32),
    '--doc-a-t30': melangerAvecBlanc(a, 0.3),
    '--doc-a-t55': melangerAvecBlanc(a, 0.55),
    '--doc-police': POLICES.find((f) => f.id === charte.police)?.famille ?? 'system-ui, sans-serif',
  }
}
