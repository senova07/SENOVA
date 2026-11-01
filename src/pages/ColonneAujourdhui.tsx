import { Link } from 'react-router-dom'
import { Icone } from '@/ui/Icone'
import { formaterEuro } from '@/lib/format'
import { ICONE_STATUT_DEVIS, LIBELLES_STATUT_DEVIS, PRESTATIONS_DU_JOUR, totalTtcDevis, type Devis } from '@/features/devis'

function Interventions() {
  return (
    <section className="aujourdhui-bloc" aria-labelledby="titre-interventions">
      <header className="aujourdhui-bloc__entete">
        <h2 id="titre-interventions">Aujourd'hui</h2>
      </header>
      {PRESTATIONS_DU_JOUR.length === 0 ? (
        <p className="aujourdhui-note">Aucune intervention prévue.</p>
      ) : (
        <div className="tableau-cadre">
          <table className="tableau aujourdhui-compact">
            <thead>
              <tr>
                <th scope="col">Heure</th>
                <th scope="col">Intervention</th>
              </tr>
            </thead>
            <tbody>
              {PRESTATIONS_DU_JOUR.map((p) => (
                <tr key={p.id} className="tableau__ligne">
                  <td className="aujourdhui-heure num">
                    <time>{p.heure}</time>
                  </td>
                  <td className="tableau__col-principale">
                    <p className="tableau__titre">{p.clientNom}</p>
                    <p className="tableau__sous">{p.objet}</p>
                    <a
                      className="aujourdhui-adresse"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.adresse)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icone nom="adresse" taille={14} />
                      {p.adresse}
                      <span className="sr-only"> (ouvre Google Maps)</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function DerniersDevis({ devis }: { devis: readonly Devis[] }) {
  const recents = [...devis].sort((a, b) => b.majLe.localeCompare(a.majLe)).slice(0, 5)
  return (
    <section className="aujourdhui-bloc" aria-labelledby="titre-derniers">
      <header className="aujourdhui-bloc__entete">
        <h2 id="titre-derniers">Derniers devis</h2>
        <Link to="/devis" className="aujourdhui-lien">
          Tout voir
        </Link>
      </header>
      <div className="tableau-cadre">
        <table className="tableau aujourdhui-compact">
          <thead>
            <tr>
              <th scope="col">Devis</th>
              <th scope="col" className="tableau__col-nombre">
                Montant TTC
              </th>
            </tr>
          </thead>
          <tbody>
            {recents.map((d) => (
              <tr key={d.id} className="tableau__ligne">
                <td className="tableau__col-principale">
                  <Link to={`/devis/${d.id}`} className="tableau__titre">
                    {d.clientNom}
                  </Link>
                  <p className="tableau__sous">{d.objet}</p>
                </td>
                <td className="tableau__col-nombre">
                  {formaterEuro(totalTtcDevis(d))}
                  <span className="aujourdhui-statut">
                    <Icone nom={ICONE_STATUT_DEVIS[d.statut]} taille={14} />
                    {LIBELLES_STATUT_DEVIS[d.statut]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Colonne de droite : interventions du jour et derniers devis. */
export function ColonneAujourdhui({ devis }: { devis: readonly Devis[] }) {
  return (
    <aside className="aujourdhui-colonne">
      <Interventions />
      <DerniersDevis devis={devis} />
    </aside>
  )
}
