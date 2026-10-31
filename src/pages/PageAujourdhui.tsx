import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icone, type NomIcone } from '@/ui/Icone'
import { MenuDeroulant } from '@/ui/Menu'
import { formaterEuro } from '@/lib/format'
import { useSession } from '@/store/sessionContext'
import { useToast } from '@/store/toastContext'
import {
  FACTURES_DEMO,
  ICONE_STATUT_DEVIS,
  LIBELLES_STATUT_DEVIS,
  PRESTATIONS_DU_JOUR,
  calculerTotaux,
  dateFinValidite,
  magasinDevis,
  type Devis,
  type StatutDevis,
} from '@/features/devis/donnees'
import './aujourdhui.css'

const dateDuJour = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const SEUIL_RELANCE_DEVIS = 7

interface Action {
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

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 && !mot.endsWith('s') ? 's' : ''}`
const joursEntre = (iso: string, aujourdhui: Date) =>
  Math.round((aujourdhui.getTime() - new Date(`${iso.slice(0, 10)}T12:00:00`).getTime()) / 864e5)
const totalTtc = (d: Devis) => calculerTotaux(d.lignes, d.remise).totalTtc

/** Liste priorisée : retards de paiement, devis à relancer, devis acceptés, brouillons. */
function construireActions(devis: readonly Devis[], aujourdhui: Date): Action[] {
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
          contexte: `${formaterEuro(totalTtc(d))}, ${delai}`,
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
        contexte: `${formaterEuro(totalTtc(d))}, ${contexte}`,
        bouton: { libelle, lien: `/devis/${d.id}` },
      }))

  return [
    ...retards,
    ...relances,
    ...parStatut('accepte', 'accepte', 'Facturer', 'accepté, à facturer'),
    ...parStatut('brouillon', 'crayon', 'Terminer', 'brouillon à finir'),
  ]
}

export function PageAujourdhui() {
  const { session } = useSession()
  const { notifier } = useToast()
  const devis = magasinDevis.useListe()
  const [relancees, setRelancees] = useState<ReadonlySet<string>>(new Set())
  const [masquees, setMasquees] = useState<ReadonlySet<string>>(new Set())
  const [afficherMasquees, setAfficherMasquees] = useState(false)
  const prenom = session?.utilisateur.nomComplet.trim().split(/\s+/)[0] ?? ''

  const maintenant = new Date()
  const moisCourant = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`

  const duMois = FACTURES_DEMO.filter((f) => f.date.startsWith(moisCourant))
  const caFacture = duMois.reduce((s, f) => s + f.montantTtc, 0)
  // shortcut: encaissé du mois = part payée des factures du mois ; brancher les vrais paiements.
  const encaisse = duMois.reduce((s, f) => s + f.montantTtc - f.resteDu, 0)
  const reste = FACTURES_DEMO.reduce((s, f) => s + f.resteDu, 0)
  const enRetard = FACTURES_DEMO.filter((f) => f.statut === 'en_retard').reduce(
    (s, f) => s + f.resteDu,
    0,
  )
  const envoyes = devis.filter((d) => d.statut === 'envoye')
  const montantEnvoyes = envoyes.reduce((s, d) => s + totalTtc(d), 0)

  const actions = construireActions(devis, maintenant)
  const visibles = actions.filter((a) => afficherMasquees || !masquees.has(a.id))
  const nbMasquees = actions.filter((a) => masquees.has(a.id)).length
  const nbAFaire = actions.filter((a) => !masquees.has(a.id) && !relancees.has(a.id)).length
  const nbInterventions = PRESTATIONS_DU_JOUR.length

  const relancer = (a: Action) => {
    setRelancees((s) => new Set(s).add(a.id))
    notifier('Relance envoyée', { message: a.client, ton: 'succes' })
  }
  const basculerMasquee = (id: string) =>
    setMasquees((s) => {
      const suite = new Set(s)
      if (!suite.delete(id)) suite.add(id)
      return suite
    })

  const chiffres = [
    {
      lien: '/factures',
      libelle: 'CA facturé du mois',
      valeur: formaterEuro(caFacture),
      sous: `${pluriel(duMois.length, 'facture')} émise${duMois.length > 1 ? 's' : ''}`,
      danger: false,
    },
    {
      lien: '/paiements',
      libelle: 'Encaissé ce mois',
      valeur: formaterEuro(encaisse),
      sous: 'Paiements reçus',
      danger: false,
    },
    {
      lien: '/factures',
      libelle: 'Reste à encaisser',
      valeur: formaterEuro(reste),
      sous: enRetard ? `dont ${formaterEuro(enRetard)} en retard` : 'Rien en retard',
      danger: enRetard > 0,
    },
    {
      lien: '/devis?onglet=envoyes',
      libelle: 'Devis en attente',
      valeur: formaterEuro(montantEnvoyes),
      sous: `${pluriel(envoyes.length, 'devis')} envoyé${envoyes.length > 1 ? 's' : ''}`,
      danger: false,
    },
  ]

  return (
    <>
      <section className="editorial" aria-labelledby="titre-aujourdhui">
        <span className="ruban-deco" aria-hidden="true" />
        <p className="editorial__sur">{dateDuJour.format(maintenant)}</p>
        <h1 className="editorial__titre" id="titre-aujourdhui">
          Bonjour {prenom}
        </h1>
        <p className="editorial__texte">
          {nbAFaire ? `${pluriel(nbAFaire, 'action')} à faire` : 'Aucune action à faire'},{' '}
          {nbInterventions
            ? `${pluriel(nbInterventions, 'intervention')} aujourd'hui`
            : "pas d'intervention aujourd'hui"}
          .
        </p>
      </section>

      <ul className="aujourdhui-chiffres" aria-label="Chiffres clés">
        {chiffres.map((c) => (
          <li key={c.libelle}>
            <Link to={c.lien} className="aujourdhui-chiffre">
              <span className="aujourdhui-chiffre__libelle">{c.libelle}</span>
              <span className="aujourdhui-chiffre__valeur">{c.valeur}</span>
              <span
                className={`aujourdhui-chiffre__sous${c.danger ? ' aujourdhui-chiffre__sous--danger' : ''}`}
              >
                {c.sous}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="aujourdhui-grille">
        <section className="aujourdhui-bloc" aria-labelledby="titre-a-faire">
          <header className="aujourdhui-bloc__entete">
            <h2 id="titre-a-faire">À faire</h2>
            {nbMasquees ? (
              <button
                type="button"
                className="aujourdhui-lien"
                onClick={() => setAfficherMasquees((v) => !v)}
              >
                {afficherMasquees ? 'Cacher' : 'Afficher'} les actions masquées ({nbMasquees})
              </button>
            ) : null}
          </header>

          {visibles.length === 0 ? (
            <div className="aujourdhui-vide">
              <Icone nom="accepte" taille={28} />
              <p className="aujourdhui-vide__titre">Tout est à jour</p>
              <p>Aucune relance ni devis en attente d'action.</p>
            </div>
          ) : (
            <ul className="aujourdhui-actions">
              {visibles.map((a) => {
                const masquee = masquees.has(a.id)
                const relancee = relancees.has(a.id)
                return (
                  <li
                    key={a.id}
                    className={`aujourdhui-action${masquee ? ' aujourdhui-action--masquee' : ''}`}
                  >
                    <Icone
                      nom={a.icone}
                      taille={20}
                      className={
                        a.urgent ? 'aujourdhui-action__icone--danger' : 'aujourdhui-action__icone'
                      }
                    />
                    <div className="aujourdhui-action__texte">
                      <p className="aujourdhui-action__titre">
                        {a.client}
                        <span> · {a.objet}</span>
                      </p>
                      <p
                        className={`aujourdhui-action__contexte${a.urgent && !relancee ? ' aujourdhui-action__contexte--danger' : ''}`}
                      >
                        {a.contexte}
                      </p>
                    </div>
                    {relancee ? (
                      <span className="aujourdhui-fait">
                        <Icone nom="valider" taille={16} />
                        Relancé aujourd'hui
                      </span>
                    ) : a.bouton.lien ? (
                      <Link to={a.bouton.lien} className="btn btn--secondaire btn--sm">
                        {a.bouton.libelle}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--secondaire btn--sm"
                        onClick={() => relancer(a)}
                      >
                        {a.bouton.libelle}
                      </button>
                    )}
                    <MenuDeroulant
                      declencheur={({ ouvert, basculer }) => (
                        <button
                          type="button"
                          className="ligne-actions"
                          aria-label={`Plus d'actions pour ${a.client}`}
                          aria-haspopup="menu"
                          aria-expanded={ouvert}
                          onClick={basculer}
                        >
                          <Icone nom="actions" taille={18} poids="bold" />
                        </button>
                      )}
                    >
                      {(fermer) => (
                        <div className="menu__liste" role="menu">
                          <button
                            type="button"
                            role="menuitem"
                            className="menu__item"
                            onClick={() => {
                              fermer()
                              basculerMasquee(a.id)
                            }}
                          >
                            {masquee ? 'Ne plus masquer' : 'Masquer'}
                          </button>
                        </div>
                      )}
                    </MenuDeroulant>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <aside className="aujourdhui-lateral">
          <section className="aujourdhui-bloc" aria-labelledby="titre-interventions">
            <header className="aujourdhui-bloc__entete">
              <h2 id="titre-interventions">Aujourd'hui</h2>
            </header>
            {nbInterventions === 0 ? (
              <p className="aujourdhui-note">Aucune intervention prévue.</p>
            ) : (
              <ul className="aujourdhui-liste">
                {PRESTATIONS_DU_JOUR.map((p) => (
                  <li key={p.id} className="aujourdhui-intervention">
                    <time className="aujourdhui-intervention__heure">{p.heure}</time>
                    <div>
                      <p className="aujourdhui-action__titre">{p.clientNom}</p>
                      <p className="aujourdhui-action__contexte">{p.objet}</p>
                      <a
                        className="aujourdhui-intervention__adresse"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.adresse)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icone nom="adresse" taille={14} />
                        {p.adresse}
                        <span className="sr-only"> (ouvre Google Maps)</span>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="aujourdhui-bloc" aria-labelledby="titre-derniers">
            <header className="aujourdhui-bloc__entete">
              <h2 id="titre-derniers">Derniers devis</h2>
              <Link to="/devis" className="aujourdhui-lien">
                Tout voir
              </Link>
            </header>
            <ul className="aujourdhui-liste">
              {[...devis]
                .sort((a, b) => b.majLe.localeCompare(a.majLe))
                .slice(0, 5)
                .map((d) => (
                  <li key={d.id}>
                    <Link to={`/devis/${d.id}`} className="aujourdhui-devis">
                      <span className="aujourdhui-devis__texte">
                        <span className="aujourdhui-action__titre">{d.clientNom}</span>
                        <span className="aujourdhui-action__contexte">{d.objet}</span>
                      </span>
                      <span className="aujourdhui-devis__droite">
                        <span className="aujourdhui-devis__montant">
                          {formaterEuro(totalTtc(d))}
                        </span>
                        <span className="aujourdhui-statut">
                          <Icone nom={ICONE_STATUT_DEVIS[d.statut]} taille={14} />
                          {LIBELLES_STATUT_DEVIS[d.statut]}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  )
}
