import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Organisation } from '@shared/session'
import { Atelier, PiedAtelier } from '@/ui/Atelier'
import { allerASection } from '@/ui/AtelierFonctions'
import { Bouton } from '@/ui/Bouton'
import { Dialogue } from '@/ui/Dialogue'
import { EntetePage } from '@/ui/EntetePage'
import { GardeModifications } from '@/ui/GardeModifications'
import { Icone } from '@/ui/Icone'
import { useToast } from '@/store/toastContext'
import { useSession } from '@/store/sessionContext'
import { apiCharte, apiReglagesDocuments, REGLAGES_PAR_DEFAUT, useCharteAppliquee, useReglagesDocuments } from '../api'
import { CHARTE_PAR_DEFAUT, type ZoneDocument } from '../rendu'
import { ApercuApparence } from './ApercuApparence'
import { FormulaireApparence } from './FormulaireApparence'
import { egal } from './egalite'
import { calculerProgression } from './progression'
import { adresseImprimee, documentApercu, prerempliDepuisOrganisation } from './reglages'
import { SECTION_PAR_ZONE, type IdSection } from './sections'
import type { Brouillon } from './types'
import { useHistorique } from './useHistorique'
import { useValeurRetardee } from './useValeurRetardee'
import './apparence.css'

const FIL_ARIANE = [{ libelle: 'Catalogue', vers: '/articles' }, { libelle: 'Documents', vers: '/documents' }, { libelle: 'Apparence' }] as const

export function PageApparence() {
  const { session } = useSession()
  return session ? <Apparence organisation={session.organisation} /> : null
}

function Apparence({ organisation }: { organisation: Organisation }) {
  const { notifier } = useToast()
  const charteAppliquee = useCharteAppliquee()
  const reglagesAppliques = useReglagesDocuments()
  // Le brouillon est local : distinct de la charte appliquée tant qu'on n'a pas appliqué.
  const [depart] = useState<Brouillon>(() => ({
    charte: charteAppliquee,
    reglages: prerempliDepuisOrganisation(organisation, reglagesAppliques),
  }))
  const historique = useHistorique<Brouillon>(depart)
  const brouillon = historique.valeur
  const [appliquee, setAppliquee] = useState<Brouillon>(depart)
  const [enCours, setEnCours] = useState(false)
  const [confirmerReinit, setConfirmerReinit] = useState(false)
  const [volet, setVolet] = useState<'modification' | 'apercu'>('modification')

  const modifie = !egal(brouillon, appliquee)
  const charteDiffere = useDeferredValue(brouillon.charte)
  // Miniatures : document et charte stables pendant un glissé ou une frappe (la charte suit 300 ms après le dernier geste).
  const charteVignettes = useValeurRetardee(brouillon.charte, 300)
  const exempleVignettes = useMemo(() => documentApercu('devis', organisation, REGLAGES_PAR_DEFAUT), [organisation])
  const adresse = adresseImprimee(organisation)
  const progression = useMemo(() => calculerProgression(brouillon.charte, brouillon.reglages, adresse), [brouillon, adresse])

  const { modifier } = historique
  const onCharte = useCallback(
    (patch: Partial<Brouillon['charte']>, cle?: string) => modifier((b) => ({ ...b, charte: { ...b.charte, ...patch } }), cle),
    [modifier],
  )
  const onReglages = useCallback(
    (patch: Partial<Brouillon['reglages']>, cle?: string) => modifier((b) => ({ ...b, reglages: { ...b.reglages, ...patch } }), cle),
    [modifier],
  )

  const aller = (section: IdSection) => {
    setVolet('modification')
    allerASection(section)
  }

  const reinitialiser = () => {
    // Les mentions légales sont conservées ; textes et charte reviennent au modèle par défaut.
    historique.remplacer({ charte: CHARTE_PAR_DEFAUT, reglages: { ...REGLAGES_PAR_DEFAUT, mentions: brouillon.reglages.mentions } })
    setConfirmerReinit(false)
    notifier('Modèle par défaut rétabli', { message: 'Vos informations légales sont conservées. Vous pouvez annuler.' })
  }

  const appliquer = async () => {
    setEnCours(true)
    try {
      // shortcut: deux appels successifs (échec possible entre les deux) ; un seul PUT /api/organisation/documents au branchement.
      await apiCharte.appliquer(brouillon.charte)
      await apiReglagesDocuments.appliquer(brouillon.reglages)
      setAppliquee(brouillon)
      notifier('Apparence appliquée à vos devis, factures et avoirs', {
        ton: 'succes',
        message: apiCharte.demo ? 'Pour cette session seulement : elle n’est pas encore sauvegardée sur le serveur.' : undefined,
      })
    } catch {
      notifier('L’apparence n’a pas pu être appliquée', { ton: 'alerte', message: 'Réessayez dans un instant.' })
    } finally {
      setEnCours(false)
    }
  }

  const statut = modifie ? 'Modifications non appliquées' : apiCharte.demo ? 'Appliquée pour cette session (démo)' : 'Apparence appliquée à vos documents'

  return (
    <>
      <Atelier
        volet={volet}
        onVolet={setVolet}
        entete={
          <EntetePage
            titre="Apparence des documents"
            sousTitre="Devis, factures et avoirs à vos couleurs."
            filAriane={FIL_ARIANE}
            actions={
              <Link to="/documents" className="btn btn--secondary">
                <Icone nom="retour" taille={18} />
                Retour aux documents
              </Link>
            }
          />
        }
        formulaire={
          <FormulaireApparence
            charte={brouillon.charte}
            vignettes={charteVignettes}
            reglages={brouillon.reglages}
            exemple={exempleVignettes}
            progression={progression}
            nomEntreprise={organisation.nom}
            adresse={adresse}
            complement={organisation.formeJuridique ?? undefined}
            onCharte={onCharte}
            onReglages={onReglages}
            onAller={aller}
            onClore={historique.clore}
          />
        }
        apercu={
          <ApercuApparence
            charte={charteDiffere}
            reglages={brouillon.reglages}
            organisation={organisation}
            onCibler={(zone: ZoneDocument) => aller(SECTION_PAR_ZONE[zone])}
          />
        }
        pied={
          <PiedAtelier statut={statut} ton={enCours ? 'en-cours' : modifie ? 'non-enregistre' : 'enregistre'}>
            <Bouton icone="avoirs" onClick={historique.annuler} disabled={!historique.peutAnnuler}>Annuler la dernière modification</Bouton>
            <Bouton icone="restaurer" onClick={() => setConfirmerReinit(true)}>Revenir au modèle par défaut</Bouton>
            <Bouton variante="primaire" icone="valider" onClick={() => void appliquer()} disabled={!modifie || enCours}>Appliquer à tous mes documents</Bouton>
          </PiedAtelier>
        }
      />
      <Dialogue
        ouvert={confirmerReinit}
        onFermer={() => setConfirmerReinit(false)}
        titre="Revenir au modèle par défaut ?"
        pied={
          <>
            <Bouton onClick={() => setConfirmerReinit(false)}>Garder mon apparence</Bouton>
            <Bouton variante="danger" onClick={reinitialiser}>Revenir au modèle par défaut</Bouton>
          </>
        }
      >
        <p>Couleurs, logo, modèle, police et textes reviennent aux réglages d’origine. Vos informations légales sont conservées, et vous pourrez annuler.</p>
      </Dialogue>
      <GardeModifications actif={modifie} message="Votre apparence n’a pas été appliquée à vos documents." />
    </>
  )
}
