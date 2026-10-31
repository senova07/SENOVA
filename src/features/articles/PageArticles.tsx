import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bouton } from '@/ui/Bouton'
import { EntetePage } from '@/ui/EntetePage'
import { EtatVide } from '@/ui/EtatVide'
import { Pagination } from '@/ui/Pagination'
import { useSession } from '@/store/sessionContext'
import { ActionsEnteteArticles } from './ActionsEnteteArticles'
import { BarreOutilsArticles } from './BarreOutilsArticles'
import { CalquesArticles, type Calque } from './CalquesArticles'
import { compterArticles } from './filtres'
import { OngletsArticles, PREFIXE_ONGLETS } from './OngletsArticles'
import { RechercheArticles } from './RechercheArticles'
import { TableauArticles } from './TableauArticles'
import { useActionsArticles } from './useActionsArticles'
import { useCatalogue } from './useCatalogue'
import { useVueArticles } from './useVueArticles'
import './articles.css'

export function PageArticles() {
  const { peut } = useSession()
  const peutGerer = peut('articles.gerer')
  const cat = useCatalogue()
  const vue = useVueArticles(cat.articles, cat.categories)
  const [calque, setCalque] = useState<Calque | null>(null)
  const { agir, supprimer, suppressionEnCours } = useActionsArticles(cat, setCalque)
  const [parametres, setParametres] = useSearchParams()
  const rechercheRef = useRef<HTMLInputElement>(null)
  const creer = () => setCalque({ genre: 'article', article: null })

  // « + Nouveau → Article » de la coque arrive ici avec ?nouveau=1.
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
    if (peutGerer) setCalque({ genre: 'article', article: null })
  }, [demandeCreation, peutGerer, setParametres])

  // « / » place le curseur dans la recherche, sauf pendant une saisie ou dans un calque.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable], [role="dialog"]')) return
      e.preventDefault()
      rechercheRef.current?.focus()
    }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  }, [])

  return (
    <>
      <EntetePage
        titre="Articles"
        sousTitre="Gérez les produits et services utilisés dans vos devis et factures."
        actions={
          peutGerer ? (
            <ActionsEnteteArticles nbArticles={cat.articles.length} onCreer={creer} onCalque={setCalque} />
          ) : undefined
        }
      />

      {cat.etat === 'chargement' ? <p role="status">Chargement du catalogue…</p> : null}
      {cat.etat === 'erreur' ? (
        <EtatVide
          titre="Le catalogue ne s’est pas chargé"
          texte={cat.erreur}
          action={<Bouton onClick={() => void cat.recharger()}>Réessayer</Bouton>}
        />
      ) : null}
      {cat.etat === 'pret' && cat.articles.length === 0 ? (
        <EtatVide
          icone="articles"
          titre="Votre catalogue est vide"
          texte="Créez vos premiers articles une fois : vous les retrouverez dans chaque devis et chaque facture."
          action={
            peutGerer ? (
              <Bouton variante="primaire" icone="plus" onClick={creer}>
                Créer un article
              </Bouton>
            ) : undefined
          }
        />
      ) : null}

      {cat.etat === 'pret' && cat.articles.length > 0 ? (
        <>
          <RechercheArticles valeur={vue.recherche} onChange={vue.changerRecherche} inputRef={rechercheRef} />
          <OngletsArticles actif={vue.onglet} onChoisir={vue.changerOnglet} />
          <BarreOutilsArticles
            filtres={vue.filtres}
            categories={cat.categories}
            onFiltres={vue.changerFiltres}
            compteurs={compterArticles(cat.articles)}
          />
          <div
            role="tabpanel"
            id={`${PREFIXE_ONGLETS}-panneau`}
            aria-labelledby={`${PREFIXE_ONGLETS}-onglet-${vue.onglet}`}
          >
            {vue.affichees.length === 0 ? (
              <EtatVide
                icone="recherche"
                titre="Aucun article avec ces filtres"
                texte="Vérifiez l’orthographe ou la référence, ou retirez un filtre."
                action={
                  vue.contraint ? (
                    <Bouton taille="sm" onClick={vue.reinitialiser}>
                      Effacer la recherche et les filtres
                    </Bouton>
                  ) : undefined
                }
              />
            ) : (
              <>
                <TableauArticles
                  articles={vue.affichees}
                  categories={cat.categories}
                  tri={vue.tri}
                  peutGerer={peutGerer}
                  onTrier={vue.trier}
                  onOuvrir={(a) => setCalque({ genre: 'article', article: a })}
                  onAction={(a, action) => void agir(a, action)}
                />
                <div className="a-foot">
                  <span className="num" aria-live="polite">
                    {vue.debut + 1} à {vue.debut + vue.affichees.length} sur {vue.total} article
                    {vue.total > 1 ? 's' : ''}
                  </span>
                  {vue.pages > 1 ? <Pagination page={vue.page} pages={vue.pages} onChoisir={vue.allerPage} /> : null}
                </div>
              </>
            )}
          </div>
        </>
      ) : null}

      <CalquesArticles
        calque={calque}
        cat={cat}
        suppressionEnCours={suppressionEnCours}
        onSupprimer={(a) => void supprimer(a)}
        onFermer={() => setCalque(null)}
      />
    </>
  )
}
