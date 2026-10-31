import { describe, expect, it } from 'vitest'
import { REGLAGES_PAR_DEFAUT } from '../api'
import { CHARTE_PAR_DEFAUT } from '../rendu'
import { avertissementsContraste } from './contraste'
import { historiqueInitial, LIMITE_HISTORIQUE, reducteurHistorique, type Historique } from './historique'
import { egal } from './egalite'
import { mentionsManquantes } from './mentionsManquantes'
import { REGLE_LOGO, validerDimensions, validerImage } from './image'
import { calculerProgression } from './progression'
import { adresseImprimee, documentApercu, mentionsDepuisOrganisation, prerempliDepuisOrganisation } from './reglages'
import { deplacerLuminosite, deplacerSurRoue, positionDepuisTeinte, teinteDepuisPosition, tslDepuisClic } from './roue'

const organisation = {
  nom: 'Plomberie Durand', formeJuridique: 'SARL', siret: '81234567800021', tvaIntracom: 'FR32812345678',
  adresse: '3 rue Haute', codePostal: '69001', ville: 'Lyon', email: 'a@b.fr', telephone: '0400000000',
}

describe('progression', () => {
  const preremplis = prerempliDepuisOrganisation(organisation, REGLAGES_PAR_DEFAUT)
  it('compte les vraies données de l’organisation', () => {
    const p = calculerProgression(CHARTE_PAR_DEFAUT, preremplis, adresseImprimee(organisation))
    const ids = p.elements.filter((e) => !e.ok).map((e) => e.id)
    // Sans logo, assurance ni IBAN : 4 éléments sur 7 sont faits.
    expect(ids).toEqual(['logo', 'mentions', 'iban'])
    expect(p.pourcentage).toBe(57)
  })
  it('atteint 100 % quand tout est renseigné', () => {
    const reglages = { ...REGLAGES_PAR_DEFAUT, mentions: { ...REGLAGES_PAR_DEFAUT.mentions, assureur: 'MAAF', contratAssurance: '1', iban: 'FR76' } }
    const p = calculerProgression({ ...CHARTE_PAR_DEFAUT, logo: 'data:image/png;base64,AA' }, prerempliDepuisOrganisation(organisation, reglages), adresseImprimee(organisation))
    expect(p.pourcentage).toBe(100)
  })
  it('signale l’adresse manquante', () => {
    const p = calculerProgression(CHARTE_PAR_DEFAUT, preremplis, adresseImprimee({ ...organisation, adresse: null }))
    expect(p.elements.find((e) => e.id === 'mentions')?.ok).toBe(false)
  })
  it('chaque manque renvoie à une section', () => {
    const p = calculerProgression(CHARTE_PAR_DEFAUT, preremplis, adresseImprimee(organisation))
    expect(p.elements.every((e) => e.section.startsWith('apparence-'))).toBe(true)
  })
})

describe('historique', () => {
  const ajouter = (n: number) => (v: number) => v + n
  const base = historiqueInitial(0)
  it('annule la dernière modification', () => {
    const e = reducteurHistorique(reducteurHistorique(base, { type: 'modifier', maj: ajouter(1) }), { type: 'modifier', maj: ajouter(1) })
    expect(e.present).toBe(2)
    expect(reducteurHistorique(e, { type: 'annuler' }).present).toBe(1)
  })
  it('ne fait rien quand l’historique est vide', () => {
    expect(reducteurHistorique(base, { type: 'annuler' })).toBe(base)
  })
  it('regroupe les gestes continus de même clé', () => {
    let e: Historique<number> = base
    for (let i = 0; i < 5; i++) e = reducteurHistorique(e, { type: 'modifier', maj: ajouter(1), cle: 'roue' })
    expect(e.passe).toHaveLength(1)
    expect(reducteurHistorique(e, { type: 'annuler' }).present).toBe(0)
  })
  it('sépare deux choix sans clé', () => {
    let e: Historique<number> = base
    for (let i = 0; i < 3; i++) e = reducteurHistorique(e, { type: 'modifier', maj: ajouter(1) })
    expect(e.passe).toHaveLength(3)
  })
  it('clore sépare deux gestes de même clé', () => {
    let e: Historique<number> = base
    e = reducteurHistorique(e, { type: 'modifier', maj: ajouter(1), cle: 'roue' })
    e = reducteurHistorique(e, { type: 'modifier', maj: ajouter(1), cle: 'roue' })
    e = reducteurHistorique(e, { type: 'clore' })
    e = reducteurHistorique(e, { type: 'modifier', maj: ajouter(1), cle: 'roue' })
    expect(e.passe).toHaveLength(2)
  })
  it('remplacer est annulable et la taille est bornée', () => {
    let e: Historique<number> = reducteurHistorique(base, { type: 'remplacer', valeur: 9 })
    expect(reducteurHistorique(e, { type: 'annuler' }).present).toBe(0)
    for (let i = 0; i < LIMITE_HISTORIQUE + 10; i++) e = reducteurHistorique(e, { type: 'modifier', maj: ajouter(1) })
    expect(e.passe).toHaveLength(LIMITE_HISTORIQUE)
  })
})

