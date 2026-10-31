import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Calques ouverts, le dernier est au-dessus : seul lui réagit à Échap et à Tab. */
const pile: symbol[] = []
let debordementInitial = ''

/**
 * Comportement commun de Dialogue et PanneauLateral : Échap ferme, Tab reste piégé dans le panneau,
 * le défilement de la page est gelé, le focus va au premier champ du corps puis revient au déclencheur.
 */
export function useCalque(
  ouvert: boolean,
  onFermer: () => void,
  panneau: RefObject<HTMLElement | null>,
  corps: RefObject<HTMLElement | null>,
) {
  // Lu par référence : onFermer change souvent, le piège à focus ne doit pas se reposer.
  const fermer = useRef(onFermer)
  useEffect(() => {
    fermer.current = onFermer
  }, [onFermer])

  useEffect(() => {
    if (!ouvert) return undefined
    const id = Symbol('calque')
    const declencheur = document.activeElement as HTMLElement | null

    const surTouche = (ev: KeyboardEvent) => {
      if (pile.at(-1) !== id) return
      if (ev.key === 'Escape') return fermer.current()
      const zone = panneau.current
      if (ev.key !== 'Tab' || !zone) return
      const liste = [...zone.querySelectorAll<HTMLElement>(FOCUSABLES)]
      const premier = liste[0]
      const dernier = liste[liste.length - 1]
      const actif = document.activeElement
      if (!premier || !dernier) {
        ev.preventDefault()
        zone.focus()
      } else if (actif === zone || !zone.contains(actif)) {
        ev.preventDefault()
        ;(ev.shiftKey ? dernier : premier).focus()
      } else if (ev.shiftKey && actif === premier) {
        ev.preventDefault()
        dernier.focus()
      } else if (!ev.shiftKey && actif === dernier) {
        ev.preventDefault()
        premier.focus()
      }
    }

    if (pile.length === 0) debordementInitial = document.body.style.overflow
    pile.push(id)
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', surTouche)
    const initial = corps.current?.querySelector<HTMLElement>(FOCUSABLES) ?? panneau.current
    initial?.focus()

    return () => {
      pile.splice(pile.indexOf(id), 1)
      if (pile.length === 0) document.body.style.overflow = debordementInitial
      document.removeEventListener('keydown', surTouche)
      if (declencheur?.isConnected) declencheur.focus()
    }
  }, [ouvert, panneau, corps])
}
