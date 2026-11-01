import { useRef, useState, type CSSProperties, type FocusEvent, type MouseEvent } from 'react'
import { useCalque } from '@/ui/useCalque'
import { CoinBarre } from './CoinBarre'
import type { Compteur } from './ElementNavigation'
import { EnteteBarre } from './EnteteBarre'
import { MenuNouveau } from './MenuNouveau'
import { NavigationBarre } from './NavigationBarre'
import { PiedBarre } from './PiedBarre'
import './barre-laterale.css'

interface BarreLateraleProps {
  replie: boolean
  /** Sous 760 px, la barre est un tiroir. */
  mobile: boolean
  mobileOuvert: boolean
  onBasculer(): void
  onFermerMobile(): void
  /** Compteurs par chemin d'entrée, fournis par l'application. */
  compteurs?: Readonly<Record<string, Compteur>>
}

interface Infobulle {
  texte: string
  haut: number
  gauche: number
}

export function BarreLaterale({
  replie,
  mobile,
  mobileOuvert,
  onBasculer,
  onFermerMobile,
  compteurs = {},
}: BarreLateraleProps) {
  const barre = useRef<HTMLElement>(null)
  const corps = useRef<HTMLDivElement>(null)
  useCalque(mobileOuvert, onFermerMobile, barre, corps)

  // Infobulles du mode réduit, en position fixe pour ne pas être rognées par le défilement.
  const [infobulle, setInfobulle] = useState<Infobulle | null>(null)
  const montrer = (e: MouseEvent | FocusEvent) => {
    if (!replie || !(e.target instanceof Element)) return
    const cible = e.target.closest<HTMLElement>('[data-infobulle]')
    if (!cible?.dataset.infobulle) return setInfobulle(null)
    const r = cible.getBoundingClientRect()
    setInfobulle({ texte: cible.dataset.infobulle, haut: r.top + r.height / 2, gauche: r.right + 10 })
  }
  const masquer = () => setInfobulle(null)

  return (
    <>
      <div className="barre-voile" data-ouvert={mobileOuvert} onClick={onFermerMobile} aria-hidden />
      <aside
        ref={barre}
        tabIndex={-1}
        className="barre-laterale"
        data-replie={replie}
        data-mobile-ouvert={mobileOuvert}
        aria-label="Navigation principale"
        inert={mobile && !mobileOuvert}
        onMouseOver={montrer}
        onMouseLeave={masquer}
        onFocus={montrer}
        onBlur={masquer}
      >
        <EnteteBarre replie={replie} onReplier={onBasculer} />
        <div ref={corps} className="corps-barre">
          <MenuNouveau replie={replie} />
          <NavigationBarre replie={replie} compteurs={compteurs} />
          <PiedBarre replie={replie} onDeplier={onBasculer} />
        </div>
        <CoinBarre />
      </aside>
      {infobulle && replie ? (
        <div
          className="infobulle-barre"
          role="tooltip"
          style={{ '--infobulle-haut': `${infobulle.haut}px`, '--infobulle-gauche': `${infobulle.gauche}px` } as CSSProperties}
        >
          {infobulle.texte}
        </div>
      ) : null}
    </>
  )
}
