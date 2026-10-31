import { createContext } from 'react'
import type { ZoneDocument } from './types'

/** Rappel de ciblage fourni par `ApercuDocument` ; absent, les zones restent statiques (PDF). */
export const ContexteCible = createContext<((zone: ZoneDocument) => void) | undefined>(undefined)
