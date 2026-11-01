import type { ReactNode } from 'react'
import type { CategorieArticle } from '@shared/articles'
import { Bouton, BoutonIcone } from '@/ui/Bouton'
import { BoutonMenu } from '@/ui/BoutonMenu'
import { CaseACocher } from '@/ui/CaseACocher'
import { Icone, type NomIcone } from '@/ui/Icone'
import { ElementMenu, Menu } from '@/ui/Menu'
import { COLONNES, type CleChamp, type Defauts } from './modele'
import { PanneauDefauts, PanneauRemplir, type ChampRemplir } from './PanneauxOutils'

interface Props {
  nbSelection: number
  nbRemplies: number
  categories: readonly CategorieArticle[]
  defauts: Defauts
  masquees: ReadonlySet<CleChamp>
  agrandi: boolean
  occupe: boolean
  onAjouter(n: number): void
  onSupprimer(): void
  onDupliquer(): void
  onRemplir(cle: ChampRemplir, valeur: string, portee: 'selection' | 'toutes', videsSeulement: boolean): void
  onDefauts(patch: Partial<Defauts>): void
  onBasculerColonne(cle: CleChamp): void
  onAgrandir(): void
}

/** Un déclencheur de panneau (formulaire dans un menu) : `aria-expanded`, Échap et clic extérieur viennent de `Menu`. */
function Panneau({ libelle, icone, aligne = 'gauche', children }: { libelle: string; icone: NomIcone; aligne?: 'gauche' | 'droite'; children(fermer: () => void): ReactNode }) {
  return (
    <Menu
      panneau={false}
      declencheur={({ ouvert, basculer }) => (
        <button type="button" className="btn btn--secondary btn--sm" aria-haspopup="true" aria-expanded={ouvert} onClick={basculer}>
          <Icone nom={icone} taille={16} /> {libelle} <Icone nom="chevron_bas" taille={12} poids="bold" />
        </button>
      )}
    >
      {(fermer) => <div className={`panneau-outil-ancre panneau-outil-ancre--${aligne}`} role="group" aria-label={libelle}>{children(fermer)}</div>}
    </Menu>
  )
}

export function BarreOutilsImport(p: Props) {
  const pasDeSelection = p.nbSelection === 0
  return (
    <div className="barre-outils" role="toolbar" aria-label="Outils du tableau">
      <BoutonMenu libelle="Ajouter une ligne" icone="plus" onPrincipal={() => p.onAjouter(1)} libelleMenu="Ajouter plusieurs lignes">
        {(fermer) => [10, 25, 50].map((n) => (
          <ElementMenu key={n} icone="plus" onClick={() => { p.onAjouter(n); fermer() }}>Ajouter {n} lignes</ElementMenu>
        ))}
      </BoutonMenu>
      <span className="barre-outils__sep" aria-hidden="true" />
      <Bouton taille="sm" icone="poubelle" disabled={pasDeSelection || p.occupe} onClick={p.onSupprimer}>Supprimer</Bouton>
      <Bouton taille="sm" icone="copier" disabled={pasDeSelection || p.occupe} onClick={p.onDupliquer}>Dupliquer</Bouton>
      <span className="barre-outils__sep" aria-hidden="true" />
      <Panneau libelle="Remplir" icone="palette">
        {(fermer) => (
          <PanneauRemplir
            nbSelection={p.nbSelection}
            nbRemplies={p.nbRemplies}
            categories={p.categories}
            onAppliquer={(...a) => { p.onRemplir(...a); fermer() }}
          />
        )}
      </Panneau>
      <Panneau libelle="Valeurs par défaut" icone="reglages">
        {() => <PanneauDefauts defauts={p.defauts} categories={p.categories} onChange={p.onDefauts} />}
      </Panneau>
      <div className="barre-outils__droite">
        <Panneau libelle="Colonnes" icone="colonnes" aligne="droite">
          {() => (
            <div className="panneau-outil">
              <p className="panneau-outil__intro">Colonnes affichées</p>
              {COLONNES.filter((c) => c.masquable).map((c) => (
                <CaseACocher key={c.cle} libelle={c.libelle} checked={!p.masquees.has(c.cle)} onChange={() => p.onBasculerColonne(c.cle)} />
              ))}
            </div>
          )}
        </Panneau>
        <BoutonIcone icone={p.agrandi ? 'replier' : 'ouvrir'} libelle={p.agrandi ? 'Réduire le tableau' : 'Agrandir le tableau'} aria-pressed={p.agrandi} onClick={p.onAgrandir} />
      </div>
    </div>
  )
}
