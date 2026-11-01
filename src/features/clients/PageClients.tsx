import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bouton } from '@/ui/Bouton'
import { ChampRecherche } from '@/ui/ChampRecherche'
import { EntetePage } from '@/ui/EntetePage'
import { EtatVide } from '@/ui/EtatVide'
import { Onglets } from '@/ui/Onglets'
import { Pagination } from '@/ui/Pagination'
import { useSession } from '@/store/sessionContext'
import { nomAffichageClient } from '@shared/clients'
import { BarreOutilsClients } from './BarreOutilsClients'
import { DialogueArchivage } from './DialogueArchivage'
import { ListeClients } from './ListeClients'
import { ModaleClient } from './ModaleClient'
import { useActionsClients } from './useActionsClients'
import { useVueClients } from './useVueClients'
import { ONGLETS, ongletDepuisUrl, type OngletClients } from './vueClients'
import './clients.css'

export function PageClients() {
  const { peut } = useSession()
  const navigate = useNavigate()
  const peutGerer = peut('clients.gerer')
  const [parametres, setParametres] = useSearchParams()
  const actions = useActionsClients(peutGerer)
  const { calque, enCours } = actions

  const onglet = ongletDepuisUrl(parametres.get('onglet'))
  const archives = onglet === 'archives'
  const vue = useVueClients(onglet, actions.version)
  const { base, source } = vue

  const choisirOnglet = (id: OngletClients) => {
    setParametres((actuels) => {
      const suite = new URLSearchParams(actuels)
      if (id === 'tous') suite.delete('onglet')
      else suite.set('onglet', id)
      return suite
    })
    vue.premierePage()
  }

  const nouveau = peutGerer ? (
    <Bouton variante="primaire" icone="plus" signature onClick={() => actions.ouvrir({ genre: 'client', client: null })}>
      Nouveau client
    </Bouton>
  ) : null

  const chargementInitial = !base.clients && !base.erreur
  const aucunClient = base.clients?.length === 0 && !archives && !vue.terme

  return (
    <>
      <EntetePage
        titre="Clients"
        sousTitre="Chaque relation commerciale, en un coup d’œil : coordonnées, devis et factures."
        actions={nouveau}
      />

      {base.erreur ? (
        <p className="alerte-form" role="alert">
          {base.erreur}
        </p>
      ) : chargementInitial ? (
        <p className="clients__chargement" role="status">
          Chargement des clients…
        </p>
      ) : aucunClient ? (
        <EtatVide
          icone="clients"
          titre="Votre premier client commence ici"
          texte="Ajoutez un client pour retrouver ses coordonnées, ses adresses, ses devis et ses factures."
          action={nouveau}
        />
      ) : (
        <>
          <ChampRecherche
            valeur={vue.saisie}
            onChange={vue.changerSaisie}
            libelle="Rechercher un client"
            placeholder="Nom, e-mail, téléphone, SIRET, ville…"
          />
          <Onglets libelle="Catégories de clients" prefixe="clients" onglets={ONGLETS} actif={onglet} onChoisir={choisirOnglet} />
          <BarreOutilsClients
            chiffres={vue.chiffres}
            tags={vue.tags}
            tag={vue.tag}
            soldeDu={vue.soldeDu}
            colonnes={vue.colonnes}
            onTag={vue.changerTag}
            onSolde={vue.changerSolde}
            onColonne={vue.basculerColonne}
          />

          <div
            role="tabpanel"
            id="clients-panneau"
            aria-labelledby={`clients-onglet-${onglet}`}
            aria-busy={source.enCours}
            className={source.enCours ? 'clients__en-cours' : undefined}
          >
            {source.erreur ? (
              <p className="alerte-form" role="alert">
                {source.erreur}
              </p>
            ) : !source.clients ? (
              <p className="clients__chargement" role="status">
                Chargement des clients…
              </p>
            ) : vue.affichees.length === 0 ? (
              <EtatVide
                icone={archives ? 'archive' : vue.filtre ? 'recherche' : 'clients'}
                titre={archives && !vue.filtre ? 'Aucun client archivé' : 'Aucun client trouvé'}
                texte={
                  vue.terme
                    ? `Rien ne correspond à « ${vue.terme} ».`
                    : archives && !vue.filtre
                      ? 'Les clients que vous archivez se retrouvent ici.'
                      : 'Essayez un autre onglet, ou élargissez les filtres.'
                }
              />
            ) : (
              <ListeClients
                clients={vue.affichees}
                colonnes={vue.colonnes}
                tri={vue.tri}
                onTrier={vue.trier}
                peutGerer={peutGerer}
                onModifier={(c) => void actions.modifier(c)}
                onArchiver={(c) => actions.ouvrir({ genre: 'archiver', client: c })}
                onRestaurer={(c) => void actions.restaurer(c)}
              />
            )}
          </div>

          <div className="clients-pied">
            {vue.total ? (
              <span className="num" aria-live="polite">
                {vue.debut + 1} à {vue.debut + vue.affichees.length} sur {vue.total} client{vue.total > 1 ? 's' : ''}
              </span>
            ) : (
              <span />
            )}
            {vue.pages > 1 ? <Pagination page={vue.page} pages={vue.pages} onChoisir={vue.allerPage} /> : null}
          </div>
        </>
      )}

      {calque?.genre === 'client' ? (
        <ModaleClient
          key={calque.client?.id ?? 'nouveau'}
          client={calque.client}
          onFermer={actions.fermer}
          onEnregistre={(c) => {
            actions.fermer()
            if (calque.client) actions.recharger()
            else navigate(`/clients/${c.id}`)
          }}
        />
      ) : null}

      {calque?.genre === 'archiver' ? (
        <DialogueArchivage
          nom={nomAffichageClient(calque.client)}
          enCours={enCours}
          onFermer={actions.fermer}
          onConfirmer={(motif) => void actions.archiver(calque.client, motif)}
        />
      ) : null}
    </>
  )
}
