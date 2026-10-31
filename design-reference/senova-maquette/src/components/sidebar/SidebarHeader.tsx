import { SidebarSimpleIcon } from '@phosphor-icons/react'
import markUrl from '../../assets/mark.png'
import wordmarkUrl from '../../assets/wordmark.png'

interface Props {
  collapsed: boolean
  onHome: () => void
  onToggleCollapsed: () => void
}

/**
 * En-tête relevé sur la référence (échelle 256 px, hauteur 142 px).
 * Bas de la zone blanche : arrondi r=14 à gauche → horizontale y≈123 → diagonale ≈31° jusqu'à (136,93)
 * → plateau y≈93 → diagonale ≈35° jusqu'au bord droit (256,46).
 * La couche turquoise est placée DERRIÈRE le blanc et décalée : elle n'apparaît qu'en fin de forme
 * (≈2,5 px sous le plateau, ≈15 px au bord droit), puis le marine reprend.
 */
export function SidebarHeader({ collapsed, onHome, onToggleCollapsed }: Props) {
  return (
    <div className="sidebar-header">
      {collapsed ? (
        <svg className="sidebar-header__shape" viewBox="0 0 76 84" preserveAspectRatio="none" aria-hidden focusable="false">
          <path fill="#16B8B0" d="M37 49.6 L38.4 50.6 Q39 50.9 40.6 50.9 H60 Q62 50.9 63.6 49.8 L76 40.9 V20 H37 Z" />
          <path
            fill="#FFFFFF"
            d="M0 0 H76 V34.6 L57.3 48 Q55.6 49.2 53.6 49.2 H40.6 Q38.6 49.2 37 50.2 L22 59.6 Q20.4 60.6 18.4 60.6 H10 A10 10 0 0 0 0 70.6 Z"
          />
        </svg>
      ) : (
        <svg className="sidebar-header__shape" viewBox="0 0 256 142" preserveAspectRatio="none" aria-hidden focusable="false">
          <defs>
            <linearGradient id="sidebar-header-glow" gradientUnits="userSpaceOnUse" x1="0" y1="96" x2="0" y2="142">
              <stop offset="0" stopColor="#2b5f93" stopOpacity="0.38" />
              <stop offset="1" stopColor="#0b2a50" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* léger reflet sur le marine, juste sous la frontière */}
          <path fill="url(#sidebar-header-glow)" d="M0 137.1 A14 14 0 0 1 14 123.1 H87.3 L136.2 95.8 H205.9 L256 60.5 V142 H0 Z" />

          {/* couche turquoise, derrière le blanc : seule sa tranche basse droite reste visible */}
          <path
            fill="#16B8B0"
            d="
              M131 85
              L134 95.2
              Q135.5 95.8 138 95.8
              H202
              Q205.9 95.8 209.1 93.5
              L256 60.5
              V30
              H131
              Z
            "
          />

          {/* zone blanche principale */}
          <path
            fill="#FFFFFF"
            d="
              M0 0
              H256
              V45.9
              L190.7 91.6
              Q188.2 93.3 185.2 93.3
              H139.2
              Q136.2 93.3 133.6 94.9
              L89.9 121.5
              Q87.3 123.1 84.3 123.1
              H14
              A14 14 0 0 0 0 137.1
              Z
            "
          />
        </svg>
      )}

      <a
        href="#aujourdhui"
        className="sidebar-logo"
        onClick={(e) => { e.preventDefault(); onHome() }}
        aria-label="SENOVA, aller à Aujourd’hui"
      >
        <img src={markUrl} alt="" className="sidebar-logo__mark" width={25} height={41} />
        {!collapsed && <img src={wordmarkUrl} alt="SENOVA" className="sidebar-logo__wordmark" width={117} height={15} />}
      </a>

      {!collapsed && (
        <button type="button" className="sidebar-header__collapse" onClick={onToggleCollapsed} aria-label="Réduire le menu" title="Réduire le menu">
          <SidebarSimpleIcon size={17} weight="regular" aria-hidden />
        </button>
      )}
    </div>
  )
}
