import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Bouton } from '@/ui/Bouton'
import { ChampSelect, ChampTexte, ChampZone } from '@/ui/Formulaire'
import { Icone } from '@/ui/Icone'
import { Dialogue } from '@/ui/Dialogue'
import { ErreurApi } from '@/services/http'
import { apiClients } from '@/services/clientsApi'
import { useToast } from '@/store/toastContext'
import {
  nomAffichageClient,
  type Client,
  type ClientSaisie,
  type NatureClient,
} from '@shared/clients'

interface LigneAdresse {
  cle: number
  libelle: string
  ligne1: string
  ligne2: string
  codePostal: string
  ville: string
  pays: string
  parDefaut: boolean
}

interface LigneContact {
  cle: number
  nom: string
  role: string
  email: string
  telephone: string
}

interface Brouillon {
  nature: NatureClient
  nom: string
  prenom: string
  email: string
  telephone: string
  siren: string
  siret: string
  tvaIntracom: string
  notes: string
  tags: string[]
  adresses: LigneAdresse[]
  contacts: LigneContact[]
}

type Erreurs = Record<string, string>

interface Props {
  /** `null` = création. Pour une modification, la fiche complète (avec adresses et contacts). */
  client: Client | null
  onFermer(): void
  onEnregistre(client: Client): void
}

const vers = (t: string) => t.trim() || null

let derniereCle = 0
const nouvelleCle = () => ++derniereCle

function depuis(client: Client | null): Brouillon {
  return {
    nature: client?.nature ?? 'particulier',
    nom: client?.nom ?? '',
    prenom: client?.prenom ?? '',
    email: client?.email ?? '',
    telephone: client?.telephone ?? '',
    siren: client?.siren ?? '',
    siret: client?.siret ?? '',
    tvaIntracom: client?.tvaIntracom ?? '',
    notes: client?.notes ?? '',
    tags: client?.tags ?? [],
    adresses: (client?.adresses ?? []).map((a) => ({
      cle: nouvelleCle(),
      libelle: a.libelle,
      ligne1: a.ligne1,
      ligne2: a.ligne2 ?? '',
      codePostal: a.codePostal,
      ville: a.ville,
      pays: a.pays,
      parDefaut: a.parDefaut,
    })),
    contacts: (client?.contacts ?? []).map((c) => ({
      cle: nouvelleCle(),
      nom: c.nom,
      role: c.role ?? '',
      email: c.email ?? '',
      telephone: c.telephone ?? '',
    })),
  }
}

function versSaisie(b: Brouillon): ClientSaisie {
  const entreprise = b.nature === 'entreprise'
  return {
    nature: b.nature,
    nom: b.nom.trim(),
    prenom: entreprise ? null : vers(b.prenom),
    email: vers(b.email),
    telephone: vers(b.telephone),
    siren: entreprise ? vers(b.siren) : null,
    siret: entreprise ? vers(b.siret) : null,
    tvaIntracom: entreprise ? vers(b.tvaIntracom) : null,
    notes: vers(b.notes),
    tags: b.tags,
    adresses: b.adresses.map((a) => ({
      libelle: a.libelle.trim(),
      ligne1: a.ligne1.trim(),
      ligne2: vers(a.ligne2),
      codePostal: a.codePostal.trim(),
      ville: a.ville.trim(),
      pays: a.pays.trim() || 'FR',
      parDefaut: a.parDefaut,
    })),
    contacts: b.contacts.map((c) => ({
      nom: c.nom.trim(),
      role: vers(c.role),
      email: vers(c.email),
      telephone: vers(c.telephone),
    })),
  }
}

