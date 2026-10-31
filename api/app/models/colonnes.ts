/**
 * Conversions de colonnes communes à SQLite et MySQL.
 *
 * SQLite rend les booléens en 0/1 et MySQL les décimaux en chaînes : ces
 * adaptateurs garantissent que les modèles exposent toujours des types
 * JavaScript propres, quel que soit le moteur.
 */

export const booleen = {
  consume: (valeur: unknown): boolean => Boolean(valeur),
}

export const decimal = {
  consume: (valeur: unknown): number | null =>
    valeur === null || valeur === undefined ? null : Number(valeur),
}

export function json<T>(defaut: T) {
  return {
    prepare: (valeur: T | null | undefined): string => JSON.stringify(valeur ?? defaut),
    consume: (valeur: unknown): T => {
      if (typeof valeur !== 'string') return (valeur as T | null) ?? defaut
      try {
        return JSON.parse(valeur) as T
      } catch {
        return defaut
      }
    },
  }
}
