/**
 * Accès HTTP à l'API SENOVA.
 *
 * L'interface et l'API partagent la même origine : la session voyage dans un
 * cookie `httpOnly` que le JavaScript de la page ne peut pas lire, et chaque
 * écriture porte le jeton anti-CSRF déposé par le serveur.
 *
 * Aucune donnée n'est mise en cache ici : ce module transporte, il ne décide
 * pas. Les refus (401, 403) remontent en `ErreurApi`, que les écrans affichent
 * telle quelle — les messages du serveur sont rédigés pour être lus.
 */

const BASE = '/api'

export interface DetailErreur {
  message: string
  field?: string
}

export class ErreurApi extends Error {
  constructor(
    readonly statut: number,
    message: string,
    readonly code?: string,
    readonly details: DetailErreur[] = [],
  ) {
    super(message)
    this.name = 'ErreurApi'
  }

  /** La session a expiré ou le compte a été désactivé. */
  get sessionPerdue(): boolean {
    return this.statut === 401
  }

  /** Le rôle de l'utilisateur n'autorise pas cette action. */
  get refus(): boolean {
    return this.statut === 403
  }

  get introuvable(): boolean {
    return this.statut === 404
  }
}

type Ecouteur = () => void

const ecouteursSessionPerdue = new Set<Ecouteur>()

/**
 * Prévenu dès qu'une requête se heurte à une session invalide : le fournisseur
 * de session s'en sert pour renvoyer l'utilisateur à l'écran de connexion, où
 * qu'il se trouve dans l'application.
 */
export function surSessionPerdue(ecouteur: Ecouteur): () => void {
  ecouteursSessionPerdue.add(ecouteur)
  return () => ecouteursSessionPerdue.delete(ecouteur)
}

function lireCookie(nom: string): string | null {
  const prefixe = `${nom}=`
  for (const morceau of document.cookie.split(';')) {
    const valeur = morceau.trim()
    if (valeur.startsWith(prefixe)) return decodeURIComponent(valeur.slice(prefixe.length))
  }
  return null
}

const METHODES_PROTEGEES = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export type MethodeHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface OptionsRequete {
  /** Corps JSON. Exclusif avec `formulaire`. */
  corps?: unknown
  /** Envoi multipart — photos et documents. */
  formulaire?: FormData
  /** Paramètres d'URL ; les valeurs `undefined` sont ignorées. */
  parametres?: Record<string, string | number | undefined>
}

function construireUrl(chemin: string, parametres?: OptionsRequete['parametres']): string {
  const url = `${BASE}${chemin}`
  if (!parametres) return url
  const requete = new URLSearchParams()
  for (const [cle, valeur] of Object.entries(parametres)) {
    if (valeur !== undefined) requete.set(cle, String(valeur))
  }
  const chaine = requete.toString()
  return chaine ? `${url}?${chaine}` : url
}

async function lireCorps(reponse: Response): Promise<unknown> {
  if (reponse.status === 204) return undefined
  const type = reponse.headers.get('content-type') ?? ''
  if (!type.includes('application/json')) return await reponse.text()
  try {
    return await reponse.json()
  } catch {
    return undefined
  }
}

function erreurDepuis(statut: number, corps: unknown): ErreurApi {
  if (corps && typeof corps === 'object') {
    const objet = corps as { message?: unknown; code?: unknown; errors?: unknown }
    const details: DetailErreur[] = Array.isArray(objet.errors)
      ? (objet.errors as DetailErreur[]).filter((detail) => typeof detail?.message === 'string')
      : []
    const message =
      typeof objet.message === 'string'
        ? objet.message
        : (details[0]?.message ?? 'La requête a échoué.')
    return new ErreurApi(
      statut,
      message,
      typeof objet.code === 'string' ? objet.code : undefined,
      details,
    )
  }
  return new ErreurApi(statut, 'La requête a échoué.')
}

export async function requete<T>(
  methode: MethodeHttp,
  chemin: string,
  options: OptionsRequete = {},
): Promise<T> {
  const entetes: Record<string, string> = { accept: 'application/json' }
  if (METHODES_PROTEGEES.has(methode)) {
    const jeton = lireCookie('XSRF-TOKEN')
    if (jeton) entetes['x-xsrf-token'] = jeton
  }
  if (options.corps !== undefined) entetes['content-type'] = 'application/json'

  let reponse: Response
  try {
    reponse = await fetch(construireUrl(chemin, options.parametres), {
      method: methode,
      headers: entetes,
      credentials: 'same-origin',
      body:
        options.formulaire ??
        (options.corps === undefined ? undefined : JSON.stringify(options.corps)),
    })
  } catch {
    throw new ErreurApi(0, 'Le serveur est injoignable. Vérifiez votre connexion.')
  }

  const corps = await lireCorps(reponse)
  if (reponse.ok) return corps as T

  const erreur = erreurDepuis(reponse.status, corps)
  if (erreur.sessionPerdue) {
    for (const ecouteur of ecouteursSessionPerdue) ecouteur()
  }
  throw erreur
}

export const api = {
  lire: <T>(chemin: string, parametres?: OptionsRequete['parametres']) =>
    requete<T>('GET', chemin, { parametres }),
  creer: <T>(chemin: string, corps?: unknown) => requete<T>('POST', chemin, { corps }),
  remplacer: <T>(chemin: string, corps?: unknown) => requete<T>('PUT', chemin, { corps }),
  supprimer: <T = void>(chemin: string) => requete<T>('DELETE', chemin),
  televerser: <T>(chemin: string, formulaire: FormData) =>
    requete<T>('POST', chemin, { formulaire }),
  /** Remplace un fichier déjà envoyé. */
  reteleverser: <T>(chemin: string, formulaire: FormData) =>
    requete<T>('PUT', chemin, { formulaire }),
}
