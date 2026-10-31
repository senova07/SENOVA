import { Link } from 'react-router-dom'
import { Icone } from '@/ui/Icone'
import { useMenu } from '@/ui/useMenu'
import { formaterEuro } from '@/lib/format'
import { ICONE_STATUT_DEVIS, LIBELLES_STATUT_DEVIS, type Devis, type Totaux } from './donnees'

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

interface Actions {
  onOuvrir(d: Devis): void
  onDupliquer(d: Devis): void
  onEnvoye(d: Devis): void
  onAccepte(d: Devis): void
  onRefuse(d: Devis): void
  onSupprimer(d: Devis): void
}

const dateCourte = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR')

function MenuLigne({
  devis: d,
  versLeHaut,
  ...actions
}: Actions & { devis: Devis; versLeHaut: boolean }) {
  const { ouvert, ancre, basculer, fermer } = useMenu()
  const agir = (action: (d: Devis) => void) => () => {
    fermer()
    action(d)
  }
  const reponse = d.statut === 'envoye'
  return (
    <div className="menu-ancre" ref={ancre}>
      <button
        type="button"
        className="ligne-actions"
        aria-label={`Actions : ${d.numero}`}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        onClick={basculer}
      >
        <Icone nom="actions" taille={20} poids="bold" />
      </button>
      {ouvert ? (
        <div
          className={`menu__liste ${versLeHaut ? 'menu__liste--dessus' : ''}`}
          role="menu"
          aria-label={`Actions : ${d.numero}`}
        >
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            onClick={agir(actions.onOuvrir)}
          >
            <Icone nom="ouvrir" taille={18} />
            Ouvrir
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            onClick={agir(actions.onDupliquer)}
          >
            <Icone nom="copier" taille={18} />
            Dupliquer
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            disabled={d.statut !== 'brouillon'}
            onClick={agir(actions.onEnvoye)}
          >
            <Icone nom="envoyer" taille={18} />
            Marquer envoyé
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            disabled={!reponse}
            onClick={agir(actions.onAccepte)}
          >
            <Icone nom="accepte" taille={18} />
            Marquer accepté
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            disabled={!reponse}
            onClick={agir(actions.onRefuse)}
          >
            <Icone nom="refuse" taille={18} />
            Marquer refusé
          </button>
          {d.statut === 'brouillon' ? (
            <button
              type="button"
              role="menuitem"
              className="menu__item menu__item--danger"
              onClick={agir(actions.onSupprimer)}
            >
              <Icone nom="poubelle" taille={18} />
              Supprimer
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function EnteteTri({
  cle,
  libelle,
  tri,
  onTrier,
  num,
}: {
  cle: CleTri
  libelle: string
  tri: Tri
  onTrier(c: CleTri): void
  num?: boolean
}) {
  const actif = tri.cle === cle
  return (
    <th
      scope="col"
      className={num ? 'num' : undefined}
      aria-sort={actif ? (tri.sens === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button
        type="button"
        className={`tri ${actif ? 'tri--actif' : ''}`}
        onClick={() => onTrier(cle)}
      >
        {libelle}
        <Icone nom={actif ? (tri.sens === 'asc' ? 'haut' : 'bas') : 'trier'} taille={13} />
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
        <span
          className={`devis-validite ${jours < 0 ? 'devis-validite--rouge' : 'devis-validite--orange'}`}
        >
          {jours < 0 ? 'expiré' : jours === 0 ? 'expire aujourd’hui' : `expire dans ${jours} j`}
        </span>
      ) : null}
    </>
  )
}

/** Tableau des devis ; sous 768 px, chaque ligne devient une carte (voir devis.css). */
export function ListeDevis({
  lignes,
  tri,
  onTrier,
  ...actions
}: Actions & { lignes: LigneListe[]; tri: Tri; onTrier(c: CleTri): void }) {
  const entete = (cle: CleTri, libelle: string, num?: boolean) => (
    <EnteteTri cle={cle} libelle={libelle} tri={tri} onTrier={onTrier} num={num} />
  )
  return (
    <div className="tableau-defile devis-defile">
      <table className="tableau-articles devis-table">
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
            <th scope="col" className="c-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, rang) => {
            const d = l.devis
            return (
              <tr key={d.id} className="devis-ligne" onClick={() => actions.onOuvrir(d)}>
                <td className="devis-c-numero" data-zone="numero">
                  <Link
                    to={`/devis/${d.id}`}
                    className="article__nom"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {d.numero}
                  </Link>
                </td>
                <td className="devis-c-client" data-zone="client">
                  {d.clientNom || <span className="devis-vide">Sans client</span>}
                </td>
                <td className="devis-c-objet" data-zone="objet">
                  {d.objet || <span className="devis-vide">Sans objet</span>}
                </td>
                <td data-zone="date" data-label="Date">
                  {dateCourte(d.dateCreation)}
                </td>
                <td data-zone="validite" data-label="Validité">
                  <Validite ligne={l} />
                </td>
                <td className="num" data-zone="ht" data-label="Montant HT">
                  {formaterEuro(l.totaux.totalHt)}
                </td>
                <td className="num c-prix" data-zone="ttc" data-label="Montant TTC">
                  {formaterEuro(l.totaux.totalTtc)}
                </td>
                <td data-zone="statut">
                  <span className={`devis-statut devis-statut--${d.statut}`}>
                    <Icone nom={ICONE_STATUT_DEVIS[d.statut]} taille={16} />
                    {LIBELLES_STATUT_DEVIS[d.statut]}
                  </span>
                </td>
                <td className="c-actions" data-zone="actions" onClick={(e) => e.stopPropagation()}>
                  <MenuLigne
                    devis={d}
                    versLeHaut={lignes.length > 3 && rang >= lignes.length - 2}
                    {...actions}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
