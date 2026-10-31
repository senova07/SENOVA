import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Bouton } from '@/components/ui/Bouton'
import { Carte } from '@/components/ui/Carte'
import { EtatVide } from '@/components/ui/EtatVide'
import { ChampTexte } from '@/components/ui/Formulaire'
import { Icone } from '@/components/ui/Icone'
import { Modale } from '@/components/ui/Modale'
import { Onglets } from '@/components/ui/Onglets'
import { magasinDevis } from '@/features/devis/donnees'
import { useMenu } from '@/hooks/useMenu'
import { formaterEuro } from '@/lib/format'
import { apiClients } from '@/services/clientsApi'
import { ErreurApi } from '@/services/http'
import { useSession } from '@/store/sessionContext'
import { useToast } from '@/store/toastContext'
import { nomAffichageClient, type Client } from '@shared/clients'
import { documentsClient } from './documentsClient'
import { BadgeNature, ListeTags } from './ElementsClient'
import { ModaleClient } from './ModaleClient'
import { DevisClient, DocumentsClient, FacturesClient, HistoriqueClient } from './PiecesClient'
import './clients.css'

const ONGLETS = [
  { id: 'apercu', libelle: 'Vue d’ensemble' },
  { id: 'historique', libelle: 'Historique' },
  { id: 'devis', libelle: 'Devis' },
  { id: 'factures', libelle: 'Factures' },
  { id: 'documents', libelle: 'Documents' },
] as const
type OngletFiche = (typeof ONGLETS)[number]['id']

type Dialogue = 'modifier' | 'archiver' | 'supprimer' | null

interface Resultat {
  id: string
  client?: Client
  erreur?: ErreurApi | Error
}

const dateFr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR')

function Champ({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="fiche__champ">
      <dt>{libelle}</dt>
      <dd>{children}</dd>
    </div>
  )
}

interface MenuFicheProps {
  archive: boolean
  enCours: boolean
  onArchiver(): void
  onRestaurer(): void
  onSupprimer(): void
}

