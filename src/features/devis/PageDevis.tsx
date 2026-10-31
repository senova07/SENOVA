import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bouton } from '@/ui/Bouton'
import { EtatVide } from '@/ui/EtatVide'
import { Icone } from '@/ui/Icone'
import { Dialogue } from '@/ui/Dialogue'
import { Onglets } from '@/ui/Onglets'
import { Pagination } from '@/ui/Pagination'
import { formaterEuro } from '@/lib/format'
import { apiClients } from '@/services/clientsApi'
import { useToast } from '@/store/toastContext'
import { apiDevis } from './api'
import { aujourdhuiIso, dateFinValidite, sansAccent, totauxDevis } from './calculs'
import { champsClient } from './champsClient'
import { ListeDevis, type CleTri, type LigneListe, type Tri } from './ListeDevis'
import { magasinDevis } from './magasin'
import type { Devis, StatutDevis } from './types'
import '../articles/articles.css'
import './liste-devis.css'

const PAR_PAGE = 12

const ONGLETS: readonly { id: string; libelle: string; statuts?: readonly StatutDevis[] }[] = [
  { id: 'tous', libelle: 'Tous' },
  { id: 'brouillons', libelle: 'Brouillons', statuts: ['brouillon'] },
  { id: 'envoyes', libelle: 'Envoyés', statuts: ['envoye'] },
  { id: 'acceptes', libelle: 'Acceptés', statuts: ['accepte'] },
  { id: 'refuses', libelle: 'Refusés', statuts: ['refuse', 'expire'] },
]

const VIDE_PAR_ONGLET: Record<string, { titre: string; texte: string }> = {
  tous: {
    titre: 'Aucun devis pour le moment',
    texte: 'Créez votre premier devis en quelques clics.',
  },
  brouillons: {
    titre: 'Aucun brouillon',
    texte: 'Les devis en cours de rédaction apparaissent ici.',
  },
  envoyes: {
    titre: 'Aucun devis en attente',
    texte: 'Les devis envoyés à vos clients apparaissent ici.',
  },
  acceptes: {
    titre: 'Aucun devis accepté',
    texte: 'Les devis signés par vos clients apparaissent ici.',
  },
  refuses: {
    titre: 'Aucun devis refusé ou expiré',
    texte: 'Bonne nouvelle : rien à relancer de ce côté.',
  },
}

const OPTIONS_TRI: { valeur: string; cle: CleTri; sens: Tri['sens']; libelle: string }[] = [
  { valeur: 'date:desc', cle: 'date', sens: 'desc', libelle: 'Plus récents' },
  { valeur: 'date:asc', cle: 'date', sens: 'asc', libelle: 'Plus anciens' },
  { valeur: 'ttc:desc', cle: 'ttc', sens: 'desc', libelle: 'Montant décroissant' },
  { valeur: 'ttc:asc', cle: 'ttc', sens: 'asc', libelle: 'Montant croissant' },
  { valeur: 'client:asc', cle: 'client', sens: 'asc', libelle: 'Client A–Z' },
  { valeur: 'numero:desc', cle: 'numero', sens: 'desc', libelle: 'Numéro' },
]

const comparerTexte = new Intl.Collator('fr', { sensitivity: 'base', numeric: true }).compare

function valeurTri(l: LigneListe, cle: CleTri): string | number {
  switch (cle) {
    case 'numero':
      return l.devis.numero
    case 'client':
      return l.devis.clientNom
    case 'objet':
      return l.devis.objet
    case 'date':
      return l.devis.dateCreation
    case 'validite':
      return l.fin
    case 'ht':
      return l.totaux.totalHt
    case 'ttc':
      return l.totaux.totalTtc
    case 'statut':
      return l.devis.statut
  }
}

