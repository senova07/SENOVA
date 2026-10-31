import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bouton } from '@/ui/Bouton'
import { Carte } from '@/ui/Carte'
import { EtatVide } from '@/ui/EtatVide'
import { Icone } from '@/ui/Icone'
import { MenuDeroulant } from '@/ui/Menu'
import { Dialogue } from '@/ui/Dialogue'
import { Onglets } from '@/ui/Onglets'
import { Pagination } from '@/ui/Pagination'
import { formaterTaux } from '@/lib/format'
import { apiArticles } from '@/services/articlesApi'
import { useSession } from '@/store/sessionContext'
import { useToast } from '@/store/toastContext'
import { LIBELLES_TYPE_ARTICLE, TAUX_TVA, type Article, type TypeArticle } from '@shared/articles'
import { COLONNES, type CleTri, type Colonne, type Tri } from './catalogue'
import { ListeArticles } from './ListeArticles'
import { ModaleArticle } from './ModaleArticle'
import { ModaleCategories } from './ModaleCategories'
import { ModaleOrdre } from './ModaleOrdre'
import { useCatalogue } from './useCatalogue'
import './articles.css'

const PAR_PAGE = 12

/** `types` absent = tous les types ; « Archivés » = articles inactifs. */
const ONGLETS: readonly {
  id: string
  libelle: string
  types?: readonly TypeArticle[]
}[] = [
  { id: 'tous', libelle: 'Tous' },
  { id: 'produits', libelle: 'Produits', types: ['produit'] },
  {
    id: 'services',
    libelle: 'Services',
    types: ['service', 'deplacement', 'abonnement'],
  },
  { id: 'main_oeuvre', libelle: "Main-d'œuvre", types: ['main_oeuvre'] },
  { id: 'forfaits', libelle: 'Packs / forfaits', types: ['forfait'] },
  { id: 'archives', libelle: 'Archivés' },
]

/** `null` dans la modale d'édition = création. */
type Dialogue =
  | { genre: 'article'; article: Article | null }
  | { genre: 'suppression'; article: Article }
  | { genre: 'ordre' }

const sansAccent = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const comparerTexte = new Intl.Collator('fr', {
  sensitivity: 'base',
  numeric: true,
}).compare

