import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArchiveIcon, CopyIcon, DotsThreeVerticalIcon, PencilSimpleIcon, StarIcon,
} from '@phosphor-icons/react'
import { useDismiss } from '../../lib/useDismiss'
import type { Article } from '../../data/articles'

export type RowAction = 'edit' | 'duplicate' | 'favorite' | 'archive'

interface Props {
  article: Article
  onAction: (action: RowAction) => void
}

const MENU_W = 214
const MENU_H = 170

/** Menu « … » d'une ligne. Rendu en portail et positionné en fixe pour ne jamais être rogné par le tableau. */
export function RowMenu({ article, onAction }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useDismiss(open, [btnRef, menuRef], () => setOpen(false))

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const place = () => {
      const r = btnRef.current!.getBoundingClientRect()
      const below = r.bottom + 4 + MENU_H < window.innerHeight
      setPos({
        top: below ? r.bottom + 4 : r.top - 4 - MENU_H,
        left: Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8)),
      })
    }
    place()
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => { window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true) }
  }, [open])

  useLayoutEffect(() => {
    if (open && pos) menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [open, pos])

  const run = (a: RowAction) => { setOpen(false); onAction(a); btnRef.current?.focus() }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="icon-btn row-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions pour « ${article.name} »`}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
      >
        <DotsThreeVerticalIcon size={20} weight="bold" aria-hidden />
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="menu"
          role="menu"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_W }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
            e.preventDefault()
            const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]
            const i = items.indexOf(document.activeElement as HTMLButtonElement)
            items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
          }}
        >
          <button type="button" role="menuitem" className="menu__item" onClick={() => run('edit')}>
            <PencilSimpleIcon size={16} weight="duotone" aria-hidden /> Modifier
          </button>
          <button type="button" role="menuitem" className="menu__item" onClick={() => run('duplicate')}>
            <CopyIcon size={16} weight="duotone" aria-hidden /> Dupliquer
          </button>
          <button type="button" role="menuitem" className="menu__item" onClick={() => run('favorite')}>
            <StarIcon size={16} weight={article.favorite ? 'fill' : 'duotone'} aria-hidden />
            {article.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </button>
          <div className="menu__sep" />
          <button type="button" role="menuitem" className="menu__item menu__item--danger" onClick={() => run('archive')}>
            <ArchiveIcon size={16} weight="duotone" aria-hidden /> Archiver
          </button>
        </div>,
        document.body,
      )}
    </>
  )
}
