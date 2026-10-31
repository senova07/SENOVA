import { useRef, useState } from 'react'
import {
  PlusIcon, FileTextIcon, ReceiptIcon, UserPlusIcon, BriefcaseIcon, PackageIcon,
} from '@phosphor-icons/react'
import { useDismiss } from '../../lib/useDismiss'

interface Props {
  collapsed: boolean
  onNewArticle: () => void
  onNewQuote?: () => void
}

const ENTRIES = [
  { id: 'devis', label: 'Nouveau devis', icon: FileTextIcon, kbd: 'D' },
  { id: 'facture', label: 'Nouvelle facture', icon: ReceiptIcon, kbd: 'F' },
  { id: 'client', label: 'Nouveau client', icon: UserPlusIcon, kbd: 'C' },
  { id: 'prestation', label: 'Nouvelle prestation', icon: BriefcaseIcon, kbd: 'P' },
  { id: 'article', label: 'Nouvel article', icon: PackageIcon, kbd: 'A' },
] as const

/** Bouton universel « Nouveau » + menu de création. */
export function NewMenu({ collapsed, onNewArticle, onNewQuote }: Props) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useDismiss(open, [btnRef, menuRef], () => setOpen(false))

  return (
    <div className="sidebar-new">
      <button
        ref={btnRef}
        type="button"
        className="sidebar-new__button"
        aria-haspopup="menu"
        aria-expanded={open}
        data-tooltip={collapsed ? 'Nouveau' : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <PlusIcon size={16} weight="bold" aria-hidden />
        {!collapsed && <span>Nouveau</span>}
      </button>
      {open && (
        <div ref={menuRef} className="menu sidebar-new__menu" role="menu">
          <div className="menu__label">Créer</div>
          {ENTRIES.map((e, i) => (
            <div key={e.id}>
              {i === 4 && <div className="menu__sep" />}
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  setOpen(false)
                  if (e.id === 'article') onNewArticle()
                  if (e.id === 'devis') onNewQuote?.()
                }}
              >
                <e.icon size={17} weight="duotone" aria-hidden />
                {e.label}
                <span className="kbd">{e.kbd}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
