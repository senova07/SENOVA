import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '@/features/articles/articles.css'
import { Bouton } from '@/components/ui/Bouton'
import { Carte } from '@/components/ui/Carte'
import { EtatVide } from '@/components/ui/EtatVide'
import { ChampTexte } from '@/components/ui/Formulaire'
import { Icone } from '@/components/ui/Icone'
import { MenuDeroulant } from '@/components/ui/MenuDeroulant'
import { Modale } from '@/components/ui/Modale'
import { Onglets } from '@/components/ui/Onglets'
import { Pagination } from '@/components/ui/Pagination'
import { apiClients } from '@/services/clientsApi'
import { useSession } from '@/store/sessionContext'
import { useToast } from '@/store/toastContext'
import { nomAffichageClient, type Client } from '@shared/clients'
import { sansAccent } from '@/features/devis/donnees'
import { resteDuClient } from './documentsClient'
import {
  COLONNES_CLIENT,
  type CleTriClient,
  type ColonneClient,
  type TriClient,
} from './colonnesClient'
import { ListeClients } from './ListeClients'
import { ModaleClient } from './ModaleClient'
import { useListeClients } from './useListeClients'
import './clients.css'

const PAR_PAGE = 12
const ONGLETS = [
  { id: 'tous', libelle: 'Tous' },
  { id: 'particuliers', libelle: 'Particuliers' },
  { id: 'professionnels', libelle: 'Professionnels' },
  { id: 'archives', libelle: 'Archivés' },
] as const
type OngletClients = (typeof ONGLETS)[number]['id']

const NATURE_ONGLET = { particuliers: 'particulier', professionnels: 'entreprise' } as const

const comparerTexte = new Intl.Collator('fr', { sensitivity: 'base', numeric: true }).compare

/** `client` nul = création ; `archiver` ouvre la confirmation avec motif. */
type Dialogue = { genre: 'client'; client: Client | null } | { genre: 'archiver'; client: Client }

