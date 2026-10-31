import { Link } from 'react-router-dom'
import { EtatVide } from '@/ui/EtatVide'
import { formaterDate, formaterEuro } from '@/lib/format'
import { totalTtcDevis, type Devis, type FactureDemo } from '@/features/devis'
import { BoutonCreerDevis, StatutDevisPiece, StatutFacture } from './ElementsClient'

export function DevisClient({ devis }: { devis: Devis[] }) {
  if (devis.length === 0)
    return (
      <EtatVide
        icone="devis"
        titre="Aucun devis pour ce client"
        texte="Créez un devis pour lui chiffrer une prestation."
        action={<BoutonCreerDevis />}
      />
    )
  return (
    <div className="tableau-cadre">
      <table className="tableau">
        <thead>
          <tr>
            <th scope="col" className="tableau__col-principale">
              Devis
            </th>
            <th scope="col">Date</th>
            <th scope="col">Statut</th>
            <th scope="col" className="tableau__col-nombre">
              Total TTC
            </th>
          </tr>
        </thead>
        <tbody>
          {devis.map((d) => (
            <tr key={d.id} className="tableau__ligne">
              <td className="tableau__col-principale">
                <Link to={`/devis/${d.id}`} className="tableau__titre">
                  {d.numero}
                </Link>
                <div className="tableau__sous">{d.objet}</div>
              </td>
              <td>{formaterDate(d.dateCreation)}</td>
              <td>
                <StatutDevisPiece statut={d.statut} />
              </td>
              <td className="tableau__col-nombre">{formaterEuro(totalTtcDevis(d))}</td>
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
        action={<BoutonCreerDevis />}
      />
    )
  return (
    <div className="tableau-cadre">
      <table className="tableau">
        <thead>
          <tr>
            <th scope="col" className="tableau__col-principale">
              Facture
            </th>
            <th scope="col">Date</th>
            <th scope="col">Statut</th>
            <th scope="col" className="tableau__col-nombre">
              Total TTC
            </th>
            <th scope="col" className="tableau__col-nombre">
              Reste dû
            </th>
          </tr>
        </thead>
        <tbody>
          {factures.map((f) => (
            <tr key={f.id} className="tableau__ligne">
              <td className="tableau__col-principale">
                <Link to="/factures" className="tableau__titre">
                  {f.numero}
                </Link>
                <div className="tableau__sous">Échéance le {formaterDate(f.echeance)}</div>
              </td>
              <td>{formaterDate(f.date)}</td>
              <td>
                <StatutFacture statut={f.statut} />
              </td>
              <td className="tableau__col-nombre">{formaterEuro(f.montantTtc)}</td>
              <td className={`tableau__col-nombre ${f.resteDu > 0 ? 'client-du' : 'client-vide'}`}>
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
