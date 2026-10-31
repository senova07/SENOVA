import { Bouton } from '@/ui/Bouton'
import { CaseACocher } from '@/ui/CaseACocher'
import { Icone } from '@/ui/Icone'
import { Menu, SeparateurMenu } from '@/ui/Menu'
import { formaterTaux } from '@/lib/format'
import { TAUX_TVA, type CategorieArticle } from '@shared/articles'
import { FILTRES_VIDES, compterFiltres, type FiltresAvances, type StatutFiltre } from './filtres'

interface Props {
  valeur: FiltresAvances
  categories: readonly CategorieArticle[]
  onChange(filtres: FiltresAvances): void
}

const STATUTS: readonly { id: StatutFiltre; libelle: string }[] = [
  { id: 'actifs', libelle: 'Actifs' },
  { id: 'archives', libelle: 'Archivés' },
  { id: 'tous', libelle: 'Tous' },
]

const basculer = <T,>(liste: readonly T[], v: T) =>
  liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]

/** Popover de filtres : statut (les archivés restent consultables ici), TVA, catégorie. */
export function FiltresArticles({ valeur, categories, onChange }: Props) {
  const n = compterFiltres(valeur)
  return (
    <Menu
      panneau={false}
      declencheur={({ ouvert, basculer: ouvrir }) => (
        <button
          type="button"
          className="btn btn--secondary btn--sm filtres__bouton"
          aria-haspopup="dialog"
          aria-expanded={ouvert}
          data-actif={n > 0 || undefined}
          onClick={ouvrir}
        >
          <Icone nom="filtres" taille={16} />
          Filtres
          {n > 0 ? <span className="filtres__compte num">{n}</span> : null}
        </button>
      )}
    >
      {(fermer) => (
        <div className="menu menu--droite filtres__pop" role="dialog" aria-label="Filtres avancés">
          <fieldset className="filtres__groupe">
            <legend className="menu__label">Statut</legend>
            {STATUTS.map((s) => (
              <label key={s.id} className="filtres__option">
                <input
                  type="radio"
                  name="statut-articles"
                  checked={valeur.statut === s.id}
                  autoFocus={valeur.statut === s.id}
                  onChange={() => onChange({ ...valeur, statut: s.id })}
                />
                {s.libelle}
              </label>
            ))}
          </fieldset>
          <SeparateurMenu />
          <fieldset className="filtres__groupe">
            <legend className="menu__label">Taux de TVA</legend>
            {TAUX_TVA.map((t) => (
              <CaseACocher
                key={t}
                libelle={formaterTaux(t)}
                checked={valeur.tva.includes(t)}
                onChange={() => onChange({ ...valeur, tva: basculer(valeur.tva, t) })}
              />
            ))}
          </fieldset>
          {categories.length ? (
            <>
              <SeparateurMenu />
              <fieldset className="filtres__groupe">
                <legend className="menu__label">Catégorie</legend>
                {categories.map((c) => (
                  <CaseACocher
                    key={c.id}
                    libelle={c.nom}
                    checked={valeur.categories.includes(c.id)}
                    onChange={() => onChange({ ...valeur, categories: basculer(valeur.categories, c.id) })}
                  />
                ))}
              </fieldset>
            </>
          ) : null}
          <div className="filtres__pied">
            <Bouton variante="fantome" taille="sm" disabled={n === 0} onClick={() => onChange(FILTRES_VIDES)}>
              Réinitialiser
            </Bouton>
            <Bouton taille="sm" onClick={fermer}>
              Fermer
            </Bouton>
          </div>
        </div>
      )}
    </Menu>
  )
}
