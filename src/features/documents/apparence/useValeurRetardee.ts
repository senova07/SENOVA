import { useEffect, useState } from 'react'

/** Suit `valeur` avec un délai : pendant un geste continu (glissé, frappe), la valeur retardée ne bouge pas. */
export function useValeurRetardee<T>(valeur: T, delaiMs: number): T {
  const [retardee, setRetardee] = useState(valeur)
  useEffect(() => {
    const minuteur = setTimeout(() => setRetardee(valeur), delaiMs)
    return () => clearTimeout(minuteur)
  }, [valeur, delaiMs])
  return retardee
}
