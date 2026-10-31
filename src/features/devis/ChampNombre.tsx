import { useState, type InputHTMLAttributes } from 'react'
import { lireDecimal } from '@/lib/format'

interface ChampNombreProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'min' | 'max'
> {
  valeur: number
  onValeur(valeur: number): void
  min?: number
  max?: number
  /** Décimales affichées hors saisie (min, max). */
  decimales?: [number, number]
}

/** Saisie décimale à la française : « 12,5 » est lu en direct, la mise en forme revient à la sortie du champ. */
export function ChampNombre({
  valeur,
  onValeur,
  min = -Infinity,
  max = Infinity,
  decimales = [0, 2],
  className,
  onFocus,
  ...reste
}: ChampNombreProps) {
  const [brut, setBrut] = useState<string | null>(null)
  const affiche =
    brut ??
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimales[0],
      maximumFractionDigits: decimales[1],
      useGrouping: false,
    }).format(valeur)
  const lu = brut === null || brut.trim() === '' ? 0 : lireDecimal(brut)

  return (
    <input
      {...reste}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={['espace-nombre', className ?? ''].filter(Boolean).join(' ')}
      value={affiche}
      aria-invalid={lu === null || lu < min || lu > max ? true : undefined}
      onFocus={(ev) => {
        ev.target.select()
        onFocus?.(ev)
      }}
      onChange={(ev) => {
        setBrut(ev.target.value)
        const n = ev.target.value.trim() === '' ? 0 : lireDecimal(ev.target.value)
        if (n !== null && n >= min && n <= max) onValeur(n)
      }}
      onBlur={() => setBrut(null)}
    />
  )
}
