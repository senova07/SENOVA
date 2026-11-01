/**
 * Coin inférieur droit, même diagonale que la remontée finale de l'en-tête (pente ≈ 35°) :
 * marine, bande turquoise, coin blanc.
 */
export function CoinBarre() {
  return (
    <svg className="coin-barre" viewBox="0 0 86 60" preserveAspectRatio="none" aria-hidden focusable="false">
      <path className="forme-turquoise" d="M0 60 L86 0 V60 Z" />
      <path className="forme-blanc" d="M21.5 60 L86 15 V60 Z" />
    </svg>
  )
}
