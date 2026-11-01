import { Bouton } from '@/ui/Bouton'
import type { Article } from '@shared/articles'
import { Champs } from './Champs'
import { LigneEditable } from './LigneEditable'
import { SelecteurArticle } from './SelecteurArticle'
import { nouvelId, sousTotalSection } from './calculs'
import { useGlisserLignes } from './useGlisserLignes'
import type { LigneDevis } from './types'

interface Props {
  lignes: readonly LigneDevis[]
  lectureSeule: boolean
  onLignes(lignes: LigneDevis[]): void
}

const vide = (genre: LigneDevis['genre']): LigneDevis => ({
  id: nouvelId(),
  genre,
  designation: '',
  quantite: genre === 'article' ? 1 : 0,
  unite: genre === 'article' ? 'forfait' : '',
  prixUnitaireHt: 0,
  tauxTva: genre === 'article' ? 20 : 0,
  remisePourcent: 0,
})

export function SectionLignes({ lignes, lectureSeule, onLignes }: Props) {
  const glisser = useGlisserLignes(lignes, onLignes)

  const ajouter = (ligne: LigneDevis) => {
    onLignes([...lignes, ligne])
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-ligne="${ligne.id}"] input`)?.focus(),
    )
  }
  const depuisArticle = (a: Article): LigneDevis => ({
    ...vide('article'),
    designation: a.nom,
    description: a.description || undefined,
    reference: a.reference ?? undefined,
    unite: a.unite,
    prixUnitaireHt: a.prixUnitaireHt,
    tauxTva: a.tauxTva,
  })
  const modifier = (id: string, patch: Partial<LigneDevis>) =>
    onLignes(lignes.map((l) => (l.id === id ? { ...l, ...patch } : l)))

  return (
    <Champs desactive={lectureSeule}>
      <div className="devis-outils">
        <SelecteurArticle
          onArticle={(a) => ajouter(depuisArticle(a))}
          onLigneVide={() => ajouter(vide('article'))}
        />
        <Bouton taille="sm" icone="section" onClick={() => ajouter(vide('section'))}>
          Ajouter une section
        </Bouton>
        <Bouton taille="sm" icone="texte" onClick={() => ajouter(vide('texte'))}>
          Texte libre
        </Bouton>
      </div>
      {lignes.length === 0 ? (
        <p className="devis-lignes__vide">
          Aucune ligne pour l’instant. Ajoutez un article du catalogue ou une section.
        </p>
      ) : (
        <ul className="devis-lignes" aria-label="Lignes du devis" onDragEnd={glisser.fin}>
          {lignes.map((l, i) => (
            <LigneEditable
              key={l.id}
              ligne={l}
              rang={i + 1}
              sousTotal={l.genre === 'section' ? sousTotalSection(lignes, i) : 0}
              glisser={glisser}
              onModifier={modifier}
              onSupprimer={(id) => onLignes(lignes.filter((x) => x.id !== id))}
            />
          ))}
        </ul>
      )}
    </Champs>
  )
}
