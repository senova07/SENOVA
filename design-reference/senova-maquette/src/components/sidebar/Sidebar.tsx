import { useState, type FocusEvent, type MouseEvent } from 'react'
import { BuildingsIcon, CaretDownIcon } from '@phosphor-icons/react'
import type { PageId } from '../../data/navigation'
import { SidebarHeader } from './SidebarHeader'
import { SidebarNav } from './SidebarNav'
import { SidebarFooter, SidebarCorner } from './SidebarFooter'
import { NewMenu } from './NewMenu'
import './sidebar.css'

interface Props {
  activePage: PageId
  collapsed: boolean
  mobileOpen: boolean
  onNavigate: (page: PageId) => void
  onToggleCollapsed: () => void
  onCloseMobile: () => void
  onNewArticle: () => void
  onNewQuote?: () => void
}

export function Sidebar({
  activePage, collapsed, mobileOpen, onNavigate, onToggleCollapsed, onCloseMobile, onNewArticle, onNewQuote,
}: Props) {
  // Infobulles du mode réduit, en position fixe pour ne pas être rognées par le défilement
  const [tip, setTip] = useState<{ text: string; top: number; left: number } | null>(null)
  const showTip = (e: MouseEvent | FocusEvent) => {
    if (!collapsed) return
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tooltip]')
    if (!el?.dataset.tooltip) { setTip(null); return }
    const r = el.getBoundingClientRect()
    setTip({ text: el.dataset.tooltip, top: r.top + r.height / 2, left: r.right + 10 })
  }

  return (
    <>
      <div className="sidebar-scrim" data-open={mobileOpen} onClick={onCloseMobile} aria-hidden />
      <aside
        className="sidebar"
        data-collapsed={collapsed}
        data-mobile-open={mobileOpen}
        aria-label="Navigation principale"
        onMouseOver={showTip}
        onMouseLeave={() => setTip(null)}
        onFocus={showTip}
        onBlur={() => setTip(null)}
      >
        <SidebarHeader collapsed={collapsed} onHome={() => onNavigate('aujourdhui')} onToggleCollapsed={onToggleCollapsed} />

        <div className="sidebar-body">
          <button type="button" className="sidebar-org" data-tooltip={collapsed ? 'Atelier Martin' : undefined} aria-label="Changer d’entreprise : Atelier Martin">
            <BuildingsIcon size={20} weight="fill" className="sidebar-org__icon" aria-hidden />
            {!collapsed && (
              <>
                <span className="sidebar-org__name">Atelier Martin</span>
                <CaretDownIcon size={15} weight="bold" className="sidebar-org__caret" aria-hidden />
              </>
            )}
          </button>

          <NewMenu collapsed={collapsed} onNewArticle={onNewArticle} onNewQuote={onNewQuote} />

          <SidebarNav activePage={activePage} collapsed={collapsed} onNavigate={onNavigate} />

          <SidebarFooter activePage={activePage} collapsed={collapsed} onNavigate={onNavigate} onToggleCollapsed={onToggleCollapsed} />
        </div>

        <SidebarCorner />
      </aside>
      {tip && collapsed && (
        <div className="sidebar-tooltip" role="tooltip" style={{ top: tip.top, left: tip.left }}>{tip.text}</div>
      )}
    </>
  )
}
