import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bouton } from '@/components/ui/Bouton'
import { EtatVide } from '@/components/ui/EtatVide'
import { ChampTexte, ChampZone } from '@/components/ui/Formulaire'
import { Modale } from '@/components/ui/Modale'
import { Onglets } from '@/components/ui/Onglets'
import { useToast } from '@/store/toastContext'
import { BarreDevis } from './BarreDevis'
import { BlocTotaux } from './BlocTotaux'
import { EditeurLignes } from './EditeurLignes'
import { ModaleEnvoi } from './ModaleEnvoi'
import { PanneauApercu } from './PanneauApercu'
import {
  DUREES_VALIDITE,
  LIBELLES_STATUT_DEVIS,
  dateFinValidite,
  magasinDevis,
  magasinModeles,
  modeleParDefaut,
  aujourdhuiIso,
  copierDevis,
  type Devis,
  type ModeleDevis,
} from './donnees'
import './espace-devis.css'

const DELAI_ENREGISTREMENT_MS = 800
const CLE_LARGEUR = 'senova.espaceDevis.largeurApercu'
const LARGEUR_MIN = 360
const LARGEUR_MAX = 900
const PART_DEFAUT = 0.4
const PART_MAX = 0.6
const PAS_CLAVIER = 24

const ONGLETS = [
  { id: 'edition', libelle: 'Édition' },
  { id: 'apercu', libelle: 'Aperçu' },
] as const
type OngletEspace = (typeof ONGLETS)[number]['id']

function lireLargeur(): number | null {
  try {
    const n = Number(window.localStorage.getItem(CLE_LARGEUR))
    return n >= LARGEUR_MIN && n <= LARGEUR_MAX ? n : null
  } catch {
    return null
  }
}

