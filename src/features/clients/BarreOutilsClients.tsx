import { Compteurs } from '@/ui/Compteurs'
import { Icone } from '@/ui/Icone'
import { ElementMenu, Menu } from '@/ui/Menu'
import { COLONNES_CLIENT, type ColonneClient } from './vueClients'

interface Props {
  chiffres: { total: number; professionnels: number; nouveauxCeMois: number } | null
  tags: readonly string[]
  tag: string
  soldeDu: boolean
  colonnes: ReadonlySet<ColonneClient>
  onTag(tag: string): void
  onSolde(du: boolean): void
  onColonne(colonne: ColonneClient): void
}

/** Compteurs à gauche ; filtres Tag et Solde et choix des colonnes à droite. */
export function BarreOutilsClients({ chiffres, tags, tag, soldeDu, colonnes, onTag, onSolde, onColonne }: Props) {
  return (
    <Compteurs
      compteurs={
        chiffres
          ? [
              { libelle: 'Clients', valeur: chiffres.total },
              { libelle: 'Pros', valeur: chiffres.professionnels },
              { libelle: 'Nouveaux ce mois', valeur: chiffres.nouveauxCeMois },
            ]
          : []
      }
      actions={
        <div className="clients-filtres">
          <select className="select" aria-label="Tag" value={tag} onChange={(e) => onTag(e.target.value)}>
            <option value="">Tag</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select className="select" aria-label="Solde" value={soldeDu ? 'du' : ''} onChange={(e) => onSolde(e.target.value === 'du')}>
            <option value="">Solde</option>
            <option value="du">Avec montant dû</option>
          </select>
          <Menu
            aligne="droite"
            libelle="Colonnes affichées"
            declencheur={({ ouvert, basculer }) => (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                aria-haspopup="menu"
                aria-expanded={ouvert}
                onClick={basculer}
              >
                <Icone nom="colonnes" taille={16} />
                Colonnes
              </button>
            )}
          >
            {() =>
              COLONNES_CLIENT.map((c) => (
                <ElementMenu
                  key={c.id}
                  role="menuitemcheckbox"
                  aria-checked={colonnes.has(c.id)}
                  onClick={() => onColonne(c.id)}
                >
                  <span className="clients-coche" aria-hidden="true">
                    {colonnes.has(c.id) ? <Icone nom="valider" taille={14} poids="bold" /> : null}
                  </span>
                  {c.libelle}
                </ElementMenu>
              ))
            }
          </Menu>
        </div>
      }
    />
  )
}
