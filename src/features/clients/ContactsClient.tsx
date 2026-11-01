import { Bouton } from '@/ui/Bouton'
import { ChampTexte } from '@/ui/Formulaire'
import { contactVide, type Erreurs, type LigneContact } from './saisieClient'

interface Props {
  contacts: LigneContact[]
  erreurs: Erreurs
  onChange(contacts: LigneContact[]): void
}

export function ContactsClient({ contacts, erreurs, onChange }: Props) {
  const maj = (cle: number, morceau: Partial<LigneContact>) =>
    onChange(contacts.map((c) => (c.cle === cle ? { ...c, ...morceau } : c)))

  return (
    <fieldset className="form-client__groupe">
      <legend>Contacts secondaires</legend>
      {contacts.map((c, i) => {
        const err = (champ: string) => erreurs[`contacts.${i}.${champ}`]
        return (
          <div className="form-client__ligne" key={c.cle} role="group" aria-label={`Contact ${i + 1}`}>
            <div className="form-client__duo">
              <ChampTexte
                libelle="Nom"
                value={c.nom}
                onChange={(ev) => maj(c.cle, { nom: ev.target.value })}
                erreur={err('nom')}
              />
              <ChampTexte
                libelle="Rôle"
                value={c.role}
                onChange={(ev) => maj(c.cle, { role: ev.target.value })}
                erreur={err('role')}
              />
            </div>
            <div className="form-client__duo">
              <ChampTexte
                libelle="Email"
                type="email"
                value={c.email}
                onChange={(ev) => maj(c.cle, { email: ev.target.value })}
                erreur={err('email')}
              />
              <ChampTexte
                libelle="Téléphone"
                type="tel"
                value={c.telephone}
                onChange={(ev) => maj(c.cle, { telephone: ev.target.value })}
                erreur={err('telephone')}
              />
            </div>
            <div className="form-client__ligne-pied">
              <span />
              <Bouton
                variante="fantome"
                taille="sm"
                icone="poubelle"
                onClick={() => onChange(contacts.filter((x) => x.cle !== c.cle))}
                aria-label={`Retirer le contact ${i + 1}`}
              />
            </div>
          </div>
        )
      })}
      <Bouton taille="sm" icone="plus" onClick={() => onChange([...contacts, contactVide()])}>
        Ajouter un contact
      </Bouton>
    </fieldset>
  )
}
