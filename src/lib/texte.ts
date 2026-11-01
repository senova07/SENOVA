/** Fonctions pures sur le texte. */

/** Minuscules sans accents, pour comparer et chercher sans tenir compte de la casse ni des diacritiques. */
export const sansAccent = (texte: string): string =>
  texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** « 3 lignes », « 1 ligne » ; un mot déjà au pluriel (finissant par s) reste tel quel. */
export const pluriel = (n: number, mot: string): string => `${n} ${mot}${n > 1 && !mot.endsWith('s') ? 's' : ''}`
