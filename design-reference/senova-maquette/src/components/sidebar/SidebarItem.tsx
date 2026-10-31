import type { NavItem } from '../../data/navigation'

interface Props {
  item: NavItem
  active: boolean
  collapsed: boolean
  onSelect: () => void
}

/**
 * Entrée de navigation : icône Phosphor pleine sans conteneur.
 * Actif : plaque blanche, texte et icône marine, petite bande turquoise en biais à droite.
 */
export function SidebarItem({ item, active, collapsed, onSelect }: Props) {
  const Icon = item.icon
  return (
    <a
      href={`#${item.id}`}
      className="sidebar-item"
      aria-current={active ? 'page' : undefined}
      data-tooltip={collapsed ? item.label : undefined}
      onClick={(e) => {
        e.preventDefault()
        onSelect()
      }}
    >
      <Icon className="sidebar-item__icon" size={19} weight={active ? 'bold' : 'fill'} aria-hidden />
      {!collapsed && <span className="sidebar-item__label">{item.label}</span>}
      {item.count != null && (
        <span className={`sidebar-item__count${item.countTone === 'alert' ? ' sidebar-item__count--alert' : ''}`}>
          {item.count}
          <span className="sr-only">{item.countTone === 'alert' ? ' en retard' : ' à traiter'}</span>
        </span>
      )}
    </a>
  )
}
