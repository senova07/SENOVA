import marqueUrl from '@/assets/mark.png'
import motUrl from '@/assets/wordmark.png'
import './Logo.css'

/** Symbole S + mot SENOVA (sans le slogan), pour les écrans hors coque ; la barre latérale a son propre en-tête SVG. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={['logo', className ?? ''].filter(Boolean).join(' ')}>
      <img src={marqueUrl} alt="" width={27} height={44} />
      <img src={motUrl} alt="SENOVA" width={140} height={18} />
    </span>
  )
}
