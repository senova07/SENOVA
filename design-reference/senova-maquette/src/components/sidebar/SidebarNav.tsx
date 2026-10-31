import { NAV_GROUPS, type PageId } from '../../data/navigation'
import { SidebarItem } from './SidebarItem'

interface Props {
  activePage: PageId
  collapsed: boolean
  onNavigate: (page: PageId) => void
}

export function SidebarNav({ activePage, collapsed, onNavigate }: Props) {
  return (
    <nav className="sidebar-nav" aria-label="Sections">
      {NAV_GROUPS.map((group) => (
        <div key={group.id} className="sidebar-nav__group">
          {group.label && <div className="sidebar-nav__label">{group.label}</div>}
          {group.items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              collapsed={collapsed}
              active={activePage === item.id}
              onSelect={() => onNavigate(item.id)}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}
