import { useEffect, useState } from 'react'
import { Bouton } from '@/ui/Bouton'
import { ControleSegmente } from '@/ui/ControleSegmente'
import { Icone } from '@/ui/Icone'
import { useMenu } from '@/ui/useMenu'
import { formaterEuro } from '@/lib/format'
import { apiArticles } from '@/services/articlesApi'
import type { Article } from '@shared/articles'
import { sansAccent } from './calculs'

interface Props {
  onArticle(article: Article): void
  onLigneVide(): void
}

type Catalogue = { etat: 'chargement' } | { etat: 'erreur' } | { etat: 'pret'; articles: Article[] }

const MAX_PROPOSES = 40

type Filtre = 'favoris' | 'tous'
const FILTRES: readonly { id: Filtre; libelle: string }[] = [
  { id: 'favoris', libelle: 'Favoris' },
  { id: 'tous', libelle: 'Tous les articles' },
]

/** « Ajouter un article » : recherche dans le vrai catalogue (API articles), favoris d'abord. */
export function SelecteurArticle({ onArticle, onLigneVide }: Props) {
  const { ouvert, ancre, basculer, fermer } = useMenu()
  const [catalogue, setCatalogue] = useState<Catalogue>({ etat: 'chargement' })
  const [requete, setRequete] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('favoris')

  // Chargé à la première ouverture, puis gardé.
  const chargeDemande = ouvert || catalogue.etat !== 'chargement'
  useEffect(() => {
    if (!chargeDemande) return
    let annule = false
    apiArticles.lister().then(
      (articles) => !annule && setCatalogue({ etat: 'pret', articles }),
      () => !annule && setCatalogue({ etat: 'erreur' }),
    )
    return () => {
      annule = true
    }
  }, [chargeDemande])

  const q = sansAccent(requete.trim())
  const propose =
    catalogue.etat === 'pret'
      ? catalogue.articles
          .filter((a) =>
            a.actif &&
            (q
              ? sansAccent(`${a.nom} ${a.reference ?? ''} ${a.description}`).includes(q)
              : filtre === 'tous' || a.favori),
          )
          .slice(0, MAX_PROPOSES)
      : []

  const choisir = (action: () => void) => {
    action()
    fermer()
    setRequete('')
  }

  return (
    <div className="menu-ancre" ref={ancre}>
      <Bouton variante="primaire" taille="sm" icone="plus" aria-expanded={ouvert} aria-haspopup="dialog" onClick={basculer}>
        Ajouter un article
      </Bouton>
      {ouvert ? (
        <div className="menu menu--gauche devis-selecteur" role="dialog" aria-label="Choisir un article">
          <div className="devis-recherche">
            <Icone nom="recherche" taille={15} className="devis-recherche__icone" />
            <input
              className="input"
              type="search"
              autoFocus
              placeholder="Rechercher dans le catalogue…"
              aria-label="Rechercher un article"
              value={requete}
              onChange={(ev) => setRequete(ev.target.value)}
            />
          </div>
          {requete ? null : (
            <ControleSegmente
              libelle="Articles affichés"
              valeur={filtre}
              onChoisir={(f) => setFiltre(f)}
              options={FILTRES}
            />
          )}
          <ul className="devis-selecteur__liste" aria-label="Articles du catalogue">
            {propose.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => choisir(() => onArticle(a))}>
                  <span className="devis-selecteur__nom">
                    {a.nom}
                    <small>
                      {[a.reference, a.unite].filter(Boolean).join(' · ')}
                    </small>
                  </span>
                  <span className="devis-selecteur__prix num">{formaterEuro(a.prixUnitaireHt)}</span>
                </button>
              </li>
            ))}
            {catalogue.etat === 'chargement' ? (
              <li className="devis-selecteur__vide" role="status">Chargement du catalogue…</li>
            ) : null}
            {catalogue.etat === 'erreur' ? (
              <li className="devis-selecteur__vide" role="alert">Catalogue indisponible. Utilisez une ligne vide.</li>
            ) : null}
            {catalogue.etat === 'pret' && !propose.length ? (
              <li className="devis-selecteur__vide" role="status">Aucun article ne correspond.</li>
            ) : null}
          </ul>
          <button type="button" className="devis-selecteur__libre" onClick={() => choisir(onLigneVide)}>
            <Icone nom="plus" taille={15} /> Ligne vide, hors catalogue
          </button>
        </div>
      ) : null}
    </div>
  )
}