export function PageClients() {
  const { peut } = useSession()
  const { notifier } = useToast()
  const navigate = useNavigate()
  const peutGerer = peut('clients.gerer')
  const [parametres, setParametres] = useSearchParams()

  const [saisie, setSaisie] = useState('')
  const [terme, setTerme] = useState('')
  const [tag, setTag] = useState('')
  const [soldeDu, setSoldeDu] = useState(false)
  const [tri, setTri] = useState<TriClient | null>(null)
  const [numero, setNumero] = useState(1)
  const [colonnes, setColonnes] = useState<ReadonlySet<ColonneClient>>(
    new Set(COLONNES_CLIENT.map((c) => c.id)),
  )
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)
  const [motif, setMotif] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [version, setVersion] = useState(0)

  /** Modifie un paramètre d'URL sans toucher aux autres (`null` le retire). */
  const changerParametre = (cle: string, valeur: string | null, remplacer = false) =>
    setParametres(
      (actuels) => {
        const suite = new URLSearchParams(actuels)
        if (valeur === null) suite.delete(cle)
        else suite.set(cle, valeur)
        return suite
      },
      { replace: remplacer },
    )

  const ongletDemande = parametres.get('onglet')
  const onglet: OngletClients = ONGLETS.find((o) => o.id === ongletDemande)?.id ?? 'tous'
  const ongletCourant = ONGLETS.find((o) => o.id === onglet)!
  const archives = onglet === 'archives'

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
    if (peutGerer) setDialogue({ genre: 'client', client: null })
  }, [demandeCreation, peutGerer, setParametres])

  useEffect(() => {
    const minuteur = window.setTimeout(() => {
      setTerme(saisie.trim())
      setNumero(1)
    }, 300)
    return () => window.clearTimeout(minuteur)
  }, [saisie])

  // Ensemble « actifs sans recherche » : source des chiffres de l'en-tête et de la liste par défaut.
  const base = useListeClients(true, '', false, version)
  const vue = useListeClients(archives || Boolean(terme), terme, archives, version)
  const source = archives || terme ? vue : base
  const tousActifs = base.clients

  const stats = tousActifs
    ? [
        { valeur: tousActifs.length, libelle: 'Clients' },
        { valeur: tousActifs.filter((c) => c.nature === 'entreprise').length, libelle: 'Pros' },
        {
          valeur: tousActifs.filter((c) => {
            const d = new Date(c.createdAt)
            const n = new Date()
            return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
          }).length,
          libelle: 'Nouveaux ce mois',
        },
      ]
    : null

  const natureOnglet = onglet === 'tous' || archives ? null : NATURE_ONGLET[onglet]
  const tagsConnus = [...new Set((source.clients ?? []).flatMap((c) => c.tags))].sort(comparerTexte)
  const tagValide = tagsConnus.includes(tag) ? tag : ''
  const visibles = (source.clients ?? []).filter(
    (c) =>
      (!natureOnglet || c.nature === natureOnglet) &&
      (!tagValide || c.tags.includes(tagValide)) &&
      (!soldeDu || resteDuClient(c) > 0),
  )

  const valeurTri = (c: Client, cle: CleTriClient): string | number =>
    cle === 'nom'
      ? sansAccent(nomAffichageClient(c))
      : cle === 'contact'
        ? (c.email ?? c.telephone ?? '')
        : resteDuClient(c)
  const tries = tri
    ? [...visibles].sort((a, b) => {
        const va = valeurTri(a, tri.cle)
        const vb = valeurTri(b, tri.cle)
        const ecart =
          typeof va === 'number' && typeof vb === 'number'
            ? va - vb
            : comparerTexte(String(va), String(vb))
        return tri.sens === 'asc' ? ecart : -ecart
      })
    : visibles

  const pages = Math.max(1, Math.ceil(tries.length / PAR_PAGE))
  const page = Math.min(numero, pages)
  const debut = (page - 1) * PAR_PAGE
  const affichees = tries.slice(debut, debut + PAR_PAGE)
  const nbFiltres = [tagValide, soldeDu].filter(Boolean).length
  const filtre = Boolean(terme || nbFiltres)

  const filtrer =
    <T,>(changer: (v: T) => void) =>
    (v: T) => {
      changer(v)
      setNumero(1)
    }
  const setOnglet = (id: OngletClients) => {
    changerParametre('onglet', id === 'tous' ? null : id)
    setNumero(1)
  }
  // Troisième clic sur la même colonne : retour à l'ordre du serveur (par nom).
  const trier = filtrer((cle: CleTriClient) =>
    setTri((t) =>
      t?.cle !== cle ? { cle, sens: 'asc' } : t.sens === 'asc' ? { cle, sens: 'desc' } : null,
    ),
  )
  const basculerColonne = (c: ColonneClient) =>
    setColonnes((s) => {
      const suite = new Set(s)
      if (!suite.delete(c)) suite.add(c)
      return suite
    })

  const fermer = () => {
    setDialogue(null)
    setMotif('')
  }
  const echec = (e: unknown) =>
    notifier('Action impossible', {
      message: e instanceof Error ? e.message : undefined,
      ton: 'alerte',
    })

  /** La liste n'a ni adresses ni contacts : on charge la fiche complète avant de modifier. */
  const modifier = (c: Client) =>
    apiClients.lire(c.id).then((fiche) => setDialogue({ genre: 'client', client: fiche }), echec)
  const restaurer = (c: Client) =>
    apiClients.restaurer(c.id).then(() => {
      setVersion((v) => v + 1)
      notifier('Client restauré', { message: nomAffichageClient(c), ton: 'succes' })
    }, echec)
  const archiver = async (c: Client) => {
    setEnCours(true)
    try {
      await apiClients.archiver(c.id, motif.trim() || null)
      fermer()
      setVersion((v) => v + 1)
      notifier('Client archivé', { message: nomAffichageClient(c), ton: 'succes' })
    } catch (e) {
      echec(e)
    } finally {
      setEnCours(false)
    }
  }

  const nouveau = peutGerer ? (
    <button
      type="button"
      className="btn btn--primaire"
      onClick={() => setDialogue({ genre: 'client', client: null })}
    >
      <Icone nom="plus" taille={18} className="header__nouveau-plus" />
      Nouveau client
    </button>
  ) : null

  const chargementInitial = !base.clients && !base.erreur
  const aucunClient = tousActifs?.length === 0 && !archives && !terme

  return (
    <>
      <header className="entete-articles">
        <span className="entete-articles__deco" aria-hidden="true" />
        <div className="entete-articles__texte">
          <nav aria-label="Fil d’Ariane" className="ariane">
            <span>Clients</span>
            <Icone nom="suivant" taille={12} />
            <span aria-current="page">
              {onglet === 'tous' ? 'Tous les clients' : ongletCourant.libelle}
            </span>
          </nav>
          <h1 className="entete-articles__titre">Clients</h1>
          <p className="entete-articles__sous">
            Chaque relation commerciale, en un coup d’œil : coordonnées, devis et factures.
          </p>
        </div>
        {stats ? (
          <dl className="stats-articles">
            {stats.map((s) => (
              <div key={s.libelle} className="stats-articles__item">
                <dt>{s.libelle}</dt>
                <dd>{s.valeur}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {nouveau ? <div className="clients-actions">{nouveau}</div> : null}
      </header>

      {base.erreur ? (
        <Carte>
          <p className="alerte-form" role="alert">
            {base.erreur}
          </p>
        </Carte>
      ) : chargementInitial ? (
        <p className="clients__chargement" role="status">
          Chargement des clients…
        </p>
      ) : aucunClient ? (
        <Carte coin>
          <EtatVide
            icone="clients"
            titre="Votre premier client commence ici"
            texte="Ajoutez un client pour retrouver ses coordonnées, ses adresses, ses devis et ses factures."
            action={nouveau}
          />
        </Carte>
      ) : (
        <section className="surface-articles" aria-label="Clients">
          <Onglets
            libelle="Catégories de clients"
            prefixe="clients"
            onglets={ONGLETS}
            actif={onglet}
            onChoisir={setOnglet}
          />

          <div className="outils-articles" role="search">
            <div className="recherche outils-articles__recherche">
              <span className="recherche__icone">
                <Icone nom="recherche" taille={18} />
              </span>
              <input
                className="recherche__saisie"
                type="search"
                placeholder="Nom, e-mail, téléphone, SIRET, ville…"
                aria-label="Rechercher un client"
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
              />
            </div>

            <select
              className="outil outil--select"
              aria-label="Tag"
              value={tagValide}
              onChange={(e) => filtrer(setTag)(e.target.value)}
            >
              <option value="">Tag</option>
              {tagsConnus.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="outil outil--select"
              aria-label="Solde"
              value={soldeDu ? 'du' : ''}
              onChange={(e) => filtrer(setSoldeDu)(e.target.value === 'du')}
            >
              <option value="">Solde</option>
              <option value="du">Avec montant dû</option>
            </select>

            <span className="outils-articles__espace" />

            <MenuDeroulant
              declencheur={({ ouvert, basculer }) => (
                <button
                  type="button"
                  className="outil"
                  aria-haspopup="menu"
                  aria-expanded={ouvert}
                  onClick={basculer}
                >
                  <Icone nom="colonnes" taille={18} />
                  Colonnes
                </button>
              )}
            >
              {() => (
                <div className="menu__liste" role="menu" aria-label="Colonnes affichées">
                  {COLONNES_CLIENT.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={colonnes.has(c.id)}
                      className="menu__item"
                      onClick={() => basculerColonne(c.id)}
                    >
                      <span className="menu__coche">
                        {colonnes.has(c.id) ? <Icone nom="valider" taille={14} /> : null}
                      </span>
                      {c.libelle}
                    </button>
                  ))}
                </div>
              )}
            </MenuDeroulant>
          </div>

          <div
            role="tabpanel"
            id="clients-panneau"
            aria-labelledby={`clients-onglet-${onglet}`}
            aria-busy={source.enCours}
            className={source.enCours ? 'clients__en-cours' : undefined}
          >
            {source.erreur ? (
              <p className="alerte-form" role="alert">
                {source.erreur}
              </p>
            ) : !source.clients ? (
              <p className="clients__chargement" role="status">
                Chargement des clients…
              </p>
            ) : affichees.length === 0 ? (
              <EtatVide
                icone={archives ? 'archive' : filtre ? 'recherche' : 'clients'}
                titre={archives && !filtre ? 'Aucun client archivé' : 'Aucun client trouvé'}
                texte={
                  terme
                    ? `Rien ne correspond à « ${terme} ».`
                    : archives && !filtre
                      ? 'Les clients que vous archivez se retrouvent ici.'
                      : 'Essayez un autre onglet, ou élargissez les filtres.'
                }
              />
            ) : (
              <ListeClients
                clients={affichees}
                colonnes={colonnes}
                tri={tri}
                onTrier={trier}
                peutGerer={peutGerer}
                onModifier={(c) => void modifier(c)}
                onArchiver={(c) => setDialogue({ genre: 'archiver', client: c })}
                onRestaurer={(c) => void restaurer(c)}
              />
            )}
          </div>

          <footer className="pied-articles">
            {tries.length ? (
              <p className="pied-articles__compte" aria-live="polite">
                Affichage {debut + 1} – {debut + affichees.length} sur {tries.length}
              </p>
            ) : null}
            {pages > 1 ? <Pagination page={page} pages={pages} onChoisir={setNumero} /> : null}
          </footer>
        </section>
      )}

      {dialogue?.genre === 'client' ? (
        <ModaleClient
          key={dialogue.client?.id ?? 'nouveau'}
          client={dialogue.client}
          onFermer={fermer}
          onEnregistre={(c) => {
            fermer()
            if (dialogue.client) setVersion((v) => v + 1)
            else navigate(`/clients/${c.id}`)
          }}
        />
      ) : null}

      <Modale
        ouvert={dialogue?.genre === 'archiver'}
        onFermer={fermer}
        titre="Archiver ce client"
        soustitre={
          dialogue?.genre === 'archiver'
            ? `${nomAffichageClient(dialogue.client)} quittera la liste des clients actifs. Vous pourrez le restaurer.`
            : ''
        }
        pied={
          <>
            <Bouton onClick={fermer}>Annuler</Bouton>
            <Bouton
              variante="primaire"
              disabled={enCours}
              onClick={() => dialogue?.genre === 'archiver' && void archiver(dialogue.client)}
            >
              Archiver le client
            </Bouton>
          </>
        }
      >
        <ChampTexte
          libelle="Motif (facultatif)"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          maxLength={255}
        />
      </Modale>
    </>
  )
}