describe('validerImage', () => {
  it('accepte PNG, JPG et SVG', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/svg+xml']) expect(validerImage({ type, size: 1000 }, REGLE_LOGO)).toBeNull()
  })
  it('refuse un autre type', () => {
    expect(validerImage({ type: 'application/pdf', size: 1000 }, REGLE_LOGO)).toMatch(/PNG, JPG ou SVG/)
  })
  it('refuse un fichier vide ou trop lourd', () => {
    expect(validerImage({ type: 'image/png', size: 0 }, REGLE_LOGO)).toMatch(/vide/)
    expect(validerImage({ type: 'image/png', size: REGLE_LOGO.tailleMax + 1 }, REGLE_LOGO)).toMatch(/trop lourde/)
  })
})

describe('mentions préremplies', () => {
  it('reprend SIRET, TVA et forme juridique de l’organisation', () => {
    expect(mentionsDepuisOrganisation(organisation)).toEqual({ siret: '81234567800021', numeroTva: 'FR32812345678', formeJuridique: 'SARL' })
  })
  it('une valeur saisie l’emporte, les champs absents restent vides', () => {
    const r = prerempliDepuisOrganisation({ ...organisation, tvaIntracom: null }, {
      ...REGLAGES_PAR_DEFAUT, mentions: { ...REGLAGES_PAR_DEFAUT.mentions, siret: '999' },
    })
    expect(r.mentions).toMatchObject({ siret: '999', numeroTva: '', formeJuridique: 'SARL', iban: '' })
  })
  it('décline l’aperçu par type avec la vraie organisation', () => {
    const facture = documentApercu('facture', organisation, REGLAGES_PAR_DEFAUT)
    expect(facture.emetteur.nom).toBe('Plomberie Durand')
    expect(facture.type).toBe('facture')
    expect(facture.totaux.resteAPayer).toBeCloseTo(713.58)
    const avoir = documentApercu('avoir', organisation, REGLAGES_PAR_DEFAUT)
    expect(avoir.totaux.acompte).toBeUndefined()
    expect(avoir.referenceLiee).toBeDefined()
  })
})

describe('roue chromatique', () => {
  it('convertit position et teinte dans les deux sens', () => {
    for (const t of [0, 45, 90, 180, 270, 359]) {
      const { x, y } = positionDepuisTeinte(t, 0.8, 100)
      expect(teinteDepuisPosition(x, y)).toBeCloseTo(t, 5)
    }
  })
  it('0° est à gauche, 90° en haut', () => {
    expect(teinteDepuisPosition(-10, 0)).toBeCloseTo(0)
    expect(teinteDepuisPosition(0, -10)).toBeCloseTo(90)
  })
  it('borne la saturation au bord et garde la luminosité', () => {
    expect(tslDepuisClic(300, 0, 100, 0.4)).toMatchObject({ s: 1, l: 0.4 })
  })
  it('les flèches tournent la teinte, bornent la saturation et ignorent les autres touches', () => {
    expect(deplacerSurRoue({ t: 2, s: 1, l: 0.5 }, 'ArrowLeft', false)?.t).toBe(358)
    expect(deplacerSurRoue({ t: 2, s: 1, l: 0.5 }, 'ArrowUp', false)?.s).toBe(1)
    expect(deplacerSurRoue({ t: 0, s: 0, l: 0.5 }, 'a', false)).toBeNull()
    expect(deplacerLuminosite(0.98, 'ArrowUp', false)).toBe(1)
    expect(deplacerLuminosite(0.5, 'x', false)).toBeNull()
  })
})

describe('avertissement de contraste', () => {
  it('rien pour la charte par défaut', () => {
    expect(avertissementsContraste(CHARTE_PAR_DEFAUT)).toEqual([])
  })
  it('signale une couleur principale trop claire', () => {
    const [a] = avertissementsContraste({ couleurPrincipale: '#F5D76E', couleurAccent: '#16B8B0' })
    expect(a?.role).toBe('principale')
    expect(a?.message).toMatch(/difficiles à lire/)
  })
})

describe('dimensions des images', () => {
  it('refuse plus de 4000 px dans une dimension', () => {
    expect(validerDimensions({ width: 4000, height: 4000 }, REGLE_LOGO)).toBeNull()
    expect(validerDimensions({ width: 4001, height: 100 }, REGLE_LOGO)).toMatch(/trop grande/)
    expect(validerDimensions({ width: 100, height: 6000 }, REGLE_LOGO)).toMatch(/4000/)
  })
  it('un SVG sans taille propre passe', () => {
    expect(validerDimensions({ width: 0, height: 0 }, REGLE_LOGO)).toBeNull()
  })
})

describe('mentions manquantes', () => {
  const pleines = { ...REGLAGES_PAR_DEFAUT.mentions, siret: '1', numeroTva: '1', formeJuridique: 'SARL', assureur: 'A', contratAssurance: '1', iban: 'FR' }
  it('rien ne manque quand tout est imprimé', () => {
    expect(mentionsManquantes(pleines, '3 rue Haute, 69001 Lyon')).toEqual([])
  })
  it('signale l’adresse et les mentions vides, y compris des espaces', () => {
    expect(mentionsManquantes({ ...pleines, iban: '  ', assureur: '' }, '')).toEqual(['adresse', 'assureur', 'iban'])
  })
})

describe('égalité du brouillon', () => {
  it('court-circuite sur la référence et ignore les clés undefined', () => {
    const logo = 'data:image/png;base64,' + 'A'.repeat(1000)
    expect(egal({ logo, a: { b: 1 } }, { logo, a: { b: 1 } })).toBe(true)
    expect(egal({ x: 1, logo: undefined }, { x: 1 })).toBe(true)
    expect(egal({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false)
  })
})