export function PageDevis() {
  const navigate = useNavigate()
  const { notifier } = useToast()
  const tousLesDevis = magasinDevis.useListe()
  const [parametres, setParametres] = useSearchParams()

  const [recherche, setRecherche] = useState('')
  const [periode, setPeriode] = useState('tout')
  const [tri, setTri] = useState<Tri>({ cle: 'date', sens: 'desc' })
  const [numero, setNumero] = useState(1)
  const [aSupprimer, setASupprimer] = useState<Devis | null>(null)

  // « + Nouveau → Devis » de la topbar arrive ici avec ?nouveau=1 ; la ref évite un 2e brouillon en StrictMode.
  const echec = () => notifier('Action impossible', { message: 'Réessayez dans un instant.', ton: 'alerte' })
  const creationFaite = useRef(false)
  const demandeCreation = parametres.has('nouveau')
  const clientId = parametres.get('client')
  useEffect(() => {
    if (!demandeCreation || creationFaite.current) return
    creationFaite.current = true
    const ouvrir = (client?: Partial<Devis>) =>
      apiDevis.creerBrouillon(client).then(
        (d) => navigate(`/devis/${d.id}`, { replace: true }),
        () => notifier('Création impossible', { message: 'Réessayez dans un instant.', ton: 'alerte' }),
      )
    if (!clientId) ouvrir()
    else
      apiClients.lire(clientId).then(
        (c) => ouvrir(champsClient(c)),
        () => ouvrir(),
      )
  }, [demandeCreation, clientId, navigate, notifier])

  const ongletDemande = parametres.get('onglet')
  const onglet = ONGLETS.find((o) => o.id === ongletDemande) ?? ONGLETS[0]!
  const choisirOnglet = (id: string) => {
    setParametres((p) => {
      const suite = new URLSearchParams(p)
      if (id === 'tous') suite.delete('onglet')
      else suite.set('onglet', id)
      return suite
    })
    setNumero(1)
  }

  const auj = aujourdhuiIso()
  const lignes: LigneListe[] = tousLesDevis.map((devis) => {
    const fin = dateFinValidite(devis)
    const jours = Math.round(
      (new Date(`${fin}T12:00:00`).getTime() - new Date(`${auj}T12:00:00`).getTime()) / 864e5,
    )
    return { devis, totaux: totauxDevis(devis), fin, jours }
  })

  const limite = new Date(`${auj}T12:00:00`)
  limite.setMonth(limite.getMonth() - 3)
  const debutPeriode =
    periode === 'mois'
      ? auj.slice(0, 8) + '01'
      : periode === 'trimestre'
        ? limite.toISOString().slice(0, 10)
        : ''
  const terme = sansAccent(recherche.trim())

  const visibles = lignes
    .filter(
      ({ devis: d }) =>
        (!onglet.statuts || onglet.statuts.includes(d.statut)) &&
        d.dateCreation >= debutPeriode &&
        (!terme || sansAccent(`${d.numero} ${d.clientNom} ${d.objet}`).includes(terme)),
    )
    .sort((a, b) => {
      const va = valeurTri(a, tri.cle)
      const vb = valeurTri(b, tri.cle)
      const ecart =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : comparerTexte(String(va), String(vb))
      return tri.sens === 'asc' ? ecart : -ecart
    })

  const pages = Math.max(1, Math.ceil(visibles.length / PAR_PAGE))
  const page = Math.min(numero, pages)
  const debut = (page - 1) * PAR_PAGE
  const affichees = visibles.slice(debut, debut + PAR_PAGE)
  const filtre = Boolean(terme || debutPeriode)

  const compte = (statuts?: readonly StatutDevis[]) =>
    tousLesDevis.filter((d) => !statuts || statuts.includes(d.statut)).length
  const ongletsComptes = ONGLETS.map((o) => ({
    ...o,
    libelle: `${o.libelle} (${compte(o.statuts)})`,
  }))

  const enAttente = lignes
    .filter((l) => l.devis.statut === 'envoye' && l.jours >= 0)
    .reduce((s, l) => s + l.totaux.totalTtc, 0)
  const envoyes = tousLesDevis.filter((d) => d.statut !== 'brouillon')
  const taux = envoyes.length
    ? Math.round((envoyes.filter((d) => d.statut === 'accepte').length / envoyes.length) * 100)
    : 0
  const stats = [
    { libelle: 'En attente de réponse', valeur: formaterEuro(enAttente) },
    { libelle: 'Taux d’acceptation', valeur: `${taux} %` },
    { libelle: 'Brouillons', valeur: String(compte(['brouillon'])) },
  ]

  const nouveau = () => apiDevis.creerBrouillon().then((d) => navigate(`/devis/${d.id}`), echec)

  const changerStatut = (d: Devis, statut: StatutDevis, titre: string, ton: 'succes' | 'info') =>
    apiDevis.changerStatut(d.id, statut).then(() => notifier(titre, { message: d.numero, ton }), echec)

  const dupliquer = (d: Devis) =>
    apiDevis.dupliquer(d.id).then(
      (copie) => notifier('Devis dupliqué', { message: `Brouillon ${copie.numero}`, ton: 'succes' }),
      echec,
    )

  const trier = (cle: CleTri) => {
    setTri((t) => ({ cle, sens: t.cle === cle && t.sens === 'asc' ? 'desc' : 'asc' }))
    setNumero(1)
  }
  const valeurSelectTri =
    OPTIONS_TRI.find((o) => o.cle === tri.cle && o.sens === tri.sens)?.valeur ?? ''

  const reinitialiser = () => {
    setRecherche('')
    setPeriode('tout')
    setNumero(1)
  }

  const vide = VIDE_PAR_ONGLET[onglet.id]!

  return (
    <>
      <header className="entete-articles">
        <span className="entete-articles__deco" aria-hidden="true" />
        <div className="entete-articles__texte">
          <nav aria-label="Fil d’Ariane" className="ariane">
            <span>Ventes</span>
            <Icone nom="suivant" taille={12} />
            <span aria-current="page">
              {onglet.id === 'tous' ? 'Tous les devis' : onglet.libelle}
            </span>
          </nav>
          <h1 className="entete-articles__titre">Devis</h1>
          <p className="entete-articles__sous">Préparez, envoyez et suivez vos propositions.</p>
        </div>
        <dl className="stats-articles">
          {stats.map((s) => (
            <div key={s.libelle} className="stats-articles__item">
              <dt>{s.libelle}</dt>
              <dd>{s.valeur}</dd>
            </div>
          ))}
        </dl>
        <div className="devis-actions">
          <Bouton onClick={() => navigate('/documents/apparence')}>Apparence des documents</Bouton>
          <Bouton variante="primaire" onClick={nouveau}>
            <Icone nom="plus" taille={18} className="devis-plus" />
            Nouveau devis
          </Bouton>
        </div>
      </header>

      <section className="surface-articles" aria-label="Liste des devis">
        <Onglets
          libelle="Statuts des devis"
          prefixe="devis"
          onglets={ongletsComptes}
          actif={onglet.id}
          onChoisir={choisirOnglet}
        />

        <div className="outils-articles" role="search">
          <div className="recherche outils-articles__recherche">
            <span className="recherche__icone">
              <Icone nom="recherche" taille={18} />
            </span>
            <input
              className="recherche__saisie"
              type="search"
              placeholder="Rechercher un numéro, un client, un objet…"
              aria-label="Rechercher un devis"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value)
                setNumero(1)
              }}
            />
          </div>
          <select
            className="outil outil--select"
            aria-label="Période"
            value={periode}
            onChange={(e) => {
              setPeriode(e.target.value)
              setNumero(1)
            }}
          >
            <option value="tout">Toute la période</option>
            <option value="mois">Ce mois</option>
            <option value="trimestre">3 derniers mois</option>
          </select>
          <select
            className="outil outil--select"
            aria-label="Trier par"
            value={valeurSelectTri}
            onChange={(e) => {
              const o = OPTIONS_TRI.find((x) => x.valeur === e.target.value)
              if (o) setTri({ cle: o.cle, sens: o.sens })
            }}
          >
            {valeurSelectTri ? null : <option value="">Tri personnalisé</option>}
            {OPTIONS_TRI.map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.libelle}
              </option>
            ))}
          </select>
        </div>

        <div role="tabpanel" id="devis-panneau" aria-labelledby={`devis-onglet-${onglet.id}`}>
          {affichees.length === 0 ? (
            filtre ? (
              <EtatVide
                titre="Aucun devis ne correspond"
                texte="Élargissez la recherche ou la période."
                action={<Bouton onClick={reinitialiser}>Réinitialiser les filtres</Bouton>}
              />
            ) : (
              <EtatVide
                icone="devis"
                titre={vide.titre}
                texte={vide.texte}
                action={
                  onglet.id === 'tous' || onglet.id === 'brouillons' ? (
                    <Bouton variante="primaire" onClick={nouveau}>
                      Nouveau devis
                    </Bouton>
                  ) : undefined
                }
              />
            )
          ) : (
            <ListeDevis
              lignes={affichees}
              tri={tri}
              onTrier={trier}
              onOuvrir={(d) => navigate(`/devis/${d.id}`)}
              onDupliquer={dupliquer}
              onEnvoye={(d) => changerStatut(d, 'envoye', 'Devis marqué comme envoyé', 'succes')}
              onAccepte={(d) => changerStatut(d, 'accepte', 'Devis marqué comme accepté', 'succes')}
              onRefuse={(d) => changerStatut(d, 'refuse', 'Devis marqué comme refusé', 'info')}
              onSupprimer={setASupprimer}
            />
          )}
        </div>

        <footer className="pied-articles">
          <p aria-live="polite">
            {visibles.length} devis
            {visibles.length ? ` · affichage ${debut + 1} – ${debut + affichees.length}` : ''}
          </p>
          {pages > 1 ? <Pagination page={page} pages={pages} onChoisir={setNumero} /> : null}
        </footer>
      </section>

      <Dialogue
        ouvert={aSupprimer !== null}
        onFermer={() => setASupprimer(null)}
        titre="Supprimer ce brouillon ?"
        soustitre={aSupprimer?.numero ?? ''}
        pied={
          <>
            <Bouton onClick={() => setASupprimer(null)}>Conserver</Bouton>
            <Bouton
              variante="danger"
              icone="poubelle"
              onClick={() => {
                if (!aSupprimer) return
                const { id, numero } = aSupprimer
                setASupprimer(null)
                apiDevis.supprimer(id).then(
                  () => notifier('Brouillon supprimé', { message: numero, ton: 'succes' }),
                  echec,
                )
              }}
            >
              Supprimer
            </Bouton>
          </>
        }
      >
        <p>Le brouillon disparaît définitivement. Seuls les brouillons peuvent être supprimés.</p>
      </Dialogue>
    </>
  )
}
