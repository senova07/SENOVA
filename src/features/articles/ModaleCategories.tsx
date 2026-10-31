import { useState, type FormEvent } from 'react'
import { Bouton } from '@/components/ui/Bouton'
import { ChampTexte } from '@/components/ui/Formulaire'
import { Modale } from '@/components/ui/Modale'
import { apiCategories } from '@/services/articlesApi'
import type { Article, CategorieArticle } from '@shared/articles'

interface Props {
  categories: CategorieArticle[]
  articles: Article[]
  /** Appelé après chaque écriture : le catalogue se relit. */
  onChange(): void
  onFermer(): void
}

/** Créer, renommer, supprimer les catégories. */
export function ModaleCategories({ categories, articles, onChange, onFermer }: Props) {
  const [nouveau, setNouveau] = useState('')
  const [edition, setEdition] = useState<{ id: string; nom: string } | null>(null)
  const [suppression, setSuppression] = useState<string | null>(null)
  const [erreur, setErreur] = useState('')

  const executer = async (action: () => Promise<unknown>): Promise<boolean> => {
    setErreur('')
    try {
      await action()
      onChange()
      return true
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Action impossible.')
      return false
    }
  }

  const creer = async (evenement: FormEvent) => {
    evenement.preventDefault()
    if (!nouveau.trim()) return setErreur('Donnez un nom à la catégorie.')
    if (await executer(() => apiCategories.creer(nouveau.trim()))) setNouveau('')
  }

  const renommer = async (evenement: FormEvent) => {
    evenement.preventDefault()
    if (!edition) return
    if (!edition.nom.trim()) return setErreur('Donnez un nom à la catégorie.')
    if (await executer(() => apiCategories.renommer(edition.id, edition.nom.trim()))) setEdition(null)
  }

  return (
    <Modale
      ouvert
      onFermer={onFermer}
      titre="Catégories"
      soustitre="Rangez vos articles par famille."
      pied={<Bouton onClick={onFermer}>Fermer</Bouton>}
    >
      {erreur ? (
        <p className="alerte-form" role="alert">
          {erreur}
        </p>
      ) : null}
      <form className="form-articles__inline" onSubmit={(e) => void creer(e)}>
        <ChampTexte
          libelle="Nouvelle catégorie"
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          maxLength={80}
        />
        <Bouton type="submit" variante="primaire">
          Créer
        </Bouton>
      </form>

      {categories.length === 0 ? (
        <p className="champ__aide categories__vide">Aucune catégorie pour le moment.</p>
      ) : (
        <ul className="categories">
          {categories.map((c) => {
            const nombre = articles.filter((a) => a.categorieId === c.id).length
            return (
              <li key={c.id} className="categories__ligne">
                {edition?.id === c.id ? (
                  <form className="form-articles__inline" onSubmit={(e) => void renommer(e)}>
                    <ChampTexte
                      libelle={`Nom de ${c.nom}`}
                      value={edition.nom}
                      onChange={(e) => setEdition({ id: c.id, nom: e.target.value })}
                      maxLength={80}
                    />
                    <Bouton type="submit" variante="primaire">
                      Valider
                    </Bouton>
                    <Bouton onClick={() => setEdition(null)}>Annuler</Bouton>
                  </form>
                ) : suppression === c.id ? (
                  <>
                    <span className="categories__nom">
                      Supprimer « {c.nom} » ? Ses {nombre} article(s) resteront, sans catégorie.
                    </span>
                    <Bouton
                      variante="danger"
                      onClick={() =>
                        void executer(() => apiCategories.supprimer(c.id)).then(() =>
                          setSuppression(null),
                        )
                      }
                    >
                      Confirmer
                    </Bouton>
                    <Bouton onClick={() => setSuppression(null)}>Garder</Bouton>
                  </>
                ) : (
                  <>
                    <span className="categories__nom">
                      {c.nom} <span className="champ__aide">({nombre})</span>
                    </span>
                    <Bouton
                      variante="fantome"
                      icone="crayon"
                      aria-label={`Renommer ${c.nom}`}
                      onClick={() => setEdition({ id: c.id, nom: c.nom })}
                    />
                    <Bouton
                      variante="fantome"
                      icone="poubelle"
                      aria-label={`Supprimer ${c.nom}`}
                      onClick={() => setSuppression(c.id)}
                    />
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Modale>
  )
}
