import { describe, expect, it } from 'vitest'
import type { Organisation } from '@shared/session'
import { calculerTotaux } from './calculs'
import { DEVIS_DEMO } from './demo'
import type { Devis } from './types'
import { adresseDepuisTexte, versDocument } from './versDocument'

const organisation: Organisation = {
  id: 'o1',
  nom: 'Atelier Martin',
  formeJuridique: 'SARL',
  siren: null,
  siret: '812 345 678 00021',
  tvaIntracom: 'FR32812345678',
  adresse: '12 rue des Artisans',
  codePostal: '69003',
  ville: 'Lyon',
  pays: 'FR',
  email: 'contact@atelier-martin.fr',
  telephone: '04 78 12 34 56',
}

const devis: Devis = {
  ...DEVIS_DEMO[1]!, // remise de 300 € en montant, acompte 30 %
  adresseChantier: { rue: '1 rue X', codePostal: '69001', ville: 'Lyon' },
  notes: 'Merci',
}

describe('versDocument', () => {
  const doc = versDocument(devis, organisation)

  it('reprend les totaux de calculs, montants positifs', () => {
    const t = calculerTotaux(devis.lignes, devis.remise, devis.acomptePourcent)
    expect(doc.totaux.totalHt).toBe(t.totalHt)
    expect(doc.totaux.sousTotalHt).toBe(t.totalHtBrut)
    expect(doc.totaux.remise).toBe(300)
    expect(doc.totaux.totalTtc).toBe(t.totalTtc)
    expect(doc.totaux.tva).toEqual(t.tva)
    expect(doc.totaux.acompte).toEqual({ pourcentage: 30, montant: t.acompte })
  })

  it('prend l’émetteur dans l’organisation et le client dans le devis', () => {
    expect(doc.emetteur).toMatchObject({ nom: 'Atelier Martin', adresse: { codePostal: '69003', ville: 'Lyon' } })
    expect(doc.mentions.siret).toBe('812 345 678 00021')
    expect(doc.client).toEqual({
      nom: 'Martin Dupont',
      adresse: { rue: '23 rue Victor Hugo', codePostal: '69100', ville: 'Villeurbanne' },
    })
    expect(doc.adresseChantier?.rue).toBe('1 rue X')
    expect(doc.texteLibre).toBe('Merci')
  })

  it('convertit sections (sous-total), prestations et textes dans l’ordre', () => {
    const d = versDocument(DEVIS_DEMO[0]!, organisation)
    expect(d.lignes.map((l) => l.type)).toEqual([
      'section', 'prestation', 'prestation', 'section', 'prestation', 'prestation', 'prestation',
    ])
    expect(d.lignes[0]).toMatchObject({ type: 'section', totalHt: 492 })
    expect(d.dateEcheance).toBe('2026-11-23')
  })

  it('sans client ni organisation : client null, rien d’inventé', () => {
    const vide = versDocument({ ...devis, clientNom: '', clientAdresse: '', acomptePourcent: 0 }, null)
    expect(vide.client).toBeNull()
    expect(vide.emetteur.nom).toBe('')
    expect(vide.totaux.acompte).toBeUndefined()
  })
})

it('adresseDepuisTexte lit « code postal ville » sur la dernière ligne', () => {
  expect(adresseDepuisTexte('8 place Bellecour\n69002 Lyon')).toEqual({
    rue: '8 place Bellecour', codePostal: '69002', ville: 'Lyon',
  })
  expect(adresseDepuisTexte('Sans code')).toEqual({ rue: 'Sans code', codePostal: '', ville: '' })
})
