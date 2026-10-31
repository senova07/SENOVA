import { useState, type FormEvent } from 'react'
import { lireDecimal } from '@/lib/format'
import { apiArticles, apiCategories } from '@/services/articlesApi'
import { ErreurApi } from '@/services/http'
import { useToast } from '@/store/toastContext'
import { TAUX_TVA, margeArticle, type Article, type CategorieArticle } from '@shared/articles'
import { CHAMP_API, brouillonDe, valider, versSaisie, type Brouillon, type Erreurs } from './saisie'

/** État du formulaire article : brouillon, validation, marge en direct, création de catégorie et enregistrement. */
export function useFormulaireArticle(
  article: Article | null,
  onCategorieCreee: (categorie: CategorieArticle) => void,
  onEnregistre: () => void,
) {
  const { notifier } = useToast()
  const [b, setB] = useState<Brouillon>(() => brouillonDe(article))
  const [erreurs, setErreurs] = useState<Erreurs>({})
  const [general, setGeneral] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [nouvelleCategorie, setNouvelleCategorie] = useState<string | null>(null)
  const [erreurCategorie, setErreurCategorie] = useState('')

  const maj = <C extends keyof Brouillon>(champ: C, valeur: Brouillon[C]) =>
    setB((precedent) => ({ ...precedent, [champ]: valeur }))

  const ht = lireDecimal(b.prixHt)
  const achat = b.prixAchat.trim() ? lireDecimal(b.prixAchat) : null
  const marge =
    ht !== null && achat !== null ? margeArticle({ prixUnitaireHt: ht, prixAchatHt: achat }) : null
  // Un taux hors liste (donnée ancienne) reste sélectionnable.
  const taux = [...new Set([...TAUX_TVA.map(String), b.tva.replace(',', '.')])]

  const creerCategorie = async () => {
    const nom = (nouvelleCategorie ?? '').trim()
    if (!nom) return setErreurCategorie('Donnez un nom à la catégorie.')
    try {
      const creee = await apiCategories.creer(nom)
      onCategorieCreee(creee)
      maj('categorieId', creee.id)
      setNouvelleCategorie(null)
      setErreurCategorie('')
    } catch (e) {
      setErreurCategorie(e instanceof Error ? e.message : 'Création impossible.')
    }
  }

  const enregistrer = async (evenement: FormEvent) => {
    evenement.preventDefault()
    const trouvees = valider(b)
    setErreurs(trouvees)
    setGeneral('')
    if (Object.keys(trouvees).length > 0) return

    setEnCours(true)
    try {
      const saisie = versSaisie(b, article?.actif ?? true)
      if (article) await apiArticles.modifier(article.id, saisie)
      else await apiArticles.creer(saisie)
      notifier(article ? 'Article modifié' : 'Article créé', { message: saisie.nom, ton: 'succes' })
      onEnregistre()
    } catch (e) {
      if (!(e instanceof ErreurApi)) return setGeneral('Enregistrement impossible.')
      const parChamp: Erreurs = {}
      for (const d of e.details) {
        const champ = d.field ? CHAMP_API[d.field] : undefined
        if (champ) parChamp[champ] = d.message
      }
      // Les règles métier (ex. référence déjà prise) arrivent sans champ.
      if (Object.keys(parChamp).length === 0 && /référence/i.test(e.message)) parChamp.reference = e.message
      setErreurs(parChamp)
      if (Object.keys(parChamp).length === 0) setGeneral(e.message)
    } finally {
      setEnCours(false)
    }
  }

  return {
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
  }
}
