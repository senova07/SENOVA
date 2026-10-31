import { Link } from 'react-router-dom'
import { SectionAtelier } from '@/ui/Atelier'
import { Icone } from '@/ui/Icone'
import { ChampTexte } from '@/ui/Formulaire'
import type { ReglagesDocuments } from '../api'
import type { MentionsLegales } from '../rendu'
import { mentionsManquantes } from './mentionsManquantes'
import { SECTIONS } from './sections'
import type { ModifierReglages } from './types'

interface Props {
  reglages: ReglagesDocuments
  /** Adresse de l'organisation telle qu'elle s'imprime ; vide si elle est incomplète. */
  adresse: string
  onReglages: ModifierReglages
}

interface ChampMention {
  cle: keyof MentionsLegales
  libelle: string
  exemple: string
  requis?: boolean
  aide?: string
  large?: boolean
}

const CHAMPS: readonly ChampMention[] = [
  { cle: 'siret', libelle: 'SIRET', exemple: '14 chiffres', requis: true, aide: 'Numéro à 14 chiffres figurant sur votre extrait Kbis ou avis de situation INSEE.' },
  { cle: 'numeroTva', libelle: 'N° de TVA intracommunautaire', exemple: 'FR 00 000000000', requis: true },
  { cle: 'formeJuridique', libelle: 'Forme juridique', exemple: 'EI, SARL, SAS…', requis: true },
  { cle: 'capital', libelle: 'Capital social', exemple: 'Ex. : 5 000 €' },
  { cle: 'registre', libelle: 'Immatriculation (RCS / RM)', exemple: 'Ex. : RM Lyon 812 345 678', large: true },
  { cle: 'assureur', libelle: 'Assureur décennale', exemple: 'Nom de l’assureur', requis: true, aide: 'Pour les travaux du bâtiment, l’assureur et la zone couverte figurent sur vos devis et factures.' },
  { cle: 'contratAssurance', libelle: 'N° de contrat', exemple: 'Numéro de police', requis: true },
  { cle: 'zoneAssurance', libelle: 'Zone couverte', exemple: 'Ex. : France métropolitaine', large: true },
  { cle: 'iban', libelle: 'IBAN', exemple: 'FR76 …', requis: true, aide: 'Affiché sur vos factures pour faciliter le paiement par virement.', large: true },
  { cle: 'bic', libelle: 'BIC', exemple: 'Ex. : AGRIFRPP' },
]

export function SectionMentions({ reglages, adresse, onReglages }: Props) {
  const { mentions } = reglages
  const manquants = mentionsManquantes(mentions, adresse).length
  return (
    <SectionAtelier
      id={SECTIONS.mentions}
      numero={6}
      titre="Mentions légales"
      statut={manquants ? 'alerte' : 'fait'}
      resume={manquants ? `${manquants} à compléter` : 'Complètes'}
    >
      <p className="apparence-note">
        <Icone nom="info" taille={16} />
        <span>
          SIRET, TVA et forme juridique sont repris de la fiche de votre entreprise ; vous pouvez les corriger ici pour vos documents.
          {adresse ? ` Adresse affichée : ${adresse}.` : ' L’adresse de votre entreprise est incomplète : '}
          {adresse ? null : <Link to="/parametres">la renseigner dans les paramètres de l’entreprise</Link>}
        </span>
      </p>
      <div className="apparence-grille">
        {CHAMPS.map((c) => {
          const manque = c.requis && !mentions[c.cle].trim()
          return (
            <div key={c.cle} className={c.large ? 'apparence-champ apparence-champ--large' : 'apparence-champ'}>
              <ChampTexte
                libelle={c.libelle}
                placeholder={c.exemple}
                value={mentions[c.cle]}
                aide={manque ? `À compléter.${c.aide ? ` ${c.aide}` : ''}` : c.aide}
                onChange={(e) => onReglages({ mentions: { ...mentions, [c.cle]: e.target.value } }, `mention:${c.cle}`)}
              />
            </div>
          )
        })}
      </div>
    </SectionAtelier>
  )
}
