const definies = (o: object) => Object.entries(o).filter(([, v]) => v !== undefined)

/** Égalité profonde qui court-circuite sur la référence (un logo de 2 Mo inchangé coûte une comparaison de pointeurs) et ignore les clés `undefined`. */
export function egal(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  const ea = definies(a)
  const eb = definies(b)
  if (ea.length !== eb.length) return false
  return ea.every(([cle, v]) => egal(v, (b as Record<string, unknown>)[cle]))
}
