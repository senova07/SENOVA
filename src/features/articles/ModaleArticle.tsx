import { useState, type FormEvent } from 'react'
import { Bouton } from '@/ui/Bouton'
import { ChampSelect, ChampTexte, ChampZone } from '@/ui/Formulaire'
import { Dialogue } from '@/ui/Dialogue'
import { formaterEuro, formaterTaux, lireDecimal } from '@/lib/format'
import { apiArticles, apiCategories } from '@/services/articlesApi'
import { ErreurApi } from '@/services/http'
import { useToast } from '@/store/toastContext'
import {
  LIBELLES_TYPE_ARTICLE,
  TAUX_TVA,
  TAUX_TVA_DEFAUT,
  TYPES_ARTICLE,
  margeArticle,
  type Article,
  type CategorieArticle,
  type TypeArticle,
} from '@shared/articles'

interface Props {
  /** `null` = création. */
  article: Article | null
  categories: CategorieArticle[]
  unites: string[]
  onCategorieCreee(categorie: CategorieArticle): void
  /** Appelé après enregistrement réussi. */
  onEnregistre(): void
  onFermer(): void
}

interface Brouillon {
  nom: string
  reference: string
  type: TypeArticle
  description: string
  unite: string
  prixHt: string
  tva: string
  prixAchat: string
  categorieId: string
  favori: boolean
  actif: boolean
}

type Erreurs = Partial<Record<keyof Brouillon, string>>

const texteNombre = (n: number | null) => (n === null ? '' : String(n).replace('.', ','))

function brouillonDe(article: Article | null): Brouillon {
  return {
    nom: article?.nom ?? '',
    reference: article?.reference ?? '',
    type: article?.type ?? 'service',
    description: article?.description ?? '',
    unite: article?.unite ?? 'u',
    prixHt: texteNombre(article?.prixUnitaireHt ?? null),
    tva: texteNombre(article?.tauxTva ?? TAUX_TVA_DEFAUT),
    prixAchat: texteNombre(article?.prixAchatHt ?? null),
    categorieId: article?.categorieId ?? '',
    favori: article?.favori ?? false,
    actif: article?.actif ?? true,
  }
}

/** Champs de l'API vers champs du formulaire. */
const CHAMP_API: Record<string, keyof Brouillon> = {
  prixUnitaireHt: 'prixHt',
  tauxTva: 'tva',
  prixAchatHt: 'prixAchat',
  categorieId: 'categorieId',
  nom: 'nom',
  reference: 'reference',
  unite: 'unite',
  description: 'description',
}

function valider(b: Brouillon): Erreurs {
  const e: Erreurs = {}
  if (!b.nom.trim()) e.nom = 'Donnez un nom à l’article.'
  if (!b.unite.trim()) e.unite = 'Indiquez une unité.'
  const ht = lireDecimal(b.prixHt)
  if (ht === null || ht < 0) e.prixHt = 'Saisissez un prix HT valide (0 ou plus).'
  const tva = lireDecimal(b.tva)
  if (tva === null || tva < 0 || tva > 100) e.tva = 'Taux de TVA entre 0 et 100.'
  if (b.prixAchat.trim()) {
    const achat = lireDecimal(b.prixAchat)
    if (achat === null || achat < 0) e.prixAchat = 'Saisissez un prix d’achat valide.'
  }
  return e
}

export function ModaleArticle({
  article,
  categories,
  unites,
  onCategorieCreee,
  onEnregistre,
  onFermer,
}: Props) {
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
      const saisie = {
        nom: b.nom.trim(),
        reference: b.reference.trim() || null,
        type: b.type,
        description: b.description.trim(),
        unite: b.unite.trim(),
        prixUnitaireHt: lireDecimal(b.prixHt) ?? 0,
        tauxTva: lireDecimal(b.tva) ?? 0,
        prixAchatHt: achat,
        categorieId: b.categorieId ? Number(b.categorieId) : null,
        favori: b.favori,
        actif: b.actif,
      }
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
      if (Object.keys(parChamp).length === 0 && /référence/i.test(e.message)) {
        parChamp.reference = e.message
      }
      setErreurs(parChamp)
      if (Object.keys(parChamp).length === 0) setGeneral(e.message)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Dialogue
      ouvert
      onFermer={onFermer}
      titre={article ? 'Modifier l’article' : 'Nouvel article'}
      soustitre="Ce que vous vendez, avec son unité et son prix."
      pied={
        <>
          <Bouton onClick={onFermer} disabled={enCours}>
            Annuler
          </Bouton>
          <Bouton type="submit" form="form-article" variante="primaire" disabled={enCours}>
            {article ? 'Enregistrer' : 'Créer l’article'}
          </Bouton>
        </>
      }
    >
      <form
        id="form-article"
        className="form-articles"
        onSubmit={(e) => void enregistrer(e)}
        noValidate
      >
        {general ? (
          <p className="alerte-form" role="alert">
            {general}
          </p>
        ) : null}
        <ChampTexte
          libelle="Nom"
          value={b.nom}
          onChange={(e) => maj('nom', e.target.value)}
          erreur={erreurs.nom}
          maxLength={200}
          required
        />
        <div className="form-articles__duo">
          <ChampTexte
            libelle="Référence"
            value={b.reference}
            onChange={(e) => maj('reference', e.target.value)}
            erreur={erreurs.reference}
            maxLength={60}
          />
          <ChampSelect
            libelle="Type"
            value={b.type}
            onChange={(e) => maj('type', e.target.value as TypeArticle)}
          >
            {TYPES_ARTICLE.map((t) => (
              <option key={t} value={t}>
                {LIBELLES_TYPE_ARTICLE[t]}
              </option>
            ))}
          </ChampSelect>
        </div>
        <ChampZone
          libelle="Description"
          value={b.description}
          onChange={(e) => maj('description', e.target.value)}
          erreur={erreurs.description}
        />
        <div className="form-articles__trio">
          <ChampTexte
            libelle="Prix HT (€)"
            inputMode="decimal"
            value={b.prixHt}
            onChange={(e) => maj('prixHt', e.target.value)}
            erreur={erreurs.prixHt}
            required
          />
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
        </div>
        <ChampTexte
          libelle="Prix d’achat HT (€), facultatif"
          inputMode="decimal"
          value={b.prixAchat}
          onChange={(e) => maj('prixAchat', e.target.value)}
          erreur={erreurs.prixAchat}
          aide="Renseigné, il permet de suivre votre marge."
        />
        {marge ? (
          <p className="marge-live" aria-live="polite">
            Marge : <strong>{formaterEuro(marge.montant)}</strong> HT ({formaterTaux(marge.taux)} du
            coût)
          </p>
        ) : null}

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

        <label className="case">
          <input
            type="checkbox"
            checked={b.favori}
            onChange={(e) => maj('favori', e.target.checked)}
          />
          Favori (proposé en premier)
        </label>
        <label className="case">
          <input type="checkbox" checked={b.actif} onChange={(e) => maj('actif', e.target.checked)} />
          Actif (proposé dans les documents)
        </label>
      </form>
    </Dialogue>
  )
}
