import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EtatVide } from '@/ui/EtatVide'
import { Icone, type NomIcone } from '@/ui/Icone'
import { formaterDate, formaterEuro } from '@/lib/format'
import { totalTtcDevis, type Devis, type FactureDemo } from '@/features/devis'
import { BoutonCreerDevis, StatutDevisPiece, StatutFacture, StatutPiece } from './ElementsClient'

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
      montant: totalTtcDevis(d),
      lien: `/devis/${d.id}`,
      statut: <StatutDevisPiece statut={d.statut} />,
    })),
    ...factures.map((f) => ({
      cle: `f${f.id}`,
      date: f.date,
      icone: 'factures' as const,
      titre: `Facture ${f.numero}`,
      detail: `Échéance le ${formaterDate(f.echeance)}`,
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
        action={<BoutonCreerDevis />}
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
              <time dateTime={e.date}>{formaterDate(e.date)}</time>
              {e.detail ? ` · ${e.detail}` : ''}
            </p>
            {e.statut}
          </div>
        </li>
      ))}
    </ol>
  )
}