export function PageArticles() {
  const { peut } = useSession()
  const { notifier } = useToast()
  const peutGerer = peut('articles.gerer')
  const cat = useCatalogue()
  const [parametres, setParametres] = useSearchParams()

  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState('')
  const [tva, setTva] = useState('')
  const [statut, setStatut] = useState('')
  const [favoris, setFavoris] = useState(false)
  const [tri, setTri] = useState<Tri | null>(null)
  const [numero, setNumero] = useState(1)
  const [selection, setSelection] = useState<ReadonlySet<string>>(new Set())
  const [colonnes, setColonnes] = useState<ReadonlySet<Colonne>>(
    new Set(COLONNES.filter((c) => c.id !== 'marge').map((c) => c.id)),
  )
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)

  /** Modifie un paramètre d'URL sans toucher aux autres (`null` le retire). */
  const changerParametre = (cle: string, valeur: string | null, remplacer = false) =>
    setParametres(
      (actuels) => {
        const suite = new URLSearchParams(actuels)
        if (valeur === null) suite.delete(cle)
        else suite.set(cle, valeur)
        return suite
      },
      { replace: remplacer },
    )

  // Onglet et fenêtre des catégories vivent dans l'URL : liens directs depuis la sidebar (Catalogue).
  const ongletDemande = parametres.get('onglet')
  const onglet = ONGLETS.some((o) => o.id === ongletDemande) ? ongletDemande! : 'tous'
  const setOnglet = (id: string) => changerParametre('onglet', id === 'tous' ? null : id)
  const categoriesOuvertes = parametres.has('categories')
  // Sans le droit de gérer, le lien « Catégories » ne doit pas laisser une URL sans effet.
  useEffect(() => {
    if (categoriesOuvertes && !peutGerer)
      setParametres(
        (actuels) => {
          const suite = new URLSearchParams(actuels)
          suite.delete('categories')
          return suite
        },
        { replace: true },
      )
  }, [categoriesOuvertes, peutGerer, setParametres])

  // « + Nouveau → Article » de la topbar arrive ici avec ?nouveau=1.
  const demandeCreation = parametres.has('nouveau')
  useEffect(() => {
    if (!demandeCreation) return
    setParametres(
      (actuels) => {
        const suite = new URLSearchParams(actuels)
        suite.delete('nouveau')
        return suite
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ouverture demandée par l'URL
    if (peutGerer) setDialogue({ genre: 'article', article: null })
  }, [demandeCreation, peutGerer, setParametres])

  /** Tout changement de filtre revient en page 1. */
  const filtrer =
    <T,>(changer: (v: T) => void) =>
    (v: T) => {
      changer(v)
      setNumero(1)
    }

  const ongletCourant = ONGLETS.find((o) => o.id === onglet) ?? ONGLETS[0]!
  const terme = sansAccent(recherche.trim())
  const categorieValide = cat.categories.some((c) => c.id === categorie) ? categorie : ''
  const categorieNom = (id: string | null) => cat.categories.find((c) => c.id === id)?.nom

  const visibles = cat.articles.filter(
    (a) =>
      (onglet !== 'archives' || !a.actif) &&
      (!ongletCourant.types || ongletCourant.types.includes(a.type)) &&
      (!statut || a.actif === (statut === 'actif')) &&
      (!categorieValide || a.categorieId === categorieValide) &&
      (!tva || a.tauxTva === Number(tva)) &&
      (!favoris || a.favori) &&
      (!terme || sansAccent(`${a.nom} ${a.reference ?? ''} ${a.description}`).includes(terme)),
  )

  const valeurTri = (a: Article, cle: CleTri): string | number => {
    switch (cle) {
      case 'nom':
        return a.nom
      case 'type':
        return LIBELLES_TYPE_ARTICLE[a.type]
      case 'categorie':
        return categorieNom(a.categorieId) ?? ''
      case 'prix':
        return a.prixUnitaireHt
      case 'tva':
        return a.tauxTva
      case 'unite':
        return a.unite
      case 'statut':
        return a.actif ? 0 : 1
    }
  }
  const tries = [...visibles].sort((a, b) => {
    // Sans tri choisi : favoris d'abord, puis l'ordre du catalogue (déjà celui du serveur).
    if (!tri) return Number(b.favori) - Number(a.favori)
    const va = valeurTri(a, tri.cle)
    const vb = valeurTri(b, tri.cle)
    const ecart =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : comparerTexte(String(va), String(vb))
    return tri.sens === 'asc' ? ecart : -ecart
  })

  const nbSelection = tries.filter((a) => selection.has(a.id)).length
  const pages = Math.max(1, Math.ceil(tries.length / PAR_PAGE))
  const page = Math.min(numero, pages)
  const debut = (page - 1) * PAR_PAGE
  const affichees = tries.slice(debut, debut + PAR_PAGE)
  const nbFiltres = [categorieValide, tva, statut, favoris].filter(Boolean).length
  const filtre = Boolean(terme || nbFiltres || onglet !== 'tous')

  // Troisième clic sur la même colonne : retour à l'ordre du catalogue.
  const trier = filtrer((cle: CleTri) =>
    setTri((t) =>
      t?.cle !== cle ? { cle, sens: 'asc' } : t.sens === 'asc' ? { cle, sens: 'desc' } : null,
    ),
  )

  const cocher = (ids: string[], coche: boolean) =>
    setSelection((s) => {
      const suite = new Set(s)
      for (const id of ids) {
        if (coche) suite.add(id)
        else suite.delete(id)
      }
      return suite
    })

  const basculerColonne = (c: Colonne) =>
    setColonnes((s) => {
      const suite = new Set(s)
      if (!suite.delete(c)) suite.add(c)
      return suite
    })

  const reinitialiser = () => {
    setRecherche('')
    setCategorie('')
    setTva('')
    setStatut('')
    setFavoris(false)
    setNumero(1)
  }

  const fermer = () => setDialogue(null)
  const apresEcriture = () => {
    fermer()
    void cat.recharger()
  }
  const echec = (e: unknown) =>
    notifier('Action impossible', {
      message: e instanceof Error ? e.message : undefined,
      ton: 'alerte',
    })

  const basculerFavori = (a: Article) =>
    apiArticles.favori(a.id, !a.favori).then(cat.recharger, echec)

  const dupliquer = async (a: Article) => {
    try {
      const copie = await apiArticles.dupliquer(a.id)
      await cat.recharger()
      notifier('Article dupliqué', {
        message: 'Complétez la référence de la copie.',
        ton: 'succes',
      })
      setDialogue({ genre: 'article', article: copie })
    } catch (e) {
      echec(e)
    }
  }

  const supprimer = async (a: Article) => {
    try {
      await apiArticles.supprimer(a.id)
      notifier('Article supprimé', { message: a.nom, ton: 'succes' })
      cocher([a.id], false)
      apresEcriture()
    } catch (e) {
      fermer()
      echec(e)
    }
  }

  const stats = [
    {
      valeur: cat.articles.filter((a) => a.actif).length,
      libelle: 'Articles actifs',
    },
    { valeur: cat.categories.length, libelle: 'Catégories' },
    {
      valeur: cat.articles.filter((a) => a.actif && a.type === 'forfait').length,
      libelle: 'Packs / forfaits',
    },
  ]

  return (
    <>
      <header className="entete-articles">
        <span className="entete-articles__deco" aria-hidden="true" />
        <div className="entete-articles__texte">
          <nav aria-label="Fil d’Ariane" className="ariane">
            <span>Articles</span>
            <Icone nom="suivant" taille={12} />
            <span aria-current="page">
              {onglet === 'tous' ? 'Tous les articles' : ongletCourant.libelle}
            </span>
          </nav>
          <h1 className="entete-articles__titre">Articles</h1>
          <p className="entete-articles__sous">
            Gérez vos produits, services et main-d’œuvre. Utilisez-les dans vos devis et factures.
          </p>
        </div>
        {cat.etat === 'pret' ? (
          <dl className="stats-articles">
            {stats.map((s) => (
              <div key={s.libelle} className="stats-articles__item">
                <dt>{s.libelle}</dt>
                <dd>{s.valeur}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>

      {cat.etat === 'chargement' ? <p className="champ__aide">Chargement du catalogue…</p> : null}
      {cat.etat === 'erreur' ? (
        <Carte>
          <EtatVide
            titre="Le catalogue ne s’est pas chargé"
            texte={cat.erreur}
            action={<Bouton onClick={() => void cat.recharger()}>Réessayer</Bouton>}
          />
        </Carte>
      ) : null}

      {cat.etat === 'pret' && cat.articles.length === 0 ? (
        <Carte coin>
          <EtatVide
            icone="articles"
            titre="Votre catalogue est vide"
            texte="Créez vos premiers articles une fois : vous les retrouverez dans chaque devis et chaque facture."
            action={
              peutGerer ? (
                <Bouton
                  variante="primaire"
                  icone="plus"
                  onClick={() => setDialogue({ genre: 'article', article: null })}
                >
                  Créer un article
                </Bouton>
              ) : undefined
            }
          />
        </Carte>
      ) : null}

      {cat.etat === 'pret' && cat.articles.length > 0 ? (
        <section className="surface-articles" aria-label="Catalogue">
          <Onglets
            libelle="Familles d’articles"
            prefixe="articles"
            onglets={ONGLETS}
            actif={onglet}
            onChoisir={filtrer(setOnglet)}
          />

          <div className="outils-articles" role="search">
            <div className="recherche outils-articles__recherche">
              <span className="recherche__icone">
                <Icone nom="recherche" taille={18} />
              </span>
              <input
                className="recherche__saisie"
                type="search"
                placeholder="Rechercher un article…"
                aria-label="Rechercher un article"
                value={recherche}
                onChange={(e) => filtrer(setRecherche)(e.target.value)}
              />
            </div>

            <MenuDeroulant
              declencheur={({ ouvert, basculer }) => (
                <button
                  type="button"
                  className="outil"
                  aria-haspopup="dialog"
                  aria-expanded={ouvert}
                  onClick={basculer}
                >
                  <Icone nom="filtres" taille={18} />
                  Filtres
                  {nbFiltres ? <span className="outil__compte">{nbFiltres}</span> : null}
                </button>
              )}
            >
              {(fermer) => (
                <div className="menu__liste menu__liste--gauche">
                  <label className="case menu__case">
                    <input
                      type="checkbox"
                      checked={favoris}
                      onChange={(e) => filtrer(setFavoris)(e.target.checked)}
                    />
                    Favoris uniquement
                  </label>
                  <button
                    type="button"
                    className="menu__item"
                    disabled={!nbFiltres && !terme}
                    onClick={() => {
                      reinitialiser()
                      fermer()
                    }}
                  >
                    <Icone nom="restaurer" taille={18} />
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </MenuDeroulant>

            <select
              className="outil outil--select"
              aria-label="Catégorie"
              value={categorieValide}
              onChange={(e) => filtrer(setCategorie)(e.target.value)}
            >
              <option value="">Catégorie</option>
              {cat.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
            <select
              className="outil outil--select"
              aria-label="TVA"
              value={tva}
              onChange={(e) => filtrer(setTva)(e.target.value)}
            >
              <option value="">TVA</option>
              {TAUX_TVA.map((t) => (
                <option key={t} value={t}>
                  {formaterTaux(t)}
                </option>
              ))}
            </select>
            <select
              className="outil outil--select"
              aria-label="Statut"
              value={statut}
              onChange={(e) => filtrer(setStatut)(e.target.value)}
            >
              <option value="">Statut</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>

            <span className="outils-articles__espace" />

            <MenuDeroulant
              declencheur={({ ouvert, basculer }) => (
                <button
                  type="button"
                  className="outil"
                  aria-haspopup="menu"
                  aria-expanded={ouvert}
                  onClick={basculer}
                >
                  <Icone nom="colonnes" taille={18} />
                  Colonnes
                </button>
              )}
            >
              {() => (
                <div className="menu__liste" role="menu" aria-label="Colonnes affichées">
                  {COLONNES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={colonnes.has(c.id)}
                      className="menu__item"
                      onClick={() => basculerColonne(c.id)}
                    >
                      <span className="menu__coche">
                        {colonnes.has(c.id) ? <Icone nom="valider" taille={14} /> : null}
                      </span>
                      {c.libelle}
                    </button>
                  ))}
                </div>
              )}
            </MenuDeroulant>

            {peutGerer ? (
              <MenuDeroulant
                declencheur={({ ouvert, basculer }) => (
                  <button
                    type="button"
                    className="outil outil--carre"
                    aria-label="Réglages du catalogue"
                    aria-haspopup="menu"
                    aria-expanded={ouvert}
                    onClick={basculer}
                  >
                    <Icone nom="reglages" taille={20} />
                  </button>
                )}
              >
                {(fermer) => (
                  <div className="menu__liste" role="menu" aria-label="Réglages du catalogue">
                    <button
                      type="button"
                      role="menuitem"
                      className="menu__item"
                      onClick={() => {
                        fermer()
                        changerParametre('categories', '1')
                      }}
                    >
                      <Icone nom="etiquette" taille={18} />
                      Gérer les catégories
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="menu__item"
                      disabled={cat.articles.length < 2}
                      onClick={() => {
                        fermer()
                        setDialogue({ genre: 'ordre' })
                      }}
                    >
                      <Icone nom="ordre" taille={18} />
                      Ordre du catalogue
                    </button>
                  </div>
                )}
              </MenuDeroulant>
            ) : null}
          </div>

          <div role="tabpanel" id="articles-panneau" aria-labelledby={`articles-onglet-${onglet}`}>
            {affichees.length === 0 ? (
              <EtatVide
                titre="Aucun article ne correspond"
                texte={
                  filtre
                    ? 'Essayez un autre onglet, ou élargissez la recherche et les filtres.'
                    : 'Aucun article ici.'
                }
              />
            ) : (
              <ListeArticles
                articles={affichees}
                categorieNom={categorieNom}
                colonnes={colonnes}
                tri={tri}
                onTrier={trier}
                selection={selection}
                onCocher={cocher}
                peutGerer={peutGerer}
                onFavori={(a) => void basculerFavori(a)}
                onModifier={(a) => setDialogue({ genre: 'article', article: a })}
                onDupliquer={(a) => void dupliquer(a)}
                onSupprimer={(a) => setDialogue({ genre: 'suppression', article: a })}
              />
            )}
          </div>

          <footer className="pied-articles">
            <p aria-live="polite">
              {nbSelection} article{nbSelection > 1 ? 's' : ''} sélectionné
              {nbSelection > 1 ? 's' : ''}
              {nbSelection ? (
                <button
                  type="button"
                  className="lien-discret"
                  onClick={() => setSelection(new Set())}
                >
                  Désélectionner
                </button>
              ) : null}
            </p>
            {tries.length ? (
              <p className="pied-articles__compte">
                Affichage {debut + 1} – {debut + affichees.length} sur {tries.length}
              </p>
            ) : null}
            {pages > 1 ? <Pagination page={page} pages={pages} onChoisir={setNumero} /> : null}
          </footer>
        </section>
      ) : null}

      {dialogue?.genre === 'article' ? (
        <ModaleArticle
          key={dialogue.article?.id ?? 'nouveau'}
          article={dialogue.article}
          categories={cat.categories}
          unites={cat.unites}
          onCategorieCreee={cat.ajouterCategorie}
          onEnregistre={apresEcriture}
          onFermer={fermer}
        />
      ) : null}
      {dialogue?.genre === 'ordre' ? (
        <ModaleOrdre articles={cat.articles} onEnregistre={apresEcriture} onFermer={fermer} />
      ) : null}
      {categoriesOuvertes && peutGerer && cat.etat === 'pret' ? (
        <ModaleCategories
          categories={cat.categories}
          articles={cat.articles}
          onChange={() => void cat.recharger()}
          onFermer={() => changerParametre('categories', null, true)}
        />
      ) : null}
      <Dialogue
        ouvert={dialogue?.genre === 'suppression'}
        onFermer={fermer}
        titre="Supprimer cet article ?"
        soustitre={dialogue?.genre === 'suppression' ? dialogue.article.nom : ''}
        pied={
          <>
            <Bouton onClick={fermer}>Conserver</Bouton>
            <Bouton
              variante="danger"
              icone="poubelle"
              onClick={() => dialogue?.genre === 'suppression' && void supprimer(dialogue.article)}
            >
              Supprimer
            </Bouton>
          </>
        }
      >
        <p>
          L’article disparaît du catalogue. Pour le garder sans le proposer, passez-le plutôt en
          inactif.
        </p>
      </Dialogue>
    </>
  )
}