function MenuFiche({ archive, enCours, onArchiver, onRestaurer, onSupprimer }: MenuFicheProps) {
  const { ouvert, ancre, basculer, fermer } = useMenu()
  const agir = (action: () => void) => () => {
    fermer()
    action()
  }
  return (
    <div className="menu" ref={ancre}>
      <button
        type="button"
        className="btn btn--secondaire btn--icone"
        aria-label="Autres actions"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        onClick={basculer}
      >
        <Icone nom="actions" taille={20} poids="bold" />
      </button>
      {ouvert ? (
        <div className="menu__liste" role="menu" aria-label="Autres actions">
          {archive ? (
            <button
              type="button"
              role="menuitem"
              className="menu__item"
              disabled={enCours}
              onClick={agir(onRestaurer)}
            >
              <Icone nom="restaurer" taille={18} />
              Restaurer
            </button>
          ) : (
            <button type="button" role="menuitem" className="menu__item" onClick={agir(onArchiver)}>
              <Icone nom="archive" taille={18} />
              Archiver
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="menu__item menu__item--danger"
            onClick={agir(onSupprimer)}
          >
            <Icone nom="poubelle" taille={18} />
            Supprimer
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function PageFicheClient() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { peut } = useSession()
  const { notifier } = useToast()
  const peutGerer = peut('clients.gerer')
  const tousLesDevis = magasinDevis.useListe()

  const [resultat, setResultat] = useState<Resultat | null>(null)
  const [onglet, setOnglet] = useState<OngletFiche>('apercu')
  const [dialogue, setDialogue] = useState<Dialogue>(null)
  const [motif, setMotif] = useState('')
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    let annule = false
    apiClients.lire(id).then(
      (client) => !annule && setResultat({ id, client }),
      (e: unknown) =>
        !annule && setResultat({ id, erreur: e instanceof Error ? e : new Error('Erreur') }),
    )
    return () => {
      annule = true
    }
  }, [id])

  const courant = resultat?.id === id ? resultat : null
  const client = courant?.client

  if (!courant) {
    return (
      <p className="clients__chargement" role="status">
        Chargement de la fiche…
      </p>
    )
  }
  if (!client) {
    const introuvable = courant.erreur instanceof ErreurApi && courant.erreur.introuvable
    return (
      <EtatVide
        icone="clients"
        titre={introuvable ? 'Client introuvable' : 'Fiche indisponible'}
        texte={
          introuvable
            ? 'Ce client n’existe pas ou a été supprimé.'
            : (courant.erreur?.message ?? 'Chargement impossible.')
        }
        action={
          <Link to="/clients" className="btn btn--primaire">
            Retour aux clients
          </Link>
        }
      />
    )
  }

  const nom = nomAffichageClient(client)
  const archive = client.archiveLe !== null
  const adresses = client.adresses ?? []
  const contacts = client.contacts ?? []
  const { devis, factures, totaux } = documentsClient(client, tousLesDevis)
  const chiffres = [
    { libelle: 'Total devisé', valeur: totaux.devise },
    { libelle: 'Facturé', valeur: totaux.facture },
    { libelle: 'Encaissé', valeur: totaux.encaisse },
    { libelle: 'Reste dû', valeur: totaux.resteDu, du: totaux.resteDu > 0 },
  ]

  const fermer = () => setDialogue(null)
  const action = async (travail: () => Promise<void>) => {
    setEnCours(true)
    try {
      await travail()
    } catch (e) {
      notifier('Action impossible', {
        message: e instanceof Error ? e.message : undefined,
        ton: 'alerte',
      })
    } finally {
      setEnCours(false)
    }
  }
  // PUT, archivage et restauration renvoient la fiche complète.
  const fusionner = (fiche: Client) => setResultat({ id, client: fiche })

  const archiver = () =>
    action(async () => {
      fusionner(await apiClients.archiver(client.id, motif.trim() || null))
      fermer()
      setMotif('')
      notifier('Client archivé', { message: nom, ton: 'succes' })
    })
  const restaurer = () =>
    action(async () => {
      fusionner(await apiClients.restaurer(client.id))
      notifier('Client restauré', { message: nom, ton: 'succes' })
    })
  const supprimer = () =>
    action(async () => {
      await apiClients.supprimer(client.id)
      notifier('Client supprimé', { message: nom, ton: 'succes' })
      navigate('/clients')
    })

  return (
    <>
      <Link to="/clients" className="fiche__retour">
        <Icone nom="retour" taille={16} />
        Tous les clients
      </Link>

      <header className="fiche__tete">
        <div className="fiche__identite">
          <h1 className="fiche__nom">{nom}</h1>
          <div className="fiche__badges">
            <BadgeNature nature={client.nature} />
            {archive ? <Badge ton="alerte">Archivé le {dateFr(client.archiveLe!)}</Badge> : null}
          </div>
          <ListeTags tags={client.tags} />
          <ul className="fiche__coordonnees">
            {client.telephone ? (
              <li>
                <Icone nom="telephone" taille={18} />
                <a href={`tel:${client.telephone}`}>{client.telephone}</a>
              </li>
            ) : null}
            {client.email ? (
              <li>
                <Icone nom="courriel" taille={18} />
                <a href={`mailto:${client.email}`}>{client.email}</a>
              </li>
            ) : null}
          </ul>
          {archive && client.archiveMotif ? (
            <p className="fiche__motif">Motif d’archivage : {client.archiveMotif}</p>
          ) : null}
        </div>
        <div className="fiche__actions">
          {peutGerer ? (
            <Bouton icone="crayon" onClick={() => setDialogue('modifier')}>
              Modifier
            </Bouton>
          ) : null}
          <Link to={`/devis?nouveau=1&client=${client.id}`} className="btn btn--primaire">
            <Icone nom="devis" taille={18} />
            Nouveau devis
          </Link>
          {peutGerer ? (
            <MenuFiche
              archive={archive}
              enCours={enCours}
              onArchiver={() => setDialogue('archiver')}
              onRestaurer={() => void restaurer()}
              onSupprimer={() => setDialogue('supprimer')}
            />
          ) : null}
        </div>
      </header>

      <dl className="fiche__chiffres">
        {chiffres.map((c) => (
          <div key={c.libelle} className="fiche__chiffre">
            <dt>{c.libelle}</dt>
            <dd className={c.du ? 'fiche__chiffre--du' : undefined}>{formaterEuro(c.valeur)}</dd>
          </div>
        ))}
      </dl>

      <Onglets
        libelle="Sections de la fiche"
        prefixe="fiche"
        onglets={ONGLETS}
        actif={onglet}
        onChoisir={(o) => setOnglet(o)}
      />

      <div role="tabpanel" id="fiche-panneau" aria-labelledby={`fiche-onglet-${onglet}`}>
        {onglet === 'historique' ? (
          <HistoriqueClient devis={devis} factures={factures} />
        ) : onglet === 'devis' ? (
          <DevisClient devis={devis} />
        ) : onglet === 'factures' ? (
          <FacturesClient factures={factures} />
        ) : onglet === 'documents' ? (
          <DocumentsClient />
        ) : (
          <div className="fiche__grille">
            {client.nature === 'entreprise' ? (
              <Carte>
                <h2 className="section-titre">Entreprise</h2>
                <dl className="fiche__liste">
                  <Champ libelle="SIREN">{client.siren ?? '—'}</Champ>
                  <Champ libelle="SIRET">{client.siret ?? '—'}</Champ>
                  <Champ libelle="TVA intracommunautaire">{client.tvaIntracom ?? '—'}</Champ>
                </dl>
              </Carte>
            ) : null}

            <Carte>
              <h2 className="section-titre">Adresses</h2>
              {adresses.length === 0 ? (
                <p className="client-vide">Aucune adresse enregistrée.</p>
              ) : (
                <ul className="fiche__blocs">
                  {adresses.map((a) => (
                    <li key={a.id}>
                      <p className="fiche__bloc-titre">
                        {a.libelle}
                        {a.parDefaut ? <Badge ton="info">Par défaut</Badge> : null}
                      </p>
                      <address>
                        {a.ligne1}
                        {a.ligne2 ? <br /> : null}
                        {a.ligne2}
                        <br />
                        {a.codePostal} {a.ville}
                        {a.pays && a.pays !== 'FR' ? ` (${a.pays})` : ''}
                      </address>
                    </li>
                  ))}
                </ul>
              )}
            </Carte>

            <Carte>
              <h2 className="section-titre">Contacts</h2>
              {contacts.length === 0 ? (
                <p className="client-vide">Aucun contact secondaire.</p>
              ) : (
                <ul className="fiche__blocs">
                  {contacts.map((c) => (
                    <li key={c.id}>
                      <p className="fiche__bloc-titre">
                        {c.nom}
                        {c.role ? <span className="client-vide"> · {c.role}</span> : null}
                      </p>
                      {c.telephone ? (
                        <p>
                          <a href={`tel:${c.telephone}`}>{c.telephone}</a>
                        </p>
                      ) : null}
                      {c.email ? (
                        <p>
                          <a href={`mailto:${c.email}`}>{c.email}</a>
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Carte>

            <Carte>
              <h2 className="section-titre">Notes internes</h2>
              {client.notes ? (
                <p className="fiche__notes">{client.notes}</p>
              ) : (
                <p className="client-vide">Aucune note.</p>
              )}
            </Carte>
          </div>
        )}
      </div>

      {dialogue === 'modifier' ? (
        <ModaleClient
          client={client}
          onFermer={fermer}
          onEnregistre={(fiche) => {
            fermer()
            fusionner(fiche)
          }}
        />
      ) : null}

      <Modale
        ouvert={dialogue === 'archiver'}
        onFermer={fermer}
        titre="Archiver ce client"
        soustitre={`${nom} quittera la liste des clients actifs. Vous pourrez le restaurer.`}
        pied={
          <>
            <Bouton onClick={fermer}>Annuler</Bouton>
            <Bouton variante="primaire" onClick={archiver} disabled={enCours}>
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

      <Modale
        ouvert={dialogue === 'supprimer'}
        onFermer={fermer}
        titre="Supprimer ce client"
        soustitre="Cette action est définitive."
        pied={
          <>
            <Bouton onClick={fermer}>Annuler</Bouton>
            <Bouton variante="danger" onClick={supprimer} disabled={enCours}>
              Supprimer définitivement
            </Bouton>
          </>
        }
      >
        <p>
          Supprimer <strong>{nom}</strong> effacera aussi ses adresses et ses contacts. Pour le
          garder sans qu’il encombre la liste, archivez-le plutôt.
        </p>
      </Modale>
    </>
  )
}
