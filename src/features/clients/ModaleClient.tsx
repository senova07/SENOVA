import { useState, type FormEvent } from 'react'
import { Bouton } from '@/ui/Bouton'
import { Dialogue } from '@/ui/Dialogue'
import { apiClients } from '@/services/clientsApi'
import { ErreurApi } from '@/services/http'
import { useToast } from '@/store/toastContext'
import { nomAffichageClient, type Client } from '@shared/clients'
import { AdressesClient } from './AdressesClient'
import { ChampNotes, ChampsIdentite } from './ChampsClient'
import { ContactsClient } from './ContactsClient'
import { TagsClient } from './TagsClient'
import {
  brouillonDe,
  erreursDepuisApi,
  valider,
  versSaisie,
  type Brouillon,
  type Erreurs,
} from './saisieClient'
import './formulaire-client.css'

interface Props {
  /** `null` = création. Pour une modification, la fiche complète (avec adresses et contacts). */
  client: Client | null
  onFermer(): void
  onEnregistre(client: Client): void
}

export function ModaleClient({ client, onFermer, onEnregistre }: Props) {
  const { notifier } = useToast()
  const [b, setB] = useState(() => brouillonDe(client))
  const [erreurs, setErreurs] = useState<Erreurs>({})
  const [general, setGeneral] = useState('')
  const [enCours, setEnCours] = useState(false)

  const maj = <C extends keyof Brouillon>(champ: C, valeur: Brouillon[C]) =>
    setB((p) => ({ ...p, [champ]: valeur }))

  const envoyer = async (ev: FormEvent) => {
    ev.preventDefault()
    setGeneral('')
    const manques = valider(b)
    setErreurs(manques)
    if (Object.keys(manques).length > 0) return

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
      const parChamp = erreursDepuisApi(err.details)
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
      <form id="form-client" className="form-client" onSubmit={(ev) => void envoyer(ev)} noValidate>
        {general ? (
          <p className="alerte-form" role="alert">
            {general}
          </p>
        ) : null}
        <ChampsIdentite b={b} erreurs={erreurs} maj={maj} />
        <AdressesClient adresses={b.adresses} erreurs={erreurs} onChange={(a) => maj('adresses', a)} />
        <ContactsClient contacts={b.contacts} erreurs={erreurs} onChange={(c) => maj('contacts', c)} />
        <TagsClient tags={b.tags} erreur={erreurTags} onChange={(t) => maj('tags', t)} />
        <ChampNotes b={b} erreurs={erreurs} maj={maj} />
      </form>
    </Dialogue>
  )
}
