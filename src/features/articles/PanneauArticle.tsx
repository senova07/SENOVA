import { Bouton } from '@/ui/Bouton'
import { ChampSelect, ChampTexte, ChampZone } from '@/ui/Formulaire'
import { Interrupteur } from '@/ui/Interrupteur'
import { PanneauLateral } from '@/ui/PanneauLateral'
import { formaterEuro, formaterTaux } from '@/lib/format'
import { LIBELLES_TYPE_ARTICLE, TYPES_ARTICLE, type Article, type CategorieArticle, type TypeArticle } from '@shared/articles'
import { useFormulaireArticle } from './useFormulaireArticle'

interface Props {
  /** `null` = création. */
  article: Article | null
  categories: CategorieArticle[]
  unites: string[]
  onCategorieCreee(categorie: CategorieArticle): void
  onEnregistre(): void
  onFermer(): void
}

/** Panneau « Nouvel article » / « Modifier l'article » (maquette ArticleDrawer). */
export function PanneauArticle({ article, categories, unites, onCategorieCreee, onEnregistre, onFermer }: Props) {
  const {
    b,
    maj,
    erreurs,
    general,
    enCours,
    marge,
    taux,
    nouvelleCategorie,
    setNouvelleCategorie,
    erreurCategorie,
    creerCategorie,
    enregistrer,
  } = useFormulaireArticle(article, onCategorieCreee, onEnregistre)

  return (
    <PanneauLateral
      ouvert
      onFermer={onFermer}
      titre={article ? 'Modifier l’article' : 'Nouvel article'}
      soustitre={article ? 'Ce que vous vendez, avec son unité et son prix.' : 'Ajoutez un produit ou service à votre catalogue.'}
      pied={
        <>
          <Bouton taille="lg" onClick={onFermer} disabled={enCours}>
            Annuler
          </Bouton>
          <Bouton type="submit" form="form-article" variante="primaire" taille="lg" disabled={enCours}>
            Enregistrer l’article
          </Bouton>
        </>
      }
    >
      <form id="form-article" className="form-articles" onSubmit={(e) => void enregistrer(e)} noValidate>
        {general ? (
          <p className="alerte-form" role="alert">
            {general}
          </p>
        ) : null}
        <ChampSelect libelle="Type d’article" value={b.type} onChange={(e) => maj('type', e.target.value as TypeArticle)}>
          {TYPES_ARTICLE.map((t) => (
            <option key={t} value={t}>
              {LIBELLES_TYPE_ARTICLE[t]}
            </option>
          ))}
        </ChampSelect>
        <ChampTexte
          libelle="Nom de l’article"
          placeholder="Ex. : Entretien chaudière annuel"
          value={b.nom}
          onChange={(e) => maj('nom', e.target.value)}
          erreur={erreurs.nom}
          maxLength={200}
          required
        />
        <ChampZone
          libelle="Description"
          rows={3}
          value={b.description}
          onChange={(e) => maj('description', e.target.value)}
          erreur={erreurs.description}
        />
        <div className="form-articles__duo">
          <ChampTexte
            libelle="Référence interne"
            value={b.reference}
            onChange={(e) => maj('reference', e.target.value)}
            erreur={erreurs.reference}
            maxLength={60}
          />
          <ChampSelect
            libelle="Catégorie"
            value={b.categorieId}
            onChange={(e) => maj('categorieId', e.target.value)}
            erreur={erreurs.categorieId}
          >
            <option value="">Sans catégorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </ChampSelect>
        </div>
        {nouvelleCategorie === null ? (
          <Bouton taille="sm" icone="plus" onClick={() => setNouvelleCategorie('')}>
            Nouvelle catégorie
          </Bouton>
        ) : (
          <div className="form-articles__inline">
            <ChampTexte
              libelle="Nom de la nouvelle catégorie"
              value={nouvelleCategorie}
              onChange={(e) => setNouvelleCategorie(e.target.value)}
              erreur={erreurCategorie || undefined}
              maxLength={80}
            />
            <Bouton onClick={() => void creerCategorie()}>Ajouter</Bouton>
          </div>
        )}
        <div className="form-articles__duo">
          <ChampTexte
            libelle="Unité"
            list="unites-articles"
            value={b.unite}
            onChange={(e) => maj('unite', e.target.value)}
            erreur={erreurs.unite}
            maxLength={30}
            required
          />
          <datalist id="unites-articles">
            {unites.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <ChampTexte
            libelle="Prix de vente HT"
            suffixe="€"
            inputMode="decimal"
            placeholder="0,00"
            value={b.prixHt}
            onChange={(e) => maj('prixHt', e.target.value)}
            erreur={erreurs.prixHt}
            required
          />
        </div>
        <div className="form-articles__duo">
          <ChampSelect
            libelle="TVA"
            value={b.tva.replace(',', '.')}
            onChange={(e) => maj('tva', e.target.value)}
            erreur={erreurs.tva}
          >
            {taux.map((t) => (
              <option key={t} value={t}>
                {formaterTaux(Number(t))}
              </option>
            ))}
          </ChampSelect>
          <ChampTexte
            libelle="Prix d’achat HT (facultatif)"
            suffixe="€"
            inputMode="decimal"
            placeholder="0,00"
            value={b.prixAchat}
            onChange={(e) => maj('prixAchat', e.target.value)}
            erreur={erreurs.prixAchat}
          />
        </div>
        {marge ? (
          <p className="marge-live" aria-live="polite">
            Marge : <strong>{formaterEuro(marge.montant)}</strong> HT ({formaterTaux(marge.taux)} du coût)
          </p>
        ) : null}
        <Interrupteur
          libelle="Ajouter aux favoris"
          aide="Cet article sera proposé en premier dans vos documents."
          checked={b.favori}
          onChange={(e) => maj('favori', e.target.checked)}
        />
      </form>
    </PanneauLateral>
  )
}
