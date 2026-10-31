import { useState, type FormEvent } from 'react'
import { Bouton } from '@/ui/Bouton'
import { ChampTexte, ChampZone } from '@/ui/Formulaire'
import { Dialogue } from '@/ui/Dialogue'
import type { Devis } from './donnees'

export interface MessageEnvoi {
  destinataire: string
}

interface ModaleEnvoiProps {
  ouvert: boolean
  devis: Devis
  onFermer(): void
  onEnvoyer(message: MessageEnvoi): void
}

const ID_FORMULAIRE = 'espace-formulaire-envoi'

function FormulaireEnvoi({ devis, onEnvoyer }: Pick<ModaleEnvoiProps, 'devis' | 'onEnvoyer'>) {
  const [destinataire, setDestinataire] = useState(devis.clientEmail ?? '')
  const [objet, setObjet] = useState(`Devis ${devis.numero} – ${devis.objet}`)
  const [message, setMessage] = useState(
    `Bonjour,\n\nVeuillez trouver ci-joint notre devis ${devis.numero}.\nNous restons à votre disposition pour toute question.\n\nCordialement`,
  )
  const [erreur, setErreur] = useState('')

  const valider = (ev: FormEvent) => {
    ev.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(destinataire.trim())) {
      setErreur('Saisissez une adresse e-mail valide.')
      return
    }
    onEnvoyer({ destinataire: destinataire.trim() })
  }

  return (
    <form id={ID_FORMULAIRE} className="espace-envoi" onSubmit={valider} noValidate>
      <ChampTexte
        libelle="Destinataire"
        type="email"
        value={destinataire}
        erreur={erreur}
        onChange={(ev) => {
          setDestinataire(ev.target.value)
          setErreur('')
        }}
      />
      <ChampTexte libelle="Objet" value={objet} onChange={(ev) => setObjet(ev.target.value)} />
      <ChampZone
        libelle="Message"
        rows={6}
        value={message}
        onChange={(ev) => setMessage(ev.target.value)}
      />
    </form>
  )
}

export function ModaleEnvoi({ ouvert, devis, onFermer, onEnvoyer }: ModaleEnvoiProps) {
  return (
    <Dialogue
      ouvert={ouvert}
      onFermer={onFermer}
      titre="Envoyer le devis"
      soustitre={`${devis.numero} · le PDF sera joint au message`}
      pied={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="primaire" type="submit" form={ID_FORMULAIRE}>
            Envoyer
          </Bouton>
        </>
      }
    >
      <FormulaireEnvoi devis={devis} onEnvoyer={onEnvoyer} />
    </Dialogue>
  )
}
