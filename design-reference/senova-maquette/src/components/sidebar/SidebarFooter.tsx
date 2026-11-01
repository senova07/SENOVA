import { CaretDownIcon, GearIcon, SidebarSimpleIcon } from '@phosphor-icons/react'
import type { PageId } from '../../data/navigation'
import { SidebarItem } from './SidebarItem'

interface Props {
  activePage: PageId
  collapsed: boolean
  onNavigate: (page: PageId) => void
  onToggleCollapsed: () => void
}

export function SidebarFooter({ activePage, collapsed, onNavigate, onToggleCollapsed }: Props) {
  return (
    <div className="sidebar-footer">
      <SidebarItem
        item={{ id: 'parametres', label: 'Paramètres', icon: GearIcon }}
        collapsed={collapsed}
        active={activePage === 'parametres'}
        onSelect={() => onNavigate('parametres')}
      />
      {collapsed && (
        <button type="button" className="sidebar-item" onClick={onToggleCollapsed} aria-label="Déplier le menu" data-tooltip="Déplier le menu">
          <SidebarSimpleIcon className="sidebar-item__icon" size={19} weight="regular" aria-hidden />
        </button>
      )}
      <button type="button" className="sidebar-user" data-tooltip={collapsed ? 'Lucas Martin' : undefined}>
        <span className="sidebar-user__avatar" aria-hidden>
          LM
          <span className="sidebar-user__presence" />
        </span>
        {!collapsed && (
          <>
            <span className="sidebar-user__text">
              <span className="sidebar-user__name">Lucas Martin</span>
              <span className="sidebar-user__role">Administrateur</span>
            </span>
            <CaretDownIcon size={15} weight="bold" className="sidebar-user__caret" aria-hidden />
          </>
        )}
      </button>
    </div>
  )
}

/**
 * Coin inférieur droit, même diagonale que la remontée finale de l'en-tête (pente ≈ 35°) :
 * marine → bande turquoise (15 px de haut au bord droit, comme la partie la plus épaisse de l'en-tête) → coin blanc.
 */
export function SidebarCorner() {
  return (
    <svg className="sidebar-corner" viewBox="0 0 86 60" preserveAspectRatio="none" aria-hidden focusable="false">
      <path fill="#16B8B0" d="M0 60 L86 0 V60 Z" />
      <path fill="#FFFFFF" d="M21.5 60 L86 15 V60 Z" />
    </svg>
  )
}