function tempsRelatif(iso: string, maintenant: number): string {
  const minutes = Math.floor((maintenant - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  if (minutes < 1440) return `il y a ${Math.floor(minutes / 60)} h`
  if (minutes < 10080) return `il y a ${Math.floor(minutes / 1440)} j`
  return `le ${new Date(iso).toLocaleDateString('fr-FR')}`
}

export function PageEspaceDevis() {
  const { id } = useParams()
  const liste = magasinDevis.useListe()
  const devis = liste.find((d) => d.id === id)
  if (!devis) {
    return (
      <EtatVide
        icone="devis"
        titre="Devis introuvable"
        texte="Ce devis n’existe pas ou a été supprimé."
        action={
          <Link to="/devis" className="btn btn--secondaire">
            Retour aux devis
          </Link>
        }
      />
    )
  }
  return <EspaceDevis key={devis.id} initial={devis} />
}

function EspaceDevis({ initial }: { initial: Devis }) {
  const navigate = useNavigate()
  const { notifier } = useToast()
  const modeles = magasinModeles.useListe()

  const [devis, setDevis] = useState(initial)
  const [enCours, setEnCours] = useState(false)
  const [maintenant, setMaintenant] = useState(() => Date.now())
  const [onglet, setOnglet] = useState<OngletEspace>('edition')
  const [largeurChoisie, setLargeur] = useState(lireLargeur)
  const [largeurCorps, setLargeurCorps] = useState(0)
  const [envoi, setEnvoi] = useState(false)
  const [pleinEcran, setPleinEcran] = useState(false)
  const [corps, setCorps] = useState<HTMLDivElement | null>(null)
  const dernier = useRef(initial)
  const minuteur = useRef<number | undefined>(undefined)

  const modele = modeles.find((m) => m.id === devis.modeleId) ?? modeleParDefaut(modeles)
  const lectureSeule = ['accepte', 'refuse', 'expire'].includes(devis.statut)

  useEffect(() => {
    if (!corps || typeof ResizeObserver === 'undefined') return undefined
    const lire = () => setLargeurCorps(corps.clientWidth)
    lire()
    const obs = new ResizeObserver(lire)
    obs.observe(corps)
    return () => obs.disconnect()
  }, [corps])

  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(Date.now()), 30000)
    return () => window.clearInterval(t)
  }, [])

  // Quitter l'écran écrit ce qui attend encore.
  useEffect(
    () => () => {
      if (minuteur.current === undefined) return
      window.clearTimeout(minuteur.current)
      magasinDevis.enregistrer({ ...dernier.current, majLe: new Date().toISOString() })
    },
    [],
  )

  const ecrire = () => {
    window.clearTimeout(minuteur.current)
    minuteur.current = undefined
    const enregistre = { ...dernier.current, majLe: new Date().toISOString() }
    dernier.current = enregistre
    magasinDevis.enregistrer(enregistre)
    setDevis(enregistre)
    setMaintenant(Date.now())
    setEnCours(false)
  }

  const modifier = (patch: Partial<Devis> | ((d: Devis) => Partial<Devis>)) => {
    const suivant = {
      ...dernier.current,
      ...(typeof patch === 'function' ? patch(dernier.current) : patch),
    }
    dernier.current = suivant
    setDevis(suivant)
    setEnCours(true)
    window.clearTimeout(minuteur.current)
    minuteur.current = window.setTimeout(ecrire, DELAI_ENREGISTREMENT_MS)
  }

  const dupliquer = () => {
    if (minuteur.current !== undefined) ecrire()
    const copie = copierDevis(dernier.current, magasinDevis.lire())
    magasinDevis.enregistrer(copie)
    notifier('Devis dupliqué', { message: `${copie.numero} est prêt à être modifié.` })
    navigate(`/devis/${copie.id}`)
  }

  const changerStatut = (statut: 'accepte' | 'refuse') => {
    modifier({ statut })
    ecrire()
    notifier(`Devis marqué ${LIBELLES_STATUT_DEVIS[statut].toLowerCase()}`)
  }

  const envoyer = (destinataire: string) => {
    modifier({ statut: 'envoye', envoyeLe: aujourdhuiIso(), clientEmail: destinataire })
    ecrire()
    setEnvoi(false)
    notifier('Devis envoyé', { message: `Envoyé à ${destinataire}.` })
  }

  const sauvegarde = enCours
    ? 'Enregistrement…'
    : `Enregistré ${tempsRelatif(devis.majLe, maintenant)}`

  // ----- séparateur -----
  const maxPossible = Math.max(
    LARGEUR_MIN,
    Math.min(LARGEUR_MAX, Math.floor((largeurCorps || 2000) * PART_MAX)),
  )
  const borner = (n: number) => Math.min(maxPossible, Math.max(LARGEUR_MIN, Math.round(n)))
  const largeur = borner(largeurChoisie ?? (largeurCorps || 1000) * PART_DEFAUT)
  const definirLargeur = (n: number) => {
    const valeur = borner(n)
    setLargeur(valeur)
    try {
      window.localStorage.setItem(CLE_LARGEUR, String(valeur))
    } catch {
      /* stockage indisponible : la largeur ne sera simplement pas mémorisée */
    }
  }
  const surGlisse = (ev: PointerEvent<HTMLDivElement>) => {
    if (!ev.currentTarget.hasPointerCapture(ev.pointerId) || !corps) return
    definirLargeur(corps.getBoundingClientRect().right - ev.clientX)
  }
  const surClavier = (ev: KeyboardEvent<HTMLDivElement>) => {
    const pas = ev.shiftKey ? PAS_CLAVIER * 4 : PAS_CLAVIER
    const cible =
      ev.key === 'ArrowLeft'
        ? largeur + pas
        : ev.key === 'ArrowRight'
          ? largeur - pas
          : ev.key === 'Home'
            ? LARGEUR_MIN
            : ev.key === 'End'
              ? maxPossible
              : null
    if (cible === null) return
    ev.preventDefault()
    definirLargeur(cible)
  }

  return (
    <div className="espace">
      <BarreDevis
        devis={devis}
        modeles={modeles}
        lectureSeule={lectureSeule}
        sauvegarde={sauvegarde}
        onApercu={() => setPleinEcran(true)}
        onTelecharger={() => window.print()}
        onEnvoyer={() => setEnvoi(true)}
        onDupliquer={dupliquer}
        onModele={(modeleId) => modifier({ modeleId })}
        onStatut={changerStatut}
      />

      {lectureSeule ? (
        <div className="espace-bandeau" role="note">
          <p>
            Ce devis est {LIBELLES_STATUT_DEVIS[devis.statut].toLowerCase()} : il n’est plus
            modifiable. Dupliquez-le pour en créer une nouvelle version.
          </p>
          <Bouton taille="sm" icone="copier" onClick={dupliquer}>
            Dupliquer pour modifier
          </Bouton>
        </div>
      ) : null}

      <div className="espace-onglets">
        <Onglets
          onglets={ONGLETS}
          actif={onglet}
          onChoisir={(i) => setOnglet(i as OngletEspace)}
          libelle="Affichage du devis"
          prefixe="espace"
        />
      </div>

      <div
        className="espace-corps"
        data-onglet={onglet}
        ref={setCorps}
        id="espace-panneau"
        role="tabpanel"
        aria-labelledby={`espace-onglet-${onglet}`}
        style={
          {
            '--espace-apercu': largeurChoisie === null ? '40%' : `${largeur}px`,
          } as React.CSSProperties
        }
      >
        <fieldset className="espace-edition" disabled={lectureSeule}>
          <legend className="sr-only">Édition du devis</legend>

          <section className="espace-bloc" aria-labelledby="espace-client">
            <h2 className="espace-bloc__titre" id="espace-client">
              Client
            </h2>
            <div className="espace-grille">
              <ChampTexte
                libelle="Nom du client"
                value={devis.clientNom}
                onChange={(ev) => modifier({ clientNom: ev.target.value })}
              />
              <ChampTexte
                libelle="E-mail"
                type="email"
                value={devis.clientEmail ?? ''}
                onChange={(ev) => modifier({ clientEmail: ev.target.value })}
              />
              <div className="espace-grille__pleine">
                <ChampZone
                  libelle="Adresse"
                  rows={2}
                  value={devis.clientAdresse}
                  onChange={(ev) => modifier({ clientAdresse: ev.target.value })}
                />
              </div>
              <div className="espace-grille__pleine">
                <ChampTexte
                  libelle="Objet du devis"
                  value={devis.objet}
                  onChange={(ev) => modifier({ objet: ev.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="espace-bloc" aria-labelledby="espace-lignes">
            <h2 className="espace-bloc__titre" id="espace-lignes">
              Lignes
            </h2>
            <EditeurLignes
              lignes={devis.lignes}
              onChange={(maj) => modifier((d) => ({ lignes: maj(d.lignes) }))}
              afficherRemise={
                modele.afficher.remiseParLigne || devis.lignes.some((l) => l.remisePourcent > 0)
              }
            />
          </section>

          <BlocTotaux devis={devis} onChange={modifier} />

          <section className="espace-bloc" aria-labelledby="espace-conditions">
            <h2 className="espace-bloc__titre" id="espace-conditions">
              Conditions
            </h2>
            <div className="espace-validite">
              <span className="champ__libelle" id="espace-validite-libelle">
                Validité
              </span>
              <div role="group" aria-labelledby="espace-validite-libelle" className="espace-puces">
                {DUREES_VALIDITE.map((j) => (
                  <button
                    key={j}
                    type="button"
                    className="espace-puce"
                    aria-pressed={devis.validiteJours === j}
                    onClick={() => modifier({ validiteJours: j })}
                  >
                    {j} jours
                  </button>
                ))}
              </div>
              <span className="espace-validite__fin">
                Valable jusqu’au{' '}
                {new Date(`${dateFinValidite(devis)}T12:00:00`).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="espace-grille espace-grille--haut">
              <ChampZone
                libelle="Conditions de paiement"
                rows={3}
                value={devis.conditions}
                onChange={(ev) => modifier({ conditions: ev.target.value })}
              />
              <ChampZone
                libelle="Notes internes"
                aide="Non imprimées sur le devis."
                rows={3}
                value={devis.notes}
                onChange={(ev) => modifier({ notes: ev.target.value })}
              />
            </div>
          </section>
        </fieldset>

        <div
          className="espace-separateur"
          role="separator"
          aria-orientation="vertical"
          aria-label="Largeur de l’aperçu"
          aria-valuenow={largeur}
          aria-valuemin={LARGEUR_MIN}
          aria-valuemax={maxPossible}
          tabIndex={0}
          onKeyDown={surClavier}
          onPointerDown={(ev) => ev.currentTarget.setPointerCapture(ev.pointerId)}
          onPointerMove={surGlisse}
        />

        <div className="espace-apercu">
          <PanneauApercu devis={devis} modele={modele} imprimable />
        </div>
      </div>

      <ModaleEnvoi
        ouvert={envoi}
        devis={devis}
        onFermer={() => setEnvoi(false)}
        onEnvoyer={({ destinataire }) => envoyer(destinataire)}
      />

      {pleinEcran ? (
        <ApercuPleinEcran devis={devis} modele={modele} onFermer={() => setPleinEcran(false)} />
      ) : null}
    </div>
  )
}

function ApercuPleinEcran({
  devis,
  modele,
  onFermer,
}: {
  devis: Devis
  modele: ModeleDevis
  onFermer(): void
}) {
  return (
    <Modale ouvert onFermer={onFermer} titre="Aperçu du devis" soustitre={devis.numero}>
      <div className="espace-plein">
        <PanneauApercu devis={devis} modele={modele} />
      </div>
    </Modale>
  )
}