export function ModaleClient({ client, onFermer, onEnregistre }: Props) {
  const { notifier } = useToast()
  const [b, setB] = useState(() => depuis(client))
  const [saisieTag, setSaisieTag] = useState('')
  const [erreurs, setErreurs] = useState<Erreurs>({})
  const [general, setGeneral] = useState('')
  const [enCours, setEnCours] = useState(false)

  const maj = <C extends keyof Brouillon>(champ: C, valeur: Brouillon[C]) =>
    setB((p) => ({ ...p, [champ]: valeur }))
  const majAdresse = (cle: number, morceau: Partial<LigneAdresse>) =>
    setB((p) => ({
      ...p,
      adresses: p.adresses.map((a) => (a.cle === cle ? Object.assign({}, a, morceau) : a)),
    }))
  const majContact = (cle: number, morceau: Partial<LigneContact>) =>
    setB((p) => ({
      ...p,
      contacts: p.contacts.map((c) => (c.cle === cle ? Object.assign({}, c, morceau) : c)),
    }))

  const entreprise = b.nature === 'entreprise'

  const ajouterTag = () => {
    const tag = saisieTag.trim()
    if (tag && !b.tags.some((t) => t.toLowerCase() === tag.toLowerCase()))
      maj('tags', [...b.tags, tag])
    setSaisieTag('')
  }
  const surToucheTag = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter' || ev.key === ',') {
      ev.preventDefault()
      ajouterTag()
    } else if (ev.key === 'Backspace' && !saisieTag && b.tags.length) {
      maj('tags', b.tags.slice(0, -1))
    }
  }

  const ajouterAdresse = () =>
    setB((p) => ({
      ...p,
      adresses: [
        ...p.adresses,
        {
          cle: nouvelleCle(),
          libelle: p.adresses.length === 0 ? 'Principale' : '',
          ligne1: '',
          ligne2: '',
          codePostal: '',
          ville: '',
          pays: 'FR',
          parDefaut: p.adresses.length === 0,
        },
      ],
    }))
  const retirerAdresse = (cle: number) =>
    setB((p) => {
      const reste = p.adresses.filter((a) => a.cle !== cle)
      // Tant qu'il reste une adresse, l'une d'elles est par défaut.
      const sansDefaut = !reste.some((a) => a.parDefaut)
      return {
        ...p,
        adresses: reste.map((a, i) => (sansDefaut && i === 0 ? { ...a, parDefaut: true } : a)),
      }
    })
  const choisirDefaut = (cle: number) =>
    setB((p) => ({ ...p, adresses: p.adresses.map((a) => ({ ...a, parDefaut: a.cle === cle })) }))

  const envoyer = async (ev: FormEvent) => {
    ev.preventDefault()
    setGeneral('')
    if (!b.nom.trim()) {
      setErreurs({ nom: entreprise ? 'Renseignez la raison sociale.' : 'Renseignez le nom.' })
      return
    }
    setErreurs({})
    setEnCours(true)
    try {
      const saisie = versSaisie(b)
      const enregistre = client
        ? await apiClients.modifier(client.id, saisie)
        : await apiClients.creer(saisie)
      notifier(client ? 'Client modifié' : 'Client créé', {
        message: nomAffichageClient(enregistre),
        ton: 'succes',
      })
      onEnregistre(enregistre)
    } catch (err) {
      if (!(err instanceof ErreurApi)) return setGeneral('Enregistrement impossible.')
      const parChamp: Erreurs = {}
      for (const d of err.details) if (d.field && !parChamp[d.field]) parChamp[d.field] = d.message
      setErreurs(parChamp)
      if (Object.keys(parChamp).length === 0) setGeneral(err.message)
    } finally {
      setEnCours(false)
    }
  }

  const erreurTags = Object.entries(erreurs).find(([champ]) => champ.startsWith('tags'))?.[1]

  return (
    <Dialogue
      ouvert
      onFermer={onFermer}
      titre={client ? 'Modifier le client' : 'Nouveau client'}
      soustitre="Un particulier ou une entreprise, avec ses adresses et ses contacts."
      pied={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="primaire" type="submit" form="form-client" disabled={enCours}>
            {client ? 'Enregistrer' : 'Créer le client'}
          </Bouton>
        </>
      }
    >
      <form id="form-client" className="form-client" onSubmit={envoyer} noValidate>
        {general ? (
          <p className="alerte-form" role="alert">
            {general}
          </p>
        ) : null}

        <ChampSelect
          libelle="Nature"
          value={b.nature}
          onChange={(ev) => maj('nature', ev.target.value as NatureClient)}
        >
          <option value="particulier">Particulier</option>
          <option value="entreprise">Entreprise</option>
        </ChampSelect>

        <div className="form-client__duo">
          <ChampTexte
            libelle={entreprise ? 'Raison sociale' : 'Nom'}
            value={b.nom}
            onChange={(ev) => maj('nom', ev.target.value)}
            erreur={erreurs.nom}
            maxLength={150}
          />
          {entreprise ? null : (
            <ChampTexte
              libelle="Prénom"
              value={b.prenom}
              onChange={(ev) => maj('prenom', ev.target.value)}
              erreur={erreurs.prenom}
              maxLength={100}
            />
          )}
        </div>

        <div className="form-client__duo">
          <ChampTexte
            libelle="Email"
            type="email"
            value={b.email}
            onChange={(ev) => maj('email', ev.target.value)}
            erreur={erreurs.email}
          />
          <ChampTexte
            libelle="Téléphone"
            type="tel"
            value={b.telephone}
            onChange={(ev) => maj('telephone', ev.target.value)}
            erreur={erreurs.telephone}
          />
        </div>

        {entreprise ? (
          <fieldset className="form-client__groupe">
            <legend>Identité de l’entreprise</legend>
            <div className="form-client__trio">
              <ChampTexte
                libelle="SIREN"
                inputMode="numeric"
                value={b.siren}
                onChange={(ev) => maj('siren', ev.target.value)}
                erreur={erreurs.siren ? '9 chiffres attendus.' : undefined}
                aide="9 chiffres"
              />
              <ChampTexte
                libelle="SIRET"
                inputMode="numeric"
                value={b.siret}
                onChange={(ev) => maj('siret', ev.target.value)}
                erreur={erreurs.siret ? '14 chiffres attendus.' : undefined}
                aide="14 chiffres"
              />
              <ChampTexte
                libelle="TVA intracommunautaire"
                value={b.tvaIntracom}
                onChange={(ev) => maj('tvaIntracom', ev.target.value)}
                erreur={erreurs.tvaIntracom}
              />
            </div>
          </fieldset>
        ) : null}

        <fieldset className="form-client__groupe">
          <legend>Adresses</legend>
          {b.adresses.map((a, i) => {
            const err = (c: string) => erreurs[`adresses.${i}.${c}`]
            return (
              <div
                className="form-client__ligne"
                key={a.cle}
                role="group"
                aria-label={`Adresse ${i + 1}`}
              >
                <div className="form-client__duo">
                  <ChampTexte
                    libelle="Libellé"
                    value={a.libelle}
                    onChange={(ev) => majAdresse(a.cle, { libelle: ev.target.value })}
                    erreur={err('libelle')}
                  />
                  <ChampTexte
                    libelle="Adresse"
                    value={a.ligne1}
                    onChange={(ev) => majAdresse(a.cle, { ligne1: ev.target.value })}
                    erreur={err('ligne1')}
                  />
                </div>
                <ChampTexte
                  libelle="Complément"
                  value={a.ligne2}
                  onChange={(ev) => majAdresse(a.cle, { ligne2: ev.target.value })}
                />
                <div className="form-client__duo">
                  <ChampTexte
                    libelle="Code postal"
                    value={a.codePostal}
                    onChange={(ev) => majAdresse(a.cle, { codePostal: ev.target.value })}
                    erreur={err('codePostal')}
                  />
                  <ChampTexte
                    libelle="Ville"
                    value={a.ville}
                    onChange={(ev) => majAdresse(a.cle, { ville: ev.target.value })}
                    erreur={err('ville')}
                  />
                </div>
                <ChampTexte
                  libelle="Pays"
                  value={a.pays}
                  maxLength={2}
                  onChange={(ev) => majAdresse(a.cle, { pays: ev.target.value.toUpperCase() })}
                  erreur={err('pays')}
                />
                <div className="form-client__ligne-pied">
                  <label className="case">
                    <input
                      type="radio"
                      name="adresse-defaut"
                      checked={a.parDefaut}
                      onChange={() => choisirDefaut(a.cle)}
                    />
                    Adresse par défaut
                  </label>
                  <Bouton
                    variante="fantome"
                    taille="sm"
                    icone="poubelle"
                    onClick={() => retirerAdresse(a.cle)}
                    aria-label={`Retirer l’adresse ${i + 1}`}
                  />
                </div>
              </div>
            )
          })}
          <Bouton taille="sm" icone="plus" onClick={ajouterAdresse}>
            Ajouter une adresse
          </Bouton>
        </fieldset>

        <fieldset className="form-client__groupe">
          <legend>Contacts secondaires</legend>
          {b.contacts.map((c, i) => {
            const err = (champ: string) => erreurs[`contacts.${i}.${champ}`]
            return (
              <div
                className="form-client__ligne"
                key={c.cle}
                role="group"
                aria-label={`Contact ${i + 1}`}
              >
                <div className="form-client__duo">
                  <ChampTexte
                    libelle="Nom"
                    value={c.nom}
                    onChange={(ev) => majContact(c.cle, { nom: ev.target.value })}
                    erreur={err('nom')}
                  />
                  <ChampTexte
                    libelle="Rôle"
                    value={c.role}
                    onChange={(ev) => majContact(c.cle, { role: ev.target.value })}
                    erreur={err('role')}
                  />
                </div>
                <div className="form-client__duo">
                  <ChampTexte
                    libelle="Email"
                    type="email"
                    value={c.email}
                    onChange={(ev) => majContact(c.cle, { email: ev.target.value })}
                    erreur={err('email')}
                  />
                  <ChampTexte
                    libelle="Téléphone"
                    type="tel"
                    value={c.telephone}
                    onChange={(ev) => majContact(c.cle, { telephone: ev.target.value })}
                    erreur={err('telephone')}
                  />
                </div>
                <div className="form-client__ligne-pied">
                  <span />
                  <Bouton
                    variante="fantome"
                    taille="sm"
                    icone="poubelle"
                    onClick={() =>
                      setB((p) => ({ ...p, contacts: p.contacts.filter((x) => x.cle !== c.cle) }))
                    }
                    aria-label={`Retirer le contact ${i + 1}`}
                  />
                </div>
              </div>
            )
          })}
          <Bouton
            taille="sm"
            icone="plus"
            onClick={() =>
              setB((p) => ({
                ...p,
                contacts: [
                  ...p.contacts,
                  { cle: nouvelleCle(), nom: '', role: '', email: '', telephone: '' },
                ],
              }))
            }
          >
            Ajouter un contact
          </Bouton>
        </fieldset>

        <div className={['champ', erreurTags ? 'champ--erreur' : ''].filter(Boolean).join(' ')}>
          <label className="champ__libelle" htmlFor="saisie-tag">
            Tags
          </label>
          <div className="client-tags-saisie">
            {b.tags.map((t) => (
              <span className="client-tag" key={t}>
                {t}
                <button
                  type="button"
                  className="client-tag__retirer"
                  aria-label={`Retirer le tag ${t}`}
                  onClick={() =>
                    maj(
                      'tags',
                      b.tags.filter((x) => x !== t),
                    )
                  }
                >
                  <Icone nom="fermer" taille={12} />
                </button>
              </span>
            ))}
            <input
              id="saisie-tag"
              className="client-tags-saisie__champ"
              value={saisieTag}
              onChange={(ev) => setSaisieTag(ev.target.value)}
              onKeyDown={surToucheTag}
              onBlur={ajouterTag}
              placeholder={b.tags.length ? '' : 'Ex. fidèle, syndic…'}
              maxLength={40}
            />
          </div>
          <p className={erreurTags ? 'champ__erreur' : 'champ__aide'}>
            {erreurTags ?? 'Entrée ou virgule pour valider un tag.'}
          </p>
        </div>

        <ChampZone
          libelle="Notes internes"
          value={b.notes}
          onChange={(ev) => maj('notes', ev.target.value)}
          erreur={erreurs.notes}
          maxLength={5000}
        />
      </form>
    </Dialogue>
  )
}
