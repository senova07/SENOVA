import { useState } from 'react'
import { apiArticles } from '@/services/articlesApi'
import { useToast } from '@/store/toastContext'
import type { Article } from '@shared/articles'
import type { Calque } from './CalquesArticles'
import type { ActionLigne } from './MenuLigneArticle'
import { saisieDe } from './saisie'
import type { useCatalogue } from './useCatalogue'

/** Actions de ligne (favori, archivage, duplication, suppression) sur l'API, avec toast d'échec. */
export function useActionsArticles(
  cat: Pick<ReturnType<typeof useCatalogue>, 'recharger'>,
  setCalque: (calque: Calque | null) => void,
) {
  const { notifier } = useToast()
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)

  const echec = (e: unknown) =>
    notifier('Action impossible', { message: e instanceof Error ? e.message : undefined, ton: 'alerte' })

  const agir = async (a: Article, action: ActionLigne) => {
    try {
      if (action === 'modifier') return setCalque({ genre: 'article', article: a })
      if (action === 'supprimer') return setCalque({ genre: 'suppression', article: a })
      if (action === 'favori') await apiArticles.favori(a.id, !a.favori)
      if (action === 'archiver') {
        await apiArticles.modifier(a.id, saisieDe(a, { actif: !a.actif }))
        notifier(a.actif ? 'Article archivé' : 'Article restauré', { message: a.nom, ton: 'succes' })
      }
      if (action === 'dupliquer') {
        const copie = await apiArticles.dupliquer(a.id)
        await cat.recharger()
        notifier('Article dupliqué', { message: 'Complétez la référence de la copie.', ton: 'succes' })
        return setCalque({ genre: 'article', article: copie })
      }
      await cat.recharger()
    } catch (e) {
      echec(e)
    }
  }

  const supprimer = async (a: Article) => {
    if (suppressionEnCours) return
    setSuppressionEnCours(true)
    try {
      await apiArticles.supprimer(a.id)
      notifier('Article supprimé', { message: a.nom, ton: 'succes' })
      setCalque(null)
      void cat.recharger()
    } catch (e) {
      setCalque(null)
      echec(e)
    } finally {
      setSuppressionEnCours(false)
    }
  }

  return { agir, supprimer, suppressionEnCours }
}
