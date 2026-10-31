import { Link } from 'react-router-dom'
import { Icone } from '@/ui/Icone'
import { useMenu } from '@/ui/useMenu'
import { formaterEuro } from '@/lib/format'
import { nomAffichageClient, type Client } from '@shared/clients'
import { resteDuClient } from './documentsClient'
import { ListeTags, NatureTexte } from './ElementsClient'
import type { CleTriClient, ColonneClient, TriClient } from './colonnesClient'

interface Actions {
  peutGerer: boolean
  onModifier(client: Client): void
  onArchiver(client: Client): void
  onRestaurer(client: Client): void
}

function MenuLigne({
  client: c,
  peutGerer,
  onModifier,
  onArchiver,
  onRestaurer,
  versLeHaut,
}: Actions & { client: Client; versLeHaut: boolean }) {
  const { ouvert, ancre, basculer, fermer } = useMenu()
  const nom = nomAffichageClient(c)
  const agir = (action: (c: Client) => void) => () => {
    fermer()
    action(c)
  }
  return (
    <div className="menu-ancre" ref={ancre}>
      <button
        type="button"
        className="ligne-actions"
        aria-label={`Actions : ${nom}`}
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
          aria-label={`Actions : ${nom}`}
        >
          <Link to={`/clients/${c.id}`} role="menuitem" className="menu__item" onClick={fermer}>
            <Icone nom="ouvrir" taille={18} />
            Ouvrir
          </Link>
          {peutGerer ? (
            <button type="button" role="menuitem" className="menu__item" onClick={agir(onModifier)}>
              <Icone nom="crayon" taille={18} />
              Modifier
            </button>
          ) : null}
          <Link
            to={`/devis?nouveau=1&client=${c.id}`}
            role="menuitem"
            className="menu__item"
            onClick={fermer}
          >
            <Icone nom="devis" taille={18} />
            Nouveau devis
          </Link>
          {peutGerer ? (
            c.archiveLe ? (
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={agir(onRestaurer)}
              >
                <Icone nom="restaurer" taille={18} />
                Restaurer
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={agir(onArchiver)}
              >
                <Icone nom="archive" taille={18} />
                Archiver
              </button>
            )
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
  cle: CleTriClient
  libelle: string
  tri: TriClient | null
  onTrier(c: CleTriClient): void
  num?: boolean
}) {
  const actif = tri?.cle === cle
  return (
    <th
      scope="col"
      className={`k-${cle}${num ? ' num' : ''}`}
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

interface Props extends Actions {
  clients: Client[]
  colonnes: ReadonlySet<ColonneClient>
  tri: TriClient | null
  onTrier(cle: CleTriClient): void
}

/** Un seul balisage : tableau dense sur ordinateur, cartes sous 768 px (voir clients.css). */
export function ListeClients({ clients, colonnes, tri, onTrier, ...actions }: Props) {
  const voir = (c: ColonneClient) => colonnes.has(c)
  return (
    <div className="tableau-defile clients-defile">
      <table className="tableau-articles tableau-clients">
        <thead>
          <tr>
            <EnteteTri cle="nom" libelle="Client" tri={tri} onTrier={onTrier} />
            {voir('contact') ? (
              <EnteteTri cle="contact" libelle="Contact" tri={tri} onTrier={onTrier} />
            ) : null}
            {voir('tags') ? (
              <th scope="col" className="k-tags">
                Tags
              </th>
            ) : null}
            {voir('du') ? (
              <EnteteTri cle="du" libelle="Montant dû" tri={tri} onTrier={onTrier} num />
            ) : null}
            <th scope="col" className="c-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c, rang) => {
            const nom = nomAffichageClient(c)
            const du = resteDuClient(c)
            return (
              <tr key={c.id}>
                <td className="k-nom">
                  <Link to={`/clients/${c.id}`} className="client__nom">
                    {nom}
                  </Link>
                  <NatureTexte nature={c.nature} />
                </td>
                {voir('contact') ? (
                  <td className="k-contact">
                    {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : null}
                    {c.telephone ? <a href={`tel:${c.telephone}`}>{c.telephone}</a> : null}
                    {!c.email && !c.telephone ? <span className="client-vide">—</span> : null}
                  </td>
                ) : null}
                {voir('tags') ? (
                  <td className="k-tags">
                    <ListeTags tags={c.tags} />
                  </td>
                ) : null}
                {voir('du') ? (
                  <td className={`num k-du ${du > 0 ? 'k-du--du' : 'client-vide'}`}>
                    {du > 0 ? formaterEuro(du) : '—'}
                  </td>
                ) : null}
                <td className="c-actions">
                  <MenuLigne
                    client={c}
                    versLeHaut={clients.length > 3 && rang >= clients.length - 2}
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
