import { useCallback, useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface Options {
  nbLignes: number
  nbColonnes: number
  ajouterLigne(): void
  /** Tab ou Entrée sur la dernière ligne n'ajoute une ligne que si celle-ci est remplie (sinon Tab sort de la grille, WCAG 2.1.2). */
  ligneRemplie(rang: number): boolean
  /** Collage multi-cellules à partir de la cellule (ligne, colonne). */
  coller(ligne: number, colonne: number, texte: string): void
}

type Champ = HTMLInputElement | HTMLSelectElement | HTMLButtonElement

/** Clavier façon tableur (Tab, Maj+Tab, Entrée, flèches) et collage multi-cellules. Les cellules portent `data-cell="ligne:colonne"`. */
export function useNavigationGrille({ nbLignes, nbColonnes, ajouterLigne, ligneRemplie, coller }: Options) {
  const table = useRef<HTMLTableElement>(null)
  const apres = useRef<{ r: number; c: number } | null>(null)

  const focaliser = useCallback(
    (r: number, c: number) => {
      const rr = Math.max(0, Math.min(r, nbLignes - 1))
      const cc = Math.max(0, Math.min(c, nbColonnes - 1))
      const el = table.current?.querySelector<Champ>(`[data-cell="${rr}:${cc}"]`)
      if (!el) return
      el.focus()
      if (el instanceof HTMLInputElement) el.select()
      el.closest('td')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    },
    [nbLignes, nbColonnes],
  )

  // Après l'ajout d'une ligne par Tab ou Entrée, le focus suit la nouvelle ligne.
  useEffect(() => {
    if (!apres.current) return
    const { r, c } = apres.current
    apres.current = null
    focaliser(r, c)
  }, [nbLignes, focaliser])

  const ajouterEtAller = (r: number, c: number) => {
    apres.current = { r, c }
    ajouterLigne()
  }

  const surClavier = (e: KeyboardEvent<HTMLElement>) => {
    const el = e.target as Champ
    const pos = el.dataset?.cell
    if (!pos) return
    const [r = 0, c = 0] = pos.split(':').map(Number)
    const select = el.tagName !== 'INPUT' // select et bouton (étoile) : pas de curseur de texte
    const saisie = el as HTMLInputElement
    const debut = !select && saisie.selectionStart === 0 && saisie.selectionEnd === 0
    const fin = !select && saisie.selectionStart === saisie.value.length && saisie.selectionEnd === saisie.value.length
    const derniere = nbLignes - 1

    const aller = (rr: number, cc: number) => {
      e.preventDefault()
      focaliser(rr, cc)
    }
    switch (e.key) {
      case 'ArrowDown': if (!e.altKey) aller(r + 1, c); break
      case 'ArrowUp': if (!e.altKey) aller(r - 1, c); break
      case 'ArrowLeft': if (select || debut) aller(r, c - 1); break
      case 'ArrowRight': if (select || fin) aller(r, c + 1); break
      case 'Enter':
        if (el.tagName === 'BUTTON') return // Entrée active l'étoile
        e.preventDefault()
        if (e.shiftKey) focaliser(r - 1, c)
        else if (r < derniere) focaliser(r + 1, c)
        else if (ligneRemplie(r)) ajouterEtAller(r + 1, c)
        break
      case 'Tab':
        if (e.shiftKey) {
          if (c > 0) aller(r, c - 1)
          else if (r > 0) aller(r - 1, nbColonnes - 1)
          // sinon : première cellule, Maj+Tab sort de la grille
        } else if (c < nbColonnes - 1) aller(r, c + 1)
        else if (r < derniere) aller(r + 1, 0)
        else if (ligneRemplie(r)) {
          e.preventDefault()
          ajouterEtAller(r + 1, 0)
        }
        // sinon : Tab natif, le focus quitte la grille
        break
    }
  }

  const surCollage = (e: ClipboardEvent<HTMLElement>) => {
    const el = e.target as Champ
    const pos = el.dataset?.cell
    if (!pos) return
    const texte = e.clipboardData.getData('text/plain')
    const multiple = texte.includes('\t') || /\n./.test(texte.replace(/\r/g, ''))
    if (!multiple) return // collage simple : comportement natif du champ
    e.preventDefault()
    const [r = 0, c = 0] = pos.split(':').map(Number)
    coller(r, c, texte)
  }

  return { table, surClavier, surCollage }
}
