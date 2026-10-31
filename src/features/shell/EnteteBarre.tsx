import { Link } from 'react-router-dom'
import { SidebarSimpleIcon } from '@phosphor-icons/react'
import marqueUrl from '@/assets/mark.png'
import motUrl from '@/assets/wordmark.png'

interface EnteteBarreProps {
  replie: boolean
  onReplier(): void
}

/**
 * En-tête relevé sur la maquette (échelle 256 px, hauteur 142 px) : zone blanche arrondie à gauche,
 * deux diagonales, et une couche turquoise placée DERRIÈRE le blanc dont seule la tranche basse reste visible.
 */
export function EnteteBarre({ replie, onReplier }: EnteteBarreProps) {
  return (
    <div className="entete-barre">
      {replie ? (
        <svg className="entete-barre__forme" viewBox="0 0 76 84" preserveAspectRatio="none" aria-hidden focusable="false">
          <path className="forme-turquoise" d="M37 49.6 L38.4 50.6 Q39 50.9 40.6 50.9 H60 Q62 50.9 63.6 49.8 L76 40.9 V20 H37 Z" />
          <path
            className="forme-blanc"
            d="M0 0 H76 V34.6 L57.3 48 Q55.6 49.2 53.6 49.2 H40.6 Q38.6 49.2 37 50.2 L22 59.6 Q20.4 60.6 18.4 60.6 H10 A10 10 0 0 0 0 70.6 Z"
          />
        </svg>
      ) : (
        <svg className="entete-barre__forme" viewBox="0 0 256 142" preserveAspectRatio="none" aria-hidden focusable="false">
          <defs>
            <linearGradient id="barre-entete-reflet" gradientUnits="userSpaceOnUse" x1="0" y1="96" x2="0" y2="142">
              <stop offset="0" className="reflet-haut" />
              <stop offset="1" className="reflet-bas" />
            </linearGradient>
          </defs>
          {/* léger reflet sur le marine, juste sous la frontière */}
          <path fill="url(#barre-entete-reflet)" d="M0 137.1 A14 14 0 0 1 14 123.1 H87.3 L136.2 95.8 H205.9 L256 60.5 V142 H0 Z" />
          {/* couche turquoise, derrière le blanc */}
          <path
            className="forme-turquoise"
            d="M131 85 L134 95.2 Q135.5 95.8 138 95.8 H202 Q205.9 95.8 209.1 93.5 L256 60.5 V30 H131 Z"
          />
          {/* zone blanche principale */}
          <path
            className="forme-blanc"
            d="M0 0 H256 V45.9 L190.7 91.6 Q188.2 93.3 185.2 93.3 H139.2 Q136.2 93.3 133.6 94.9 L89.9 121.5 Q87.3 123.1 84.3 123.1 H14 A14 14 0 0 0 0 137.1 Z"
          />
        </svg>
      )}

      <Link to="/" className="entete-barre__logo" aria-label="SENOVA, aller à Aujourd’hui">
        <img src={marqueUrl} alt="" className="entete-barre__marque" width={25} height={41} />
        {replie ? null : <img src={motUrl} alt="SENOVA" className="entete-barre__mot" width={117} height={15} />}
      </Link>

      {replie ? null : (
        <button type="button" className="entete-barre__replier" onClick={onReplier} aria-label="Réduire le menu" title="Réduire le menu (Ctrl+B)">
          <SidebarSimpleIcon size={17} weight="regular" aria-hidden />
        </button>
      )}
    </div>
  )
}
