import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'

const CLE_REPLIE = 'senova.sidebar.repliee'

function lireChoix(): boolean | null {
  try {
    const v = localStorage.getItem(CLE_REPLIE)
    return v === '1' ? true : v === '0' ? false : null
  } catch {
    return null
  }
}

function ecrireChoix(replie: boolean) {
  try {
    localStorage.setItem(CLE_REPLIE, replie ? '1' : '0')
  } catch {
    // stockage indisponible : le choix vaut pour la session seulement
  }
}

function useMedia(requete: string): boolean {
  return useSyncExternalStore(
    (rappel) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const liste = window.matchMedia(requete)
      liste.addEventListener('change', rappel)
      return () => liste.removeEventListener('change', rappel)
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(requete).matches,
  )
}

/**
 * État de la barre latérale : réduite ou dépliée (choix mémorisé, sinon réduite sous 1100 px),
 * tiroir mobile sous 760 px (se referme à chaque changement de page). Ctrl+B / ⌘+B bascule.
 */
export function useEtatBarre() {
  const mobile = useMedia('(max-width: 760px)')
  const etroit = useMedia('(max-width: 1100px)')
  const { key } = useLocation()
  const [choix, setChoix] = useState<boolean | null>(lireChoix)
  const [ouvertSur, setOuvertSur] = useState<string | null>(null)

  const replie = mobile ? false : (choix ?? etroit)
  const basculer = useCallback(() => {
    ecrireChoix(!replie)
    setChoix(!replie)
  }, [replie])

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (mobile || e.repeat || e.defaultPrevented || (e.target as HTMLElement | null)?.isContentEditable) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        basculer()
      }
    }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  }, [basculer, mobile])

  return {
    replie,
    mobile,
    basculer,
    mobileOuvert: mobile && ouvertSur === key,
    ouvrirMobile: () => setOuvertSur(key),
    fermerMobile: () => setOuvertSur(null),
  }
}
