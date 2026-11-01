import { Link } from 'react-router-dom'
import { Icone } from '@/ui/Icone'
import { formaterEuro } from '@/lib/format'
import { nomAffichageClient, type Client } from '@shared/clients'
import { resteDuClient } from './documentsClient'
import { ListeTags, NatureTexte } from './ElementsClient'
import { MenuLigneClient, type ActionsClient } from './MenuLigneClient'
import type { CleTriClient, ColonneClient, TriClient } from './vueClients'

function EnteteTri({
  cle,
  libelle,
  tri,
  onTrier,
  classe,
}: {
  cle: CleTriClient
  libelle: string
  tri: TriClient | null
  onTrier(c: CleTriClient): void
  classe: string
}) {
  const actif = tri?.cle === cle
  return (
    <th scope="col" className={classe} aria-sort={actif ? (tri.sens === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button type="button" className="tableau__tri" data-trie={actif || undefined} onClick={() => onTrier(cle)}>
        {libelle}
        <Icone nom={actif ? (tri.sens === 'asc' ? 'haut' : 'bas') : 'trier'} taille={12} poids="bold" />
      </button>
    </th>
  )
}

interface Props extends ActionsClient {
  clients: Client[]
  colonnes: ReadonlySet<ColonneClient>
  tri: TriClient | null
  onTrier(cle: CleTriClient): void
}

export function ListeClients({ clients, colonnes, tri, onTrier, ...actions }: Props) {
  const voir = (c: ColonneClient) => colonnes.has(c)
  return (
    <div className="tableau-cadre">
      <table className="tableau">
        <thead>
          <tr>
            <EnteteTri cle="nom" libelle="Client" tri={tri} onTrier={onTrier} classe="tableau__col-principale" />
            {voir('contact') ? (
              <EnteteTri cle="contact" libelle="Contact" tri={tri} onTrier={onTrier} classe="clients-col-contact" />
            ) : null}
            {voir('tags') ? (
              <th scope="col" className="clients-col-tags">
                Tags
              </th>
            ) : null}
            {voir('du') ? (
              <EnteteTri cle="du" libelle="Montant dû" tri={tri} onTrier={onTrier} classe="tableau__col-nombre" />
            ) : null}
            <th scope="col" className="tableau__col-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c, rang) => {
            const du = resteDuClient(c)
            return (
              <tr key={c.id} className="tableau__ligne">
                <td className="tableau__col-principale">
                  <Link to={`/clients/${c.id}`} className="tableau__titre">
                    {nomAffichageClient(c)}
                  </Link>
                  <div className="tableau__sous">
                    <NatureTexte nature={c.nature} />
                  </div>
                </td>
                {voir('contact') ? (
                  <td className="clients-col-contact">
                    {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : null}
                    {c.telephone ? <a href={`tel:${c.telephone}`}>{c.telephone}</a> : null}
                    {!c.email && !c.telephone ? <span className="client-vide">—</span> : null}
                  </td>
                ) : null}
                {voir('tags') ? (
                  <td className="clients-col-tags">
                    <ListeTags tags={c.tags} />
                  </td>
                ) : null}
                {voir('du') ? (
                  <td className={`tableau__col-nombre ${du > 0 ? 'client-du' : 'client-vide'}`}>
                    {du > 0 ? formaterEuro(du) : '—'}
                  </td>
                ) : null}
                <td className="tableau__col-actions">
                  <MenuLigneClient client={c} versLeHaut={clients.length > 3 && rang >= clients.length - 2} {...actions} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
