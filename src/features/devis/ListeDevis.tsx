import { Link } from 'react-router-dom'
import { Icone } from '@/ui/Icone'
import { formaterEuro } from '@/lib/format'
import { MenuLigneDevis, type ActionsDevis } from './MenuLigneDevis'
import { ICONE_STATUT_DEVIS, LIBELLES_STATUT_DEVIS } from './statuts'
import type { Devis, Totaux } from './types'

export type CleTri = 'numero' | 'client' | 'objet' | 'date' | 'validite' | 'ht' | 'ttc' | 'statut'
export interface Tri {
  cle: CleTri
  sens: 'asc' | 'desc'
}

/** Un devis avec ce qu'il faut pour l'afficher et le trier. */
export interface LigneListe {
  devis: Devis
  totaux: Totaux
  fin: string
  /** Jours restants avant la fin de validité (négatif = dépassée). */
  jours: number
}

const dateCourte = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR')

function EnteteTri({
  cle,
  libelle,
  tri,
  onTrier,
  nombre,
}: {
  cle: CleTri
  libelle: string
  tri: Tri
  onTrier(c: CleTri): void
  nombre?: boolean
}) {
  const actif = tri.cle === cle
  return (
    <th
      scope="col"
      className={nombre ? 'tableau__col-nombre' : undefined}
      aria-sort={actif ? (tri.sens === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button type="button" className="tableau__tri" data-trie={actif || undefined} onClick={() => onTrier(cle)}>
        {libelle}
        {actif ? (
          <Icone nom={tri.sens === 'asc' ? 'haut' : 'bas'} taille={12} poids="bold" />
        ) : (
          <Icone nom="trier" taille={12} poids="bold" />
        )}
      </button>
    </th>
  )
}

function Validite({ ligne }: { ligne: LigneListe }) {
  const { devis: d, fin, jours } = ligne
  const alerte = d.statut === 'envoye' && jours <= 7
  return (
    <>
      {dateCourte(fin)}
      {alerte ? (
        <span className={`liste-devis__validite ${jours < 0 ? 'liste-devis__validite--rouge' : 'liste-devis__validite--orange'}`}>
          {jours < 0 ? 'expiré' : jours === 0 ? 'expire aujourd’hui' : `expire dans ${jours} j`}
        </span>
      ) : null}
    </>
  )
}

/** Tableau des devis ; sous 768 px, chaque ligne devient une carte (voir liste-devis.css). */
export function ListeDevis({
  lignes,
  tri,
  onTrier,
  ...actions
}: ActionsDevis & { lignes: LigneListe[]; tri: Tri; onTrier(c: CleTri): void }) {
  const entete = (cle: CleTri, libelle: string, nombre?: boolean) => (
    <EnteteTri cle={cle} libelle={libelle} tri={tri} onTrier={onTrier} nombre={nombre} />
  )
  return (
    <div className="tableau-cadre">
      <table className="tableau liste-devis__table">
        <thead>
          <tr>
            {entete('numero', 'Numéro')}
            {entete('client', 'Client')}
            {entete('objet', 'Objet')}
            {entete('date', 'Date')}
            {entete('validite', 'Validité')}
            {entete('ht', 'Montant HT', true)}
            {entete('ttc', 'Montant TTC', true)}
            {entete('statut', 'Statut')}
            <th scope="col" className="tableau__col-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, rang) => {
            const d = l.devis
            return (
              <tr key={d.id} className="tableau__ligne liste-devis__ligne" onClick={() => actions.onOuvrir(d)}>
                <td data-zone="numero">
                  <Link to={`/devis/${d.id}`} className="tableau__titre" onClick={(e) => e.stopPropagation()}>
                    {d.numero}
                  </Link>
                </td>
                <td className="liste-devis__client" data-zone="client">
                  {d.clientNom || <span className="liste-devis__vide">Sans client</span>}
                </td>
                <td className="tableau__col-principale liste-devis__objet" data-zone="objet">
                  {d.objet || <span className="liste-devis__vide">Sans objet</span>}
                </td>
                <td data-zone="date" data-label="Date">
                  {dateCourte(d.dateCreation)}
                </td>
                <td data-zone="validite" data-label="Validité">
                  <Validite ligne={l} />
                </td>
                <td className="tableau__col-nombre" data-zone="ht" data-label="Montant HT">
                  {formaterEuro(l.totaux.totalHt)}
                </td>
                <td className="tableau__col-nombre" data-zone="ttc" data-label="Montant TTC">
                  {formaterEuro(l.totaux.totalTtc)}
                </td>
                <td data-zone="statut">
                  <span className={`liste-devis__statut liste-devis__statut--${d.statut}`}>
                    <Icone nom={ICONE_STATUT_DEVIS[d.statut]} taille={16} />
                    {LIBELLES_STATUT_DEVIS[d.statut]}
                  </span>
                </td>
                <td className="tableau__col-actions" data-zone="actions" onClick={(e) => e.stopPropagation()}>
                  <MenuLigneDevis devis={d} versLeHaut={lignes.length > 3 && rang >= lignes.length - 2} {...actions} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
