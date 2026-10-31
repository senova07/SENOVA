import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EtatVide } from '@/components/ui/EtatVide'
import { Icone, type NomIcone } from '@/components/ui/Icone'
import { formaterEuro } from '@/lib/format'
import {
  LIBELLES_STATUT_DEVIS,
  type Devis,
  type FactureDemo,
  type StatutDevis,
} from '@/features/devis/donnees'
import { devisTtc } from './documentsClient'
import { StatutPiece } from './ElementsClient'

type Ton = 'neutre' | 'succes' | 'alerte' | 'danger'

const STATUT_DEVIS: Record<StatutDevis, { icone: NomIcone; ton: Ton }> = {
  brouillon: { icone: 'crayon', ton: 'neutre' },
  envoye: { icone: 'envoyer', ton: 'neutre' },
  accepte: { icone: 'accepte', ton: 'succes' },
  refuse: { icone: 'refuse', ton: 'danger' },
  expire: { icone: 'horloge', ton: 'alerte' },
}

const STATUT_FACTURE: Record<
  FactureDemo['statut'],
  { icone: NomIcone; ton: Ton; libelle: string }
> = {
  payee: { icone: 'accepte', ton: 'succes', libelle: 'Payée' },
  en_attente: { icone: 'horloge', ton: 'neutre', libelle: 'En attente' },
  en_retard: { icone: 'attention', ton: 'danger', libelle: 'En retard' },
}

const dateFr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR')

const StatutDevisPiece = ({ statut }: { statut: StatutDevis }) => (
  <StatutPiece {...STATUT_DEVIS[statut]} libelle={LIBELLES_STATUT_DEVIS[statut]} />
)
const StatutFacture = ({ statut }: { statut: FactureDemo['statut'] }) => (
  <StatutPiece {...STATUT_FACTURE[statut]} />
)

const BoutonCreerDevis = (
  <Link to="/devis" className="btn btn--primaire">
    <Icone nom="plus" taille={18} />
    Créer un devis
  </Link>
)

interface Evenement {
  cle: string
  date: string
  icone: NomIcone
  titre: string
  detail: string
  montant: number
  lien: string
  statut: ReactNode
}

/** Chronologie verticale, du plus récent au plus ancien. */
export function HistoriqueClient({ devis, factures }: { devis: Devis[]; factures: FactureDemo[] }) {
  const evenements: Evenement[] = [
    ...devis.map((d) => ({
      cle: `d${d.id}`,
      date: d.dateCreation,
      icone: 'devis' as const,
      titre: `Devis ${d.numero}`,
      detail: d.objet,
      montant: devisTtc(d),
      lien: `/devis/${d.id}`,
      statut: <StatutDevisPiece statut={d.statut} />,
    })),
    ...factures.map((f) => ({
      cle: `f${f.id}`,
      date: f.date,
      icone: 'factures' as const,
      titre: `Facture ${f.numero}`,
      detail: `Échéance le ${dateFr(f.echeance)}`,
      montant: f.montantTtc,
      lien: '/factures',
      statut: <StatutFacture statut={f.statut} />,
    })),
    // Maquette : la date de l'encaissement n'est pas connue, on retient celle de la facture.
    ...factures
      .filter((f) => f.montantTtc > f.resteDu)
      .map((f) => ({
        cle: `p${f.id}`,
        date: f.date,
        icone: 'encaisser' as const,
        titre: `Paiement reçu · ${f.numero}`,
        detail: f.resteDu > 0 ? 'Paiement partiel' : 'Facture soldée',
        montant: f.montantTtc - f.resteDu,
        lien: '/factures',
        statut: <StatutPiece icone="accepte" libelle="Encaissé" ton="succes" />,
      })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  if (evenements.length === 0)
    return (
      <EtatVide
        icone="devis"
        titre="Aucune activité pour le moment"
        texte="Les devis, factures et paiements de ce client apparaîtront ici, du plus récent au plus ancien."
        action={BoutonCreerDevis}
      />
    )

  return (
    <ol className="chronologie">
      {evenements.map((e) => (
        <li key={e.cle} className="chronologie__item">
          <Icone nom={e.icone} taille={18} className="chronologie__icone" />
          <div className="chronologie__corps">
            <p className="chronologie__titre">
              <Link to={e.lien}>{e.titre}</Link>
              <span className="chronologie__montant">{formaterEuro(e.montant)}</span>
            </p>
            <p className="chronologie__detail">
              <time dateTime={e.date}>{dateFr(e.date)}</time>
              {e.detail ? ` · ${e.detail}` : ''}
            </p>
            {e.statut}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function DevisClient({ devis }: { devis: Devis[] }) {
  if (devis.length === 0)
    return (
      <EtatVide
        icone="devis"
        titre="Aucun devis pour ce client"
        texte="Créez un devis pour lui chiffrer une prestation."
        action={BoutonCreerDevis}
      />
    )
  return (
    <div className="tableau-defile">
      <table className="tableau-articles tableau-pieces">
        <thead>
          <tr>
            <th scope="col">Devis</th>
            <th scope="col">Date</th>
            <th scope="col">Statut</th>
            <th scope="col" className="num">
              Total TTC
            </th>
          </tr>
        </thead>
        <tbody>
          {devis.map((d) => (
            <tr key={d.id}>
              <td>
                <Link to={`/devis/${d.id}`} className="client__nom">
                  {d.numero}
                </Link>
                <span className="client__nature">{d.objet}</span>
              </td>
              <td>{dateFr(d.dateCreation)}</td>
              <td>
                <StatutDevisPiece statut={d.statut} />
              </td>
              <td className="num c-prix">{formaterEuro(devisTtc(d))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FacturesClient({ factures }: { factures: FactureDemo[] }) {
  if (factures.length === 0)
    return (
      <EtatVide
        icone="factures"
        titre="Aucune facture pour ce client"
        texte="Une facture se crée à partir d’un devis accepté."
        action={BoutonCreerDevis}
      />
    )
  return (
    <div className="tableau-defile">
      <table className="tableau-articles tableau-pieces">
        <thead>
          <tr>
            <th scope="col">Facture</th>
            <th scope="col">Date</th>
            <th scope="col">Statut</th>
            <th scope="col" className="num">
              Total TTC
            </th>
            <th scope="col" className="num">
              Reste dû
            </th>
          </tr>
        </thead>
        <tbody>
          {factures.map((f) => (
            <tr key={f.id}>
              <td>
                <Link to="/factures" className="client__nom">
                  {f.numero}
                </Link>
                <span className="client__nature">Échéance le {dateFr(f.echeance)}</span>
              </td>
              <td>{dateFr(f.date)}</td>
              <td>
                <StatutFacture statut={f.statut} />
              </td>
              <td className="num c-prix">{formaterEuro(f.montantTtc)}</td>
              <td className={`num ${f.resteDu > 0 ? 'k-du--du' : 'client-vide'}`}>
                {f.resteDu > 0 ? formaterEuro(f.resteDu) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DocumentsClient() {
  return (
    <EtatVide
      icone="documents"
      titre="Documents : bientôt"
      texte="Contrats, plans et pièces jointes de ce client seront rangés ici."
    />
  )
}
