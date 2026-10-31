import { Link } from 'react-router-dom'
import { EtatVide } from '@/ui/EtatVide'
import { Icone } from '@/ui/Icone'
import { ElementMenu, MenuLigne } from '@/ui/Menu'
import type { Action } from './actionsAujourdhui'

interface Props {
  actions: readonly Action[]
  masquees: ReadonlySet<string>
  relancees: ReadonlySet<string>
  nbMasquees: number
  afficherMasquees: boolean
  onBasculerAffichage(): void
  onRelancer(action: Action): void
  onBasculerMasquee(id: string): void
}

interface PropsLigne {
  action: Action
  masquee: boolean
  relancee: boolean
  onRelancer(a: Action): void
  onBasculerMasquee(id: string): void
}

function LigneAction({ action: a, masquee, relancee, onRelancer, onBasculerMasquee }: PropsLigne) {
  const urgent = a.urgent && !relancee
  return (
    <tr className="tableau__ligne" data-masquee={masquee || undefined}>
      <td className="tableau__col-principale">
        <div className="aujourdhui-action">
          <Icone
            nom={a.icone}
            taille={20}
            className={a.urgent ? 'aujourdhui-action__icone aujourdhui-action__icone--danger' : 'aujourdhui-action__icone'}
          />
          <div className="aujourdhui-action__texte">
            <p className="tableau__titre">
              {a.client}
              <span className="aujourdhui-action__objet"> · {a.objet}</span>
            </p>
            <p className={urgent ? 'tableau__sous aujourdhui-action__contexte--danger' : 'tableau__sous'}>
              {a.contexte}
            </p>
          </div>
        </div>
      </td>
      <td>
        {relancee ? (
          <span className="aujourdhui-fait">
            <Icone nom="valider" taille={16} />
            Relancé aujourd'hui
          </span>
        ) : a.bouton.lien ? (
          <Link to={a.bouton.lien} className="btn btn--secondary btn--sm">
            {a.bouton.libelle}
          </Link>
        ) : (
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => onRelancer(a)}>
            {a.bouton.libelle}
          </button>
        )}
      </td>
      <td className="tableau__col-actions">
        <MenuLigne libelle={`Plus d'actions pour ${a.client}`}>
          {(fermer) => (
            <ElementMenu
              icone={masquee ? 'apercu' : 'archive'}
              onClick={() => {
                fermer()
                onBasculerMasquee(a.id)
              }}
            >
              {masquee ? 'Ne plus masquer' : 'Masquer'}
            </ElementMenu>
          )}
        </MenuLigne>
      </td>
    </tr>
  )
}

/** Bloc « À faire » : relances et suites à donner, du plus urgent au moins urgent. */
export function ListeActions({
  actions,
  masquees,
  relancees,
  nbMasquees,
  afficherMasquees,
  onBasculerAffichage,
  onRelancer,
  onBasculerMasquee,
}: Props) {
  return (
    <section className="aujourdhui-bloc" aria-labelledby="titre-a-faire">
      <header className="aujourdhui-bloc__entete">
        <h2 id="titre-a-faire">À faire</h2>
        {nbMasquees ? (
          <button type="button" className="aujourdhui-lien" onClick={onBasculerAffichage}>
            {afficherMasquees ? 'Cacher' : 'Afficher'} les actions masquées ({nbMasquees})
          </button>
        ) : null}
      </header>

      {actions.length === 0 ? (
        <EtatVide icone="accepte" titre="Tout est à jour" texte="Aucune relance ni devis en attente d'action." />
      ) : (
        <div className="tableau-cadre">
          <table className="tableau">
            <thead>
              <tr>
                <th scope="col">Action à mener</th>
                <th scope="col">
                  <span className="sr-only">Relancer ou ouvrir</span>
                </th>
                <th scope="col" className="tableau__col-actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <LigneAction
                  key={a.id}
                  action={a}
                  masquee={masquees.has(a.id)}
                  relancee={relancees.has(a.id)}
                  onRelancer={onRelancer}
                  onBasculerMasquee={onBasculerMasquee}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
